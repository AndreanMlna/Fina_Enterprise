"""
FINA-ENTERPRISE API Schemas and DTOs (Data Transfer Objects)
Pemisahan kontrak data (Pydantic models) dari controller HTTP sesuai Hexagonal Architecture.
"""

from app.schemas.pos import (
    POSProductSchema,
    CreatePOSProductPayload,
    UpdatePOSProductPayload,
    CartItemPayload,
    POSCheckoutPayload,
    ReceiptItemSchema,
    POSReceiptResponse,
    RecipeItemPayload,
    SaveRecipePayload,
    RestockInventoryPayload,
    ProductionBatchPayload,
    ApplyPricePayload,
)
from app.schemas.ledger import (
    JournalLineSchema,
    JournalEntrySchema,
    AccountSchema,
    FinancialLineItem,
    SAKEMKMReportSchema,
)
from app.schemas.setup import (
    InventoryItemPayload,
    FixedAssetPayload,
    InitialBalancePayload,
    InitialBalanceResponse,
    SetupStatusResponse,
)

__all__ = [
    # POS
    "POSProductSchema",
    "CreatePOSProductPayload",
    "UpdatePOSProductPayload",
    "CartItemPayload",
    "POSCheckoutPayload",
    "ReceiptItemSchema",
    "POSReceiptResponse",
    "RecipeItemPayload",
    "SaveRecipePayload",
    "RestockInventoryPayload",
    "ProductionBatchPayload",
    "ApplyPricePayload",
    # Ledger
    "JournalLineSchema",
    "JournalEntrySchema",
    "AccountSchema",
    "FinancialLineItem",
    "SAKEMKMReportSchema",
    # Setup
    "InventoryItemPayload",
    "FixedAssetPayload",
    "InitialBalancePayload",
    "InitialBalanceResponse",
    "SetupStatusResponse",
]
