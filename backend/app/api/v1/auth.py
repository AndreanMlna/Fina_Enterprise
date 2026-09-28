from datetime import datetime, timezone
import re
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
import jwt

from app.core.security import verify_pin, create_access_token, decode_access_token, hash_pin
from app.domain.models import UserCredential, Tenant
from app.infrastructure.database import get_db

router = APIRouter(prefix="/auth", tags=["Enterprise Authentication"])
security_scheme = HTTPBearer(auto_error=False)


def normalize_phone(raw: str) -> str:
    """Membersihkan nomor telepon menjadi deretan angka standar 08..."""
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("62"):
        digits = "0" + digits[2:]
    return digits


# --- Pydantic Schemas (OpenAPI 3.1 Strict) ---
class LoginRequest(BaseModel):
    phone_number: str = Field(
        ...,
        examples=["0812-3456-7890", "081234567890"],
        description="Nomor WhatsApp aktif pemilik UMKM"
    )
    pin: str = Field(
        ...,
        min_length=6,
        max_length=6,
        examples=["123456"],
        description="6-digit PIN Keamanan Transaksi"
    )


class RegisterRequest(BaseModel):
    full_name: str = Field(
        ...,
        min_length=3,
        max_length=255,
        examples=["Ahmad Fauzi"],
        description="Nama lengkap pemilik usaha UMKM"
    )
    business_name: str = Field(
        ...,
        min_length=3,
        max_length=255,
        examples=["Warung Kopi Nusantara"],
        description="Nama entitas usaha / toko / perusahaan"
    )
    phone_number: str = Field(
        ...,
        min_length=9,
        max_length=32,
        examples=["0821-9988-7766"],
        description="Nomor WhatsApp bisnis aktif"
    )
    business_category: str = Field(
        default="Kuliner & Katering",
        examples=["Kuliner & Katering"],
        description="Kategori sektor usaha UMKM"
    )
    address: str = Field(
        ...,
        min_length=5,
        max_length=512,
        examples=["Jl. Malioboro No. 45, Yogyakarta"],
        description="Alamat operasional bisnis"
    )
    pin: str = Field(
        ...,
        min_length=6,
        max_length=6,
        examples=["654321"],
        description="6-digit PIN Keamanan Transaksi"
    )



class TenantSummarySchema(BaseModel):
    id: str
    name: str
    branch_code: str
    active_license: str
    address: Optional[str] = None
    npwp: Optional[str] = None


class UserProfileSchema(BaseModel):
    id: str
    phone_number: str
    full_name: str
    role: str
    tenant_id: str
    is_active: bool
    last_login_at: Optional[datetime] = None


class CreateStaffRequest(BaseModel):
    full_name: str = Field(
        ...,
        min_length=3,
        max_length=255,
        examples=["Siti Aminah"],
        description="Nama lengkap staf karyawan"
    )
    phone_number: str = Field(
        ...,
        min_length=9,
        max_length=32,
        examples=["0812-1111-2222"],
        description="Nomor WhatsApp aktif staf karyawan"
    )
    role: str = Field(
        ...,
        examples=["CASHIER"],
        description="Peran staf: 'CASHIER' (Kasir), 'MANAGER' (Manajer), atau 'AUDITOR' (Auditor)"
    )
    pin: str = Field(
        ...,
        min_length=6,
        max_length=6,
        examples=["123456"],
        description="6-digit PIN Keamanan Awal Staf"
    )


class StaffProfileSchema(BaseModel):
    id: str
    full_name: str
    phone_number: str
    role: str
    tenant_id: str
    is_active: bool
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None


class UpdateStaffStatusRequest(BaseModel):
    is_active: bool = Field(..., description="Status keaktifan akun karyawan (True = Aktif, False = Nonaktif)")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileSchema
    tenant: TenantSummarySchema


