from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from app.infrastructure.database import Base

try:
    from pgvector.sqlalchemy import Vector
    EMBEDDING_TYPE = Vector(1536)
except ImportError:
    from sqlalchemy import JSON
    EMBEDDING_TYPE = JSON

class DialectLexicon(Base):
    __tablename__ = "dialect_lexicons"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    dialect: Mapped[str] = mapped_column(String(32), index=True, nullable=False)        # 'JAWA', 'SUNDA', 'MADURA', 'PASAR'
    raw_term: Mapped[str] = mapped_column(String(255), index=True, nullable=False)     # e.g., 'brambang abang', 'jhuko'
    canonical_term: Mapped[str] = mapped_column(String(255), nullable=False)           # e.g., 'Bawang Merah', 'Ikan Tongkol'
    target_coa_code: Mapped[str] = mapped_column(String(32), nullable=False)           # e.g., '1104' (Persediaan Bahan Baku)
    action_type: Mapped[str] = mapped_column(String(16), default="BELI")               # 'BELI', 'JUAL', 'BAYAR'
    sample_sentence: Mapped[str] = mapped_column(Text, nullable=True)
    embedding = mapped_column(EMBEDDING_TYPE, nullable=True)                           # 1536-dim semantic embedding vector
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

