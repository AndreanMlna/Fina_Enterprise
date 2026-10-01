"""
FINA-ENTERPRISE Ledger & SAK EMKM DTO Schemas
Standar: Pydantic v2 Contract Separation / Clean Architecture
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class JournalLineSchema(BaseModel):
    id: str
    account_id: str
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    debit: float
    credit: float
    memo: Optional[str] = None


class JournalEntrySchema(BaseModel):
    id: str
    entry_number: str
    entry_date: str
    description: str
    status: str
    audit_merkle_hash: str
    lines: List[JournalLineSchema] = []


class AccountSchema(BaseModel):
    id: str
    code: str
    name: str
    category: str
    normal_balance: str
    balance: float


class FinancialLineItem(BaseModel):
    name: str
    amount: float


class SAKEMKMReportSchema(BaseModel):
    period: str
    total_assets: float
    total_liabilities_and_equity: float
    current_assets: List[FinancialLineItem]
    non_current_assets: List[FinancialLineItem]
    liabilities: List[FinancialLineItem]
    equity: List[FinancialLineItem]
    revenue: float
    cogs: float
    gross_profit: float
    operational_expenses: List[FinancialLineItem]
    net_income_before_tax: float
    is_balanced: bool
    audit_merkle_hash: str