# --- Security Dependency: Current Authenticated User ---
async def get_current_user(
    auth_creds: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> UserCredential:
    if not auth_creds or not auth_creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autentikasi ditolak: Token Bearer tidak disertakan.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_creds.credentials
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kredensial token tidak valid.",
                headers={"WWW-Authenticate": "Bearer"}
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesi telah kedaluwarsa. Silakan login kembali.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except (jwt.PyJWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Validasi kriptografi token gagal.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    stmt = select(UserCredential).options(selectinload(UserCredential.tenant)).where(UserCredential.id == user_id)
    user = await db.scalar(stmt)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akun pengguna tidak ditemukan atau dinonaktifkan.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user


def require_role(allowed_roles: List[str]):
    """
    Higher-order Dependency Factory untuk penegakan RBAC (Role-Based Access Control).

    Menghasilkan FastAPI dependency guard yang memverifikasi bahwa pengguna
    terautentikasi memiliki role yang termasuk dalam daftar `allowed_roles`.

    Prinsip: Principle of Least Privilege (PoLP) — setiap endpoint hanya dapat
    diakses oleh role yang secara eksplisit diberikan izin.

    Referensi: COSO Internal Control Framework, ISO 27001 Annex A.9.4,
    PANDUAN_ARSITEKTUR_DAN_ALUR_SISTEM.md §2.2 (3-Tier Security Guard).

    Args:
        allowed_roles: Daftar role yang diizinkan (misal: ["OWNER", "MANAGER"]).

    Returns:
        Dependency callable yang mengembalikan UserCredential jika role valid,
        atau melemparkan HTTP 403 Forbidden jika role tidak diizinkan.
    """
    async def role_checker(
        current_user: UserCredential = Depends(get_current_user)
    ) -> UserCredential:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Akses ditolak: Role '{current_user.role}' tidak memiliki izin "
                    f"untuk operasi ini. Diperlukan salah satu dari: {', '.join(allowed_roles)}."
                )
            )
        return current_user
    return role_checker


