"""
FINA-ENTERPRISE Multimodal Receipt Forensics Router
Endpoint analisis ELA (Error Level Analysis), deteksi manipulasi nota fisik, dan pembukuan SAK EMKM.

Standar: Hexagonal Architecture / Ports & Adapters
Security: Tenant-scoped data isolation via JWT Bearer Token
Compliance: SAK EMKM Double-Entry Balancing & SHA-256 Merkle Chaining
Database: PostgreSQL 16 ('receipt_forensics', 'journal_entries', & 'journal_lines')
"""

from typing import List, Optional, Any
from datetime import datetime, timezone
import json
import uuid
import hashlib
import base64

from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile, Form
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.auth import get_current_user, require_role
from app.domain.models import UserCredential, ReceiptForensicsRecord, JournalEntry, JournalLine, Account
from app.domain.services import (
    AccountingService,
    COA_CASH_ON_HAND,
    COA_INVENTORY_RAW,
    COA_OPERATING_EXPENSE
)
from app.domain.services.ai_service import ai_service
from app.infrastructure.database import get_db

router = APIRouter(prefix="/forensics", tags=["Receipt Forensics Studio"])

_require_manager = require_role(["OWNER", "MANAGER"])


# --- Pydantic Schemas ---

class ReceiptItemSchema(BaseModel):
    name: str
    qty: int = 1
    unitPrice: float
    subtotal: float


class ReceiptForensicsSchema(BaseModel):
    id: str
    receipt_number: str
    merchant_name: str
    transaction_date: str
    subtotal: float
    tax_amount: float
    grand_total: float
    ela_integrity_score: int
    is_tampered: bool
    tampering_details: Optional[str] = None
    items: List[ReceiptItemSchema] = []
    audit_merkle_hash: str
    status: str
    journal_entry_id: Optional[str] = None
    created_at: str


class AnalyzeReceiptPayload(BaseModel):
    receipt_number: str = Field(..., min_length=3, max_length=64)
    merchant_name: str = Field(..., min_length=2, max_length=255)
    transaction_date: Optional[str] = None
    items: List[ReceiptItemSchema] = []
    subtotal: float = Field(..., gt=0)
    tax_amount: float = Field(default=0.0, ge=0)
    grand_total: float = Field(..., gt=0)
    simulate_tamper: bool = False
    image_base64: Optional[str] = None


# --- Endpoints ---

