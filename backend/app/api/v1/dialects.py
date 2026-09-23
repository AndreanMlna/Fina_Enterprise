"""
FINA-ENTERPRISE Dialect Lexicon API Router
Endpoint kamus leksikon dialek lokal (Jawa, Sunda, Madura, dll) untuk AI Voice-to-Text.

Security: JWT Bearer token
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1.auth import get_current_user
from app.domain.models import UserCredential, DialectLexicon
from app.infrastructure.database import get_db

router = APIRouter(prefix="/dialects", tags=["Voice Dialect & Leksikon Lokal"])


class DialectLexiconSchema(BaseModel):
    id: str
    dialect: str
    raw_term: str
    canonical_term: str
    target_coa_code: str
    action_type: str
    sample_sentence: Optional[str] = None


@router.get(
    "",
    response_model=List[DialectLexiconSchema],
    summary="Kamus Leksikon Dialek Lokal untuk Voice-to-Text AI"
)
async def list_dialects(
    current_user: UserCredential = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    dialect_filter: Optional[str] = Query(None, alias="dialect"),
    limit: int = Query(default=100, le=500)
):
    """
    Mengambil kamus leksikon dialek lokal dari database.
    Mendukung filter berdasarkan jenis dialek (JAWA, SUNDA, MADURA, INDONESIA_PASAR).
    """
    stmt = select(DialectLexicon).order_by(DialectLexicon.dialect).limit(limit)

    if dialect_filter:
        stmt = stmt.where(DialectLexicon.dialect == dialect_filter.upper())

    result = await db.execute(stmt)
    lexicons = result.scalars().all()

    return [
        DialectLexiconSchema(
            id=lex.id,
            dialect=lex.dialect,
            raw_term=lex.raw_term,
            canonical_term=lex.canonical_term,
            target_coa_code=lex.target_coa_code,
            action_type=lex.action_type,
            sample_sentence=lex.sample_sentence
        )
        for lex in lexicons
    ]
