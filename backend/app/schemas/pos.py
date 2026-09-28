"""
FINA-ENTERPRISE POS (Point of Sale) & Inventory DTO Schemas
Standar: Pydantic v2 Contract Separation / Clean Architecture
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class POSProductSchema(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    price: float
    cogs: float = Field(description="Harga Pokok Penjualan / Modal per unit")
    stock: int
    unit: str
    image_url: Optional[str] = None


class CreatePOSProductPayload(BaseModel):
    name: str = Field(min_length=2, max_length=255, description="Nama produk/menu")
    sku: Optional[str] = Field(default=None, max_length=64, description="Kode SKU atau barcode produk")
    category: str = Field(default="Makanan", max_length=64, description="Kategori produk (Makanan, Minuman, Camilan, Sembako, dll)")
    price: float = Field(ge=0, description="Harga jual produk")
    cogs: float = Field(default=0.0, ge=0, description="Harga Pokok Penjualan / Modal per unit")
    stock: int = Field(default=0, ge=0, description="Jumlah stok fisik awal")
    unit: str = Field(default="Porsi", max_length=32, description="Satuan unit (Porsi, Pcs, Botol, Kg, dll)")
    image_url: Optional[str] = Field(default=None, description="URL gambar produk")


class UpdatePOSProductPayload(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    sku: Optional[str] = Field(default=None, max_length=64)
    category: Optional[str] = Field(default=None, max_length=64)
    price: Optional[float] = Field(default=None, ge=0)
    cogs: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    unit: Optional[str] = Field(default=None, max_length=32)
    image_url: Optional[str] = None


class CartItemPayload(BaseModel):
    product_id: str
    product_name: str
    sku: str
    quantity: int = Field(gt=0, description="Kuantitas harus lebih besar dari 0")
    unit_price: float = Field(ge=0, description="Harga satuan")
    cogs: float = Field(default=0.0, ge=0)
    discount_percent: float = Field(default=0.0, ge=0, le=100)


class POSCheckoutPayload(BaseModel):
    items: List[CartItemPayload] = Field(min_length=1, description="Minimal 1 item belanja")
    payment_method: str = Field(description="'CASH', 'QRIS', atau 'TRANSFER'")
    cash_tendered: Optional[float] = Field(default=0.0, description="Nominal uang tunai diserahkan pelanggan")
    customer_name: Optional[str] = Field(default="Pelanggan Umum", description="Nama pembeli")
    customer_phone: Optional[str] = Field(default=None, description="Nomor WhatsApp untuk nota digital")
    notes: Optional[str] = None


class ReceiptItemSchema(BaseModel):
    product_name: str
    sku: str
    quantity: int
    unit_price: float
    discount_amount: float
    subtotal: float


class POSReceiptResponse(BaseModel):
    success: bool
    receipt_number: str
    journal_entry_number: str
    transaction_date: str
    tenant_id: str
    tenant_name: str
    cashier_name: str
    customer_name: str
    customer_phone: Optional[str]
    items: List[ReceiptItemSchema]
    total_items_count: int
    subtotal: float
    total_discount: float
    tax_pp55_estimated: float
    grand_total: float
    payment_method: str
    cash_tendered: float
    change_amount: float
    audit_merkle_hash: str
    qr_snap_url: Optional[str] = None


class RecipeItemPayload(BaseModel):
    material_id: Optional[str] = Field(default=None, description="ID produk bahan baku jika terdaftar di katalog")
    material_name: str = Field(min_length=1, max_length=255, description="Nama bahan penyusun / kemasan")
    quantity_required: float = Field(gt=0, description="Kuantitas bahan yang dibutuhkan per 1 pcs produk")
    unit: str = Field(default="Pcs", max_length=32, description="Satuan unit (Kg, Gram, Liter, Ml, Pcs, Lembar)")
    cost_per_unit: float = Field(ge=0, description="Harga modal bahan per satuan unit")
    notes: Optional[str] = None


class SaveRecipePayload(BaseModel):
    overhead_cost_per_unit: Optional[float] = Field(default=0.0, ge=0, description="Biaya operasional langsung per pcs (gas, listrik, kemasan)")
    wastage_percent: Optional[float] = Field(default=0.0, ge=0, le=50, description="Estimasi susut / yield loss produksi (0 - 50%)")
    target_margin_percent: Optional[float] = Field(default=35.0, ge=10, le=90, description="Target margin keuntungan kotor UMKM (10 - 90%)")
    items: List[RecipeItemPayload] = Field(min_length=1, description="Daftar bahan baku penyusun produk")


class RestockInventoryPayload(BaseModel):
    product_id: Optional[str] = Field(default=None, description="ID produk/bahan jika sudah ada di katalog")
    material_name: str = Field(min_length=2, max_length=255, description="Nama bahan baku / barang dagangan")
    category: str = Field(default="Bahan Baku", max_length=64, description="Kategori barang")
    quantity_added: float = Field(gt=0, description="Jumlah kuantitas baru yang dibeli / direstock")
    unit: str = Field(default="Kg", max_length=32, description="Satuan unit")
    purchase_price_per_unit: float = Field(ge=0, description="Harga beli faktur per satuan unit")
    supplier_name: Optional[str] = None
    notes: Optional[str] = None


class ProductionBatchPayload(BaseModel):
    product_id: str = Field(description="ID produk jadi yang diproduksi")
    quantity_produced: int = Field(gt=0, description="Jumlah unit produk jadi yang dihasilkan")
    overhead_cost: Optional[float] = Field(default=0.0, ge=0, description="Biaya overhead langsung untuk batch ini")
    notes: Optional[str] = None


class ApplyPricePayload(BaseModel):
    new_price: float = Field(gt=0, description="Harga jual baru yang diterapkan ke katalog kasir POS")