@router.get(
    "/records",
    response_model=List[ReceiptForensicsSchema],
    summary="Daftar Arsip Forensik Struk & Nota Belanja Tenant (PostgreSQL-backed)"
)
async def list_forensics_records(
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=30, le=100)
):
    """
    Mengambil riwayat analisis forensik nota/struk belanja fisik tenant dari PostgreSQL.
    """
    stmt = (
        select(ReceiptForensicsRecord)
        .where(ReceiptForensicsRecord.tenant_id == current_user.tenant_id)
        .order_by(ReceiptForensicsRecord.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    output: List[ReceiptForensicsSchema] = []
    for r in records:
        parsed_items: List[ReceiptItemSchema] = []
        if r.items_json:
            try:
                raw_items = json.loads(r.items_json)
                parsed_items = [
                    ReceiptItemSchema(
                        name=it.get("name", "Item"),
                        qty=it.get("qty", 1),
                        unitPrice=float(it.get("unitPrice", 0)),
                        subtotal=float(it.get("subtotal", 0))
                    )
                    for it in raw_items
                ]
            except Exception:
                pass

        output.append(
            ReceiptForensicsSchema(
                id=r.id,
                receipt_number=r.receipt_number,
                merchant_name=r.merchant_name,
                transaction_date=r.transaction_date,
                subtotal=float(r.subtotal),
                tax_amount=float(r.tax_amount),
                grand_total=float(r.grand_total),
                ela_integrity_score=r.ela_integrity_score,
                is_tampered=r.is_tampered,
                tampering_details=r.tampering_details,
                items=parsed_items,
                audit_merkle_hash=r.audit_merkle_hash,
                status=r.status,
                journal_entry_id=r.journal_entry_id,
                created_at=r.created_at.isoformat() if r.created_at else ""
            )
        )
    return output


@router.post(
    "/analyze",
    response_model=ReceiptForensicsSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Analisis Forensik Dokumen Nota Belanja & Deteksi Anomali ELA"
)
async def analyze_receipt(
    payload: AnalyzeReceiptPayload,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Menjalankan algoritma Error Level Analysis (ELA) nyata dan audit integritas matematis nota:
    1. Memverifikasi apakah subtotal item cocok dengan total nota (anti-arithmetic tampering).
    2. Mendeteksi anomali kompresi frekuensi tinggi piksel JPEG / ELA dengan Computer Vision.
    3. Jika gambar disertakan (Base64), memproses dengan Gemini Multimodal Vision & Pillow ELA Matrix.
    4. Menerbitkan SHA-256 Merkle hash dan menyimpan hasil audit ke database PostgreSQL.
    """
    now = datetime.now(timezone.utc)
    tgl = payload.transaction_date or now.strftime("%Y-%m-%d %H:%M:%S")

    # Decode image jika ada
    img_bytes = None
    if payload.image_base64:
        try:
            raw_b64 = payload.image_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            img_bytes = base64.b64decode(raw_b64)
        except Exception:
            img_bytes = None

    # Jalankan Real AI Service (ELA + Gemini Multimodal Vision + Aritmatika)
    ai_result = ai_service.analyze_receipt_multimodal(
        image_bytes=img_bytes,
        subtotal=payload.subtotal,
        grand_total=payload.grand_total,
        items=[it.model_dump() for it in payload.items]
    )

    ela_score = ai_result["ela_score"]
    is_tampered = ai_result["is_tampered"] or payload.simulate_tamper
    tampering_details = ai_result["details"]

    if payload.simulate_tamper and not is_tampered:
        is_tampered = True
        ela_score = 38
        tampering_details = "Simulasi manipulasi digital: Diskontinuitas piksel dan selisih kompresi frekuensi tinggi aktif."

    rec_id = f"rf-{uuid.uuid4().hex[:12]}"
    hash_payload = f"{payload.receipt_number}:{current_user.tenant_id}:{payload.grand_total}:{now.isoformat()}:{ela_score}"
    merkle_hash = f"sha256:{hashlib.sha256(hash_payload.encode()).hexdigest()}"

    new_record = ReceiptForensicsRecord(
        id=rec_id,
        tenant_id=current_user.tenant_id,
        receipt_number=payload.receipt_number.strip(),
        merchant_name=payload.merchant_name.strip(),
        transaction_date=tgl,
        subtotal=payload.subtotal,
        tax_amount=payload.tax_amount,
        grand_total=payload.grand_total,
        ela_integrity_score=ela_score,
        is_tampered=is_tampered,
        tampering_details=tampering_details,
        items_json=json.dumps([it.model_dump() for it in payload.items]),
        audit_merkle_hash=merkle_hash,
        status="TAMPERED" if is_tampered else "VERIFIED",
        created_at=now
    )

    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)

    return ReceiptForensicsSchema(
        id=new_record.id,
        receipt_number=new_record.receipt_number,
        merchant_name=new_record.merchant_name,
        transaction_date=new_record.transaction_date,
        subtotal=float(new_record.subtotal),
        tax_amount=float(new_record.tax_amount),
        grand_total=float(new_record.grand_total),
        ela_integrity_score=new_record.ela_integrity_score,
        is_tampered=new_record.is_tampered,
        tampering_details=new_record.tampering_details,
        items=payload.items,
        audit_merkle_hash=new_record.audit_merkle_hash,
        status=new_record.status,
        created_at=new_record.created_at.isoformat() if new_record.created_at else ""
    )


@router.post(
    "/upload-and-analyze",
    response_model=ReceiptForensicsSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Unggah Foto Nota Asli & Analisis Real Computer Vision ELA + Gemini Vision"
)
async def upload_and_analyze_receipt(
    file: UploadFile = File(...),
    subtotal: float = Form(default=0.0),
    grand_total: float = Form(default=0.0),
    receipt_number: Optional[str] = Form(default=None),
    merchant_name: Optional[str] = Form(default=None),
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Menerima berkas gambar fisik nota (JPEG/PNG) langsung dari kamera/unggah file,
    menghitung matriks ELA piksel riil, dan mengekstrak entitas via Gemini Vision.
    """
    now = datetime.now(timezone.utc)
    img_bytes = await file.read()

    # Eksekusi AI multimodal
    ai_result = ai_service.analyze_receipt_multimodal(
        image_bytes=img_bytes,
        subtotal=subtotal,
        grand_total=grand_total
    )

    meta = ai_result.get("vision_metadata") or {}
    derived_merchant = merchant_name or meta.get("merchant") or f"Toko Rekanan #{uuid.uuid4().hex[:4].upper()}"
    rand_seq = uuid.uuid4().hex[:4].upper()
    derived_rcpt_no = receipt_number or f"RCP-{now.strftime('%Y%m')}-{rand_seq}"

    ela_score = ai_result["ela_score"]
    is_tampered = ai_result["is_tampered"]
    tampering_details = ai_result["details"]

    rec_id = f"rf-{uuid.uuid4().hex[:12]}"
    hash_payload = f"{derived_rcpt_no}:{current_user.tenant_id}:{grand_total}:{now.isoformat()}:{ela_score}"
    merkle_hash = f"sha256:{hashlib.sha256(hash_payload.encode()).hexdigest()}"

    new_record = ReceiptForensicsRecord(
        id=rec_id,
        tenant_id=current_user.tenant_id,
        receipt_number=derived_rcpt_no,
        merchant_name=derived_merchant,
        transaction_date=now.strftime("%Y-%m-%d %H:%M:%S"),
        subtotal=subtotal if subtotal > 0 else grand_total,
        tax_amount=0.0,
        grand_total=grand_total if grand_total > 0 else subtotal,
        ela_integrity_score=ela_score,
        is_tampered=is_tampered,
        tampering_details=tampering_details,
        items_json="[]",
        audit_merkle_hash=merkle_hash,
        status="TAMPERED" if is_tampered else "VERIFIED",
        created_at=now
    )

    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)

    return ReceiptForensicsSchema(
        id=new_record.id,
        receipt_number=new_record.receipt_number,
        merchant_name=new_record.merchant_name,
        transaction_date=new_record.transaction_date,
        subtotal=float(new_record.subtotal),
        tax_amount=float(new_record.tax_amount),
        grand_total=float(new_record.grand_total),
        ela_integrity_score=new_record.ela_integrity_score,
        is_tampered=new_record.is_tampered,
        tampering_details=new_record.tampering_details,
        items=[],
        audit_merkle_hash=new_record.audit_merkle_hash,
        status=new_record.status,
        created_at=new_record.created_at.isoformat() if new_record.created_at else ""
    )


@router.post(
    "/{record_id}/post-to-ledger",
    status_code=status.HTTP_200_OK,
    summary="Bukukan Nota Terverifikasi ke Buku Besar SAK EMKM (ACID Balancing)"
)
async def post_receipt_to_ledger(
    record_id: str,
    current_user: UserCredential = Depends(_require_manager),
    db: AsyncSession = Depends(get_db)
):
    """
    Membukukan nota belanjaan bahan baku/operasional yang lolos verifikasi ELA ke buku besar:
    * DEBET: Akun 1104 (Persediaan Bahan Baku Dapur) atau 6103 (Beban Operasional)
    * KREDIT: Akun 1101 (Kas Tunai Kasir Warung)
    * Rantai hash kriptografis SHA-256 Merkle Chaining di 'journal_entries'.
    """
    stmt = select(ReceiptForensicsRecord).where(
        ReceiptForensicsRecord.id == record_id,
        ReceiptForensicsRecord.tenant_id == current_user.tenant_id
    )
    res = await db.execute(stmt)
    rec = res.scalar_one_or_none()

    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arsip nota forensik tidak ditemukan.")

    if rec.is_tampered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nota terdeteksi manipulasi/tampered! Sistem melarang pembukuan nota bermasalah ke SAK EMKM."
        )

    if rec.status == "POSTED_TO_LEDGER":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nota ini sudah pernah dibukukan ke buku besar sebelumnya."
        )

    amount = float(rec.grand_total)

    # Delegasikan auto-posting jurnal SAK EMKM ke Accounting Domain Service
    journal_entry = await AccountingService.post_double_entry(
        db=db,
        tenant_id=current_user.tenant_id,
        description=f"Pembelian Bahan Baku Struk {rec.receipt_number} - {rec.merchant_name}",
        debit_account_code=COA_INVENTORY_RAW,
        credit_account_code=COA_CASH_ON_HAND,
        amount=amount,
        memo_debit=f"Pembelian Persediaan Nota {rec.receipt_number}",
        memo_credit=f"Pengeluaran Kas Belanja Nota {rec.receipt_number}",
        entry_number_prefix="JV-EXP",
        update_account_balances=True
    )

    entry_number = journal_entry.entry_number
    merkle_hash = journal_entry.audit_merkle_hash

    # Update status record
    rec.status = "POSTED_TO_LEDGER"
    rec.journal_entry_id = entry_number

    await db.commit()

    return {
        "success": True,
        "message": f"Struk {rec.receipt_number} ({rec.merchant_name}) senilai Rp {amount:,.0f} berhasil dibukukan ke SAK EMKM.",
        "journal_entry_number": entry_number,
        "audit_merkle_hash": merkle_hash,
        "amount_posted": amount
    }
