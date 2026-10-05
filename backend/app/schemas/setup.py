"""
FINA-ENTERPRISE Initial Setup & Capital Balance DTO Schemas
Standar: Pydantic v2 Contract Separation / Clean Architecture
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class InventoryItemPayload(BaseModel):
    """Satu item persediaan bahan baku / barang dagangan."""
    name: str = Field(..., min_length=1, max_length=255, description="Nama barang/bahan")
    quantity: int = Field(..., ge=1, description="Jumlah stok awal")
    unit: str = Field(default="Pcs", max_length=32, description="Satuan (Kg, Pcs, Karung, dll)")
    unit_cost: float = Field(..., gt=0, description="Harga beli per satuan (Rp)")
    selling_price: float = Field(default=0, ge=0, description="Harga jual per satuan (Rp, opsional)")
    category: str = Field(default="Umum", max_length=64, description="Kategori produk")


class FixedAssetPayload(BaseModel):
    """Satu item aset tetap (peralatan, kendaraan)."""
    name: str = Field(..., min_length=1, max_length=255, description="Nama aset")
    value: float = Field(..., gt=0, description="Nilai perolehan aset (Rp)")
    asset_type: str = Field(
        default="equipment",
        description="Jenis aset: 'equipment' (1201) atau 'vehicle' (1203)"
    )


class InitialBalancePayload(BaseModel):
    """Payload lengkap untuk setup saldo awal UMKM."""
    effective_date: str = Field(
        ...,
        description="Tanggal efektif saldo awal (format: YYYY-MM-DD)",
        pattern=r"^\d{4}-\d{2}-\d{2}$"
    )
    cash_on_hand: float = Field(default=0, ge=0, description="Uang tunai di laci/dompet (Rp)")
    bank_balance: float = Field(default=0, ge=0, description="Saldo rekening bank/e-wallet (Rp)")
    inventory_items: List[InventoryItemPayload] = Field(
        default_factory=list,
        description="Daftar stok bahan baku / barang dagangan awal"
    )
    fixed_assets: List[FixedAssetPayload] = Field(
        default_factory=list,
        description="Daftar aset tetap (peralatan, kendaraan)"
    )
    opening_payables: float = Field(
        default=0, ge=0,
        description="Total utang awal ke pemasok/supplier (Rp)"
    )


class InitialBalanceResponse(BaseModel):
    """Response setelah berhasil melakukan setup saldo awal."""
    success: bool
    message: str
    journal_entry_number: str
    total_assets: float
    total_liabilities: float
    owner_equity: float
    products_created: int
    audit_merkle_hash: str


class SetupStatusResponse(BaseModel):
    """Status apakah tenant sudah melakukan setup saldo awal beserta ringkasan modal awal & monitoring."""
    is_setup_complete: bool
    tenant_id: str
    tenant_name: str
    operating_status: str = Field(default="OPERATIONAL", description="'ONBOARDING' atau 'OPERATIONAL'")
    initial_equity: float = Field(default=0.0, description="Modal pemilik awal terdaftar (Rp)")
    initial_cash_bank: float = Field(default=0.0, description="Kas & saldo bank awal (Rp)")
    initial_fixed_assets: float = Field(default=0.0, description="Nilai perolehan aset tetap awal (Rp)")
    current_total_assets: float = Field(default=0.0, description="Total aset berjalan saat ini (Rp)")
    initial_date: Optional[str] = Field(default=None, description="Tanggal efektif saldo awal (YYYY-MM-DD)")
    journal_entry_number: Optional[str] = Field(default=None, description="Nomor jurnal pembukuan saldo awal")
    audit_merkle_hash: Optional[str] = Field(default=None, description="Hash kriptografis pembukuan saldo awal")
    total_journals_count: int = Field(default=0, description="Total jurnal transaksi yang telah berjalan")


class SetupAIRecommendedItem(BaseModel):
    """Item bahan atau alat rekomendasi AI LLM dengan kalkulasi harga anti-rugi."""
    name: str = Field(..., description="Nama bahan atau alat yang dibutuhkan")
    category: str = Field(default="Bahan Baku", description="Kategori: Bahan Baku, Alat Kerja, Kemasan, Operasional, Umum")
    quantity: int = Field(default=1, ge=1, description="Kuantitas rekomendasi")
    unit: str = Field(default="Pcs", description="Satuan (Pcs, Kg, Liter, Pack, Box, Porsi, Karung, Set, Unit)")
    estimated_unit_cost: float = Field(default=0.0, ge=0, description="Estimasi harga beli/modal pasar grosir per unit (Rp)")
    unit_cost: float = Field(default=0.0, ge=0, description="Alias untuk estimated_unit_cost")
    recommended_selling_price: float = Field(default=0.0, ge=0, description="Rekomendasi harga jual anti-rugi per unit (Rp)")
    selling_price: float = Field(default=0.0, ge=0, description="Alias untuk recommended_selling_price")
    target_margin_percent: float = Field(default=40.0, description="Target margin laba kotor (%)")
    margin_percent: float = Field(default=40.0, description="Alias untuk target_margin_percent")
    is_equipment: bool = Field(default=False, description="Penanda apakah item merupakan aset/alat kerja")
    reason: str = Field(default="", description="Justifikasi operasional & proteksi margin anti-rugi")
    rationale: str = Field(default="", description="Alias untuk reason")


class SetupAIRecommendationRequest(BaseModel):
    """Permintaan rekomendasi bahan, alat, dan harga jual ke sistem AI LLM."""
    query: Optional[str] = Field(default=None, description="Deskripsi usaha atau perintah pengisian bahan/alat dari user")
    business_type_or_query: Optional[str] = Field(default=None, description="Alias deskripsi usaha atau perintah")
    budget_estimate: Optional[float] = Field(default=None, description="Estimasi batas modal belanja awal (Rp, opsional)")
    target_margin: Optional[float] = Field(default=40.0, description="Target margin sasaran (%)")
    target_margin_percent: Optional[float] = Field(default=40.0, description="Alias target margin sasaran (%)")


class SetupAIRecommendationResponse(BaseModel):
    """Respons komprehensif rekomendasi bahan, alat, dan strategi harga jual anti-rugi."""
    business_summary: str = Field(default="", description="Ringkasan analisis profil usaha dari AI")
    business_type: str = Field(default="", description="Alias kategori profil usaha")
    suggested_items: List[SetupAIRecommendedItem] = Field(default_factory=list, description="Daftar bahan dan alat yang direkomendasikan")
    recommended_items: List[SetupAIRecommendedItem] = Field(default_factory=list, description="Alias daftar bahan dan alat yang direkomendasikan")
    pricing_strategy_notes: str = Field(default="", description="Saran penetapan harga jual agar tidak merugi")
    advice: str = Field(default="", description="Alias saran penetapan harga jual agar tidak merugi")
    total_estimated_budget: float = Field(default=0.0, description="Total estimasi modal belanja bahan & alat (Rp)")
    potential_revenue: float = Field(default=0.0, description="Estimasi potensi omzet penjualan (Rp)")
    total_potential_revenue: float = Field(default=0.0, description="Alias total potensi omzet penjualan (Rp)")
    estimated_gross_profit: float = Field(default=0.0, description="Estimasi potensi laba kotor (Rp)")
    average_margin_percent: float = Field(default=40.0, description="Rata-rata margin laba kotor portofolio produk (%)")
    engine: str = Field(default="Google-Gemini-LLM-v2.5", description="Model engine yang digunakan")