# --- Endpoints ---
@router.post("/login", response_model=LoginResponse, summary="Autentikasi Pengguna & Penerbitan JWT")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Endpoint autentikasi resmi enterprise:
    1. Memvalidasi nomor telepon fleksibel (format apa pun: dengan strip, spasi, atau digit murni).
    2. Memeriksa status akun dan proteksi brute force (maksimal 5 kesalahan).
    3. Memverifikasi PIN dengan PBKDF2-HMAC-SHA256 timing-safe comparison.
    4. Menerbitkan RFC 7519 Signed JWT Access Token.
    """
    cleaned_input = normalize_phone(payload.phone_number)
    raw_input = payload.phone_number.strip()

    # Query di level SQL dengan pembersihan karakter pemisah
    clean_db_phone = func.replace(func.replace(func.replace(UserCredential.phone_number, "-", ""), " ", ""), "+62", "0")

    stmt = (
        select(UserCredential)
        .options(selectinload(UserCredential.tenant))
        .where(
            or_(
                UserCredential.phone_number == raw_input,
                UserCredential.phone_number == cleaned_input,
                clean_db_phone == cleaned_input
            )
        )
    )
    user = await db.scalar(stmt)


    # OWASP Standard: Jangan beritahu secara eksplisit apakah user ada atau tidak untuk mencegah User Enumeration
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nomor WhatsApp atau PIN transaksi yang Anda masukkan tidak valid."
    )

    if not user:
        raise generic_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda saat ini dinonaktifkan. Silakan hubungi Administrator FINA Enterprise."
        )

    # Brute-force Protection (NIST SP 800-63B)
    if user.failed_attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Akun terkunci sementara karena telah salah memasukkan PIN sebanyak 5 kali. Silakan hubungi CS Support FINA."
        )

    # Verifikasi PBKDF2 Timing-Safe
    is_pin_valid = verify_pin(payload.pin, user.pin_hash)
    if not is_pin_valid:
        user.failed_attempts += 1
        await db.commit()
        raise generic_error

    # Autentikasi Sukses: Reset failed attempts & catat login timestamp
    user.failed_attempts = 0
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    # Terbitkan JWT Access Token
    token_payload = {
        "sub": user.id,
        "phone_number": user.phone_number,
        "role": user.role,
        "tenant_id": user.tenant_id,
        "tenant_name": user.tenant.name if user.tenant else ""
    }
    access_token = create_access_token(token_payload)

    user_profile = UserProfileSchema(
        id=user.id,
        phone_number=user.phone_number,
        full_name=user.full_name,
        role=user.role,
        tenant_id=user.tenant_id,
        is_active=user.is_active,
        last_login_at=user.last_login_at
    )

    tenant_summary = TenantSummarySchema(
        id=user.tenant.id,
        name=user.tenant.name,
        branch_code=user.tenant.branch_code,
        active_license=user.tenant.active_license,
        address=user.tenant.address,
        npwp=user.tenant.npwp
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_profile,
        tenant=tenant_summary
    )


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED, summary="Registrasi Akun Bisnis & Pengusaha UMKM Baru")
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Endpoint pendaftaran mandiri pengusaha UMKM:
    1. Validasi format nomor WhatsApp dan validasi keunikan nomor di PostgreSQL.
    2. Validasi format PIN keamanan (6 digit numerik).
    3. Transaksi ACID: Membuat entitas Tenant baru dan kredensial UserCredential dengan role OWNER.
    4. Pengamanan PIN menggunakan cryptographic PBKDF2-HMAC-SHA256 (100.000 iterasi).
    5. Menerbitkan RFC 7519 Signed JWT Access Token agar pengguna langsung siap masuk ke dashboard.
    """
    cleaned_phone = normalize_phone(payload.phone_number)
    raw_phone = payload.phone_number.strip()

    # Validasi 6 digit angka numerik untuk PIN
    if not (payload.pin.isdigit() and len(payload.pin) == 6):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="PIN keamanan finansial harus persis terdiri dari 6 digit angka numerik."
        )

    # Cek keunikan nomor telepon di database
    clean_db_phone = func.replace(func.replace(func.replace(UserCredential.phone_number, "-", ""), " ", ""), "+62", "0")
    existing_user = await db.scalar(
        select(UserCredential).where(
            or_(
                UserCredential.phone_number == raw_phone,
                UserCredential.phone_number == cleaned_phone,
                clean_db_phone == cleaned_phone
            )
        )
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nomor WhatsApp ini sudah terdaftar sebagai akun aktif. Silakan masuk menggunakan nomor tersebut."
        )

    # 1. Buat Entitas Bisnis Baru (Tenant)
    tenant_id = f"t-{uuid.uuid4().hex[:8]}"
    clean_biz_code = re.sub(r"[^A-Za-z0-9]", "", payload.business_name).upper()[:8]
    if not clean_biz_code:
        clean_biz_code = "UMKM"
    branch_code = f"ID-{clean_biz_code}-{uuid.uuid4().hex[:4].upper()}"

    new_tenant = Tenant(
        id=tenant_id,
        name=payload.business_name.strip(),
        branch_code=branch_code,
        npwp="00.000.000.0-000.000",
        address=payload.address.strip(),
        active_license="UMKM_GROWTH"
    )
    db.add(new_tenant)
    await db.flush()

    # 2. Buat Kredensial Pengguna Baru (UserCredential)
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    hashed_pin = hash_pin(payload.pin)

    new_user = UserCredential(
        id=user_id,
        tenant_id=tenant_id,
        phone_number=raw_phone,
        pin_hash=hashed_pin,
        role="OWNER",
        full_name=payload.full_name.strip(),
        is_active=True,
        failed_attempts=0,
        last_login_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    await db.commit()

    # 3. Terbitkan Signed JWT Access Token Resmi
    token_payload = {
        "sub": new_user.id,
        "phone_number": new_user.phone_number,
        "role": new_user.role,
        "tenant_id": new_user.tenant_id,
        "tenant_name": new_tenant.name
    }
    access_token = create_access_token(token_payload)

    user_profile = UserProfileSchema(
        id=new_user.id,
        phone_number=new_user.phone_number,
        full_name=new_user.full_name,
        role=new_user.role,
        tenant_id=new_user.tenant_id,
        is_active=new_user.is_active,
        last_login_at=new_user.last_login_at
    )

    tenant_summary = TenantSummarySchema(
        id=new_tenant.id,
        name=new_tenant.name,
        branch_code=new_tenant.branch_code,
        active_license=new_tenant.active_license,
        address=new_tenant.address,
        npwp=new_tenant.npwp
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_profile,
        tenant=tenant_summary
    )


@router.get("/me", response_model=LoginResponse, summary="Verifikasi Sesi & Ambil Profil Pengguna Saat Ini")
async def get_my_profile(current_user: UserCredential = Depends(get_current_user)):

    """
    Mengambil data profil pengguna dan identitas tenant terdaftar berdasarkan JWT Token aktif.
    """
    token_payload = {
        "sub": current_user.id,
        "phone_number": current_user.phone_number,
        "role": current_user.role,
        "tenant_id": current_user.tenant_id,
        "tenant_name": current_user.tenant.name if current_user.tenant else ""
    }
    fresh_token = create_access_token(token_payload)

    user_profile = UserProfileSchema(
        id=current_user.id,
        phone_number=current_user.phone_number,
        full_name=current_user.full_name,
        role=current_user.role,
        tenant_id=current_user.tenant_id,
        is_active=current_user.is_active,
        last_login_at=current_user.last_login_at
    )

    tenant_summary = TenantSummarySchema(
        id=current_user.tenant.id,
        name=current_user.tenant.name,
        branch_code=current_user.tenant.branch_code,
        active_license=current_user.tenant.active_license,
        address=current_user.tenant.address,
        npwp=current_user.tenant.npwp
    )

    return LoginResponse(
        access_token=fresh_token,
        token_type="bearer",
        user=user_profile,
        tenant=tenant_summary
    )


# --- Enterprise Staff Management Endpoints (RBAC Provisioning) ---
@router.get("/staff", response_model=List[StaffProfileSchema], summary="Daftar Karyawan Toko (Multi-Tenant RBAC)")
async def list_staff_members(
    current_user: UserCredential = Depends(require_role(["OWNER", "MANAGER"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengambil daftar seluruh staf karyawan (Kasir, Manajer, Auditor) yang terdaftar
    di bawah naungan tenant_id pemanggil saat ini.
    Otoritas akses: OWNER dan MANAGER.
    """
    stmt = (
        select(UserCredential)
        .where(UserCredential.tenant_id == current_user.tenant_id)
        .order_by(UserCredential.created_at.asc())
    )
    result = await db.scalars(stmt)
    staff_list = result.all()

    return [
        StaffProfileSchema(
            id=s.id,
            full_name=s.full_name,
            phone_number=s.phone_number,
            role=s.role,
            tenant_id=s.tenant_id,
            is_active=s.is_active,
            created_at=s.created_at,
            last_login_at=s.last_login_at
        )
        for s in staff_list
    ]


@router.post("/staff", response_model=StaffProfileSchema, status_code=status.HTTP_201_CREATED, summary="Pendaftaran Staf Baru oleh Owner")
async def create_staff_member(
    payload: CreateStaffRequest,
    current_user: UserCredential = Depends(require_role(["OWNER"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Mendaftarkan karyawan baru (Kasir / Manajer / Auditor) ke dalam tenant toko milik Owner.
    Prinsip Enterprise RBAC:
    1. Hanya role OWNER yang berwenang mengangkat atau memprovisi karyawan.
    2. Karyawan otomatis diikat ke tenant_id milik Owner.
    3. PIN di-hash menggunakan PBKDF2-HMAC-SHA256 (100.000 iterasi).
    """
    # 1. Validasi peran yang diperbolehkan untuk diprovisi
    target_role = payload.role.strip().upper()
    allowed_staff_roles = {"CASHIER", "MANAGER", "AUDITOR"}
    if target_role not in allowed_staff_roles:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Peran tidak valid. Peran staf yang diizinkan: {', '.join(sorted(allowed_staff_roles))}."
        )

    # 2. Validasi format PIN 6-digit numerik
    if not (payload.pin.isdigit() and len(payload.pin) == 6):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="PIN keamanan staf harus persis terdiri dari 6 digit angka numerik."
        )

    # 3. Validasi keunikan nomor telepon
    cleaned_phone = normalize_phone(payload.phone_number)
    raw_phone = payload.phone_number.strip()
    clean_db_phone = func.replace(func.replace(func.replace(UserCredential.phone_number, "-", ""), " ", ""), "+62", "0")

    existing_user = await db.scalar(
        select(UserCredential).where(
            or_(
                UserCredential.phone_number == raw_phone,
                UserCredential.phone_number == cleaned_phone,
                clean_db_phone == cleaned_phone
            )
        )
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Nomor WhatsApp '{raw_phone}' sudah terdaftar dalam sistem. Gunakan nomor WhatsApp lain untuk staf ini."
        )

    # 4. Buat akun staf terikat ke tenant_id milik Owner
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    hashed_pin = hash_pin(payload.pin)

    new_staff = UserCredential(
        id=user_id,
        tenant_id=current_user.tenant_id,
        phone_number=raw_phone,
        pin_hash=hashed_pin,
        role=target_role,
        full_name=payload.full_name.strip(),
        is_active=True,
        failed_attempts=0,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_staff)
    await db.commit()
    await db.refresh(new_staff)

    return StaffProfileSchema(
        id=new_staff.id,
        full_name=new_staff.full_name,
        phone_number=new_staff.phone_number,
        role=new_staff.role,
        tenant_id=new_staff.tenant_id,
        is_active=new_staff.is_active,
        created_at=new_staff.created_at,
        last_login_at=new_staff.last_login_at
    )


@router.patch("/staff/{user_id}/status", response_model=StaffProfileSchema, summary="Ubah Status Keaktifan Staf")
async def update_staff_status(
    user_id: str,
    payload: UpdateStaffStatusRequest,
    current_user: UserCredential = Depends(require_role(["OWNER"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengaktifkan atau menonaktifkan akun karyawan dalam tenant.
    Owner dilarang menonaktifkan akun miliknya sendiri.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pemilik Usaha (Owner) tidak dapat menonaktifkan akun sendiri."
        )

    stmt = select(UserCredential).where(
        UserCredential.id == user_id,
        UserCredential.tenant_id == current_user.tenant_id
    )
    staff = await db.scalar(stmt)
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Akun staf tidak ditemukan dalam entitas usaha Anda."
        )

    staff.is_active = payload.is_active
    await db.commit()
    await db.refresh(staff)

    return StaffProfileSchema(
        id=staff.id,
        full_name=staff.full_name,
        phone_number=staff.phone_number,
        role=staff.role,
        tenant_id=staff.tenant_id,
        is_active=staff.is_active,
        created_at=staff.created_at,
        last_login_at=staff.last_login_at
    )


@router.delete("/staff/{user_id}", summary="Hapus Akun Staf Karyawan")
async def delete_staff_member(
    user_id: str,
    current_user: UserCredential = Depends(require_role(["OWNER"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Menghapus akun karyawan dari tenant toko.
    Owner dilarang menghapus akun miliknya sendiri.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pemilik Usaha (Owner) tidak dapat menghapus akun sendiri."
        )

    stmt = select(UserCredential).where(
        UserCredential.id == user_id,
        UserCredential.tenant_id == current_user.tenant_id
    )
    staff = await db.scalar(stmt)
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Akun staf tidak ditemukan dalam entitas usaha Anda."
        )

    deleted_id = staff.id
    deleted_name = staff.full_name
    await db.delete(staff)
    await db.commit()

    return {
        "success": True,
        "message": f"Akun karyawan '{deleted_name}' berhasil dihapus dari entitas usaha.",
        "user_id": deleted_id
    }
