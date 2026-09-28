import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Package,
  PlusCircle,
  Settings,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  Trash2,
  Calendar,
  Share2,
  Building2,
  Sparkles,
  Factory,
  ShieldAlert
} from 'lucide-react';
import type { POSProduct, POSCartItem, POSReceipt, Tenant, StaffMember } from '../../types';
import type { MarginLeakageAlert } from '../../services/types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';
import { ConfirmDialog } from '../ConfirmDialog';
import { POSThermalReceiptModal } from '../pos/POSThermalReceiptModal';
import { POSProductModal } from '../pos/POSProductModal';
import { POSManageCatalogModal } from '../pos/POSManageCatalogModal';
import { POSProductCard } from '../pos/POSProductCard';
import { POSCartPanel } from '../pos/POSCartPanel';
import { POSRecipePricingModal } from '../pos/POSRecipePricingModal';
import { POSProductionRestockModal } from '../pos/POSProductionRestockModal';
import { POSTimeManagementPanel } from '../pos/POSTimeManagementPanel';

interface POSViewProps {
  tenant?: Tenant | null;
  onNavigateToLedger?: () => void;
}

export const POSView: React.FC<POSViewProps> = ({ tenant, onNavigateToLedger }) => {
  // --- Katalog State ---
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // --- Keranjang & Kasir State ---
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'STATIC_QRIS' | 'QRIS'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>("Pelanggan Umum");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Modals State ---
  const [receiptModal, setReceiptModal] = useState<POSReceipt | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<POSProduct | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState<boolean>(false);
  const [productFeedback, setProductFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- AI Recipe BOM & Dynamic Pricing State ---
  const [recipeProduct, setRecipeProduct] = useState<POSProduct | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false);
  const [isProductionRestockModalOpen, setIsProductionRestockModalOpen] = useState<boolean>(false);
  const [marginAlerts, setMarginAlerts] = useState<MarginLeakageAlert[]>([]);
  const [isDismissedMarginBanner, setIsDismissedMarginBanner] = useState<boolean>(false);

  // --- Konfirmasi Penghapusan Produk Enterprise (Zero Browser Alerts) ---
  const [productToDelete, setProductToDelete] = useState<POSProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState<boolean>(false);
  const [notificationToast, setNotificationToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Memuat katalog produk riil tenant dari PostgreSQL & memindai kebocoran margin
  const reloadCatalog = async () => {
    setIsLoadingCatalog(true);
    setCatalogError(null);
    try {
      const liveProducts = await api.getPOSProducts();
      setProducts(Array.isArray(liveProducts) ? liveProducts : []);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || "Gagal memuat katalog produk dari database.";
      console.error("[POSView] Gagal mengambil katalog produk dari database:", err);
      setCatalogError(errorMsg);
    } finally {
      setIsLoadingCatalog(false);
    }

    // Pindai kebocoran margin secara proaktif
    scanMarginLeakage();
  };

  const scanMarginLeakage = async () => {
    try {
      const res = await api.getMarginLeakageAlerts();
      if (res && Array.isArray(res.alerts)) {
        setMarginAlerts(res.alerts);
      }
    } catch (err) {
      console.warn('[POSView] Gagal memindai margin leakage:', err);
    }
  };

  const handleOpenRecipePricing = (product: POSProduct) => {
    setRecipeProduct(product);
    setIsRecipeModalOpen(true);
  };

  useEffect(() => {
    reloadCatalog();
    const loadStaff = async () => {
      try {
        const staff = await api.getStaffList();
        if (Array.isArray(staff)) setStaffList(staff);
      } catch (e) {
        console.warn('Gagal memuat daftar staf untuk dashboard shift:', e);
      }
    };
    loadStaff();
  }, [tenant?.id]);

  // Metrik Live Inventori & Kasir
  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  }, [products]);

  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  // Metrik Live Shift & Presensi Karyawan
  const totalStaffCount = staffList.length > 0 ? staffList.length : 3;
  const presentStaffCount = staffList.length > 0 ? staffList.filter(s => s.is_active).length : 3;

  // 2. Kategori produk dinamis dari inventaris fisik tenant
  const dynamicCategories = useMemo(() => {
    const catSet = new Set<string>(["Semua"]);
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        catSet.add(p.category.trim());
      }
    });
    return Array.from(catSet);
  }, [products]);

  // 3. Filter produk berdasarkan pencarian & kategori
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "Semua" || p.category === selectedCategory;
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // 4. Kalkulasi Finansial Keranjang (SAK EMKM & PP 55/2022)
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.subtotal, 0), [cart]);
  const taxPP55Estimated = useMemo(() => Math.round(subtotal * 0.005), [subtotal]);
  const grandTotal = subtotal;

  const changeAmount = useMemo(() => {
    if (paymentMethod === 'CASH') {
      return cashTendered > grandTotal ? cashTendered - grandTotal : 0;
    }
    return 0;
  }, [paymentMethod, cashTendered, grandTotal]);

  const isCashInsufficient = paymentMethod === 'CASH' && grandTotal > 0 && cashTendered < grandTotal;

  // 5. Aksi Keranjang
  const handleAddToCart = (product: POSProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.price * (1 - item.discountPercent / 100)
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          discountPercent: 0,
          subtotal: product.price
        }
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.product.price * (1 - item.discountPercent / 100)
            };
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setCashTendered(0);
    setErrorMessage(null);
  };

  // 6. Transaksi Kasir Atomik (ACID Double-Entry SAK EMKM)
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage("Keranjang kasir masih kosong. Silakan pilih produk terlebih dahulu.");
      return;
    }

    if (paymentMethod === 'CASH' && cashTendered < grandTotal) {
      setErrorMessage(`Uang tunai diserahkan (Rp ${cashTendered.toLocaleString('id-ID')}) kurang dari total belanja (Rp ${grandTotal.toLocaleString('id-ID')}).`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const payload = {
      items: cart.map((c) => ({
        product_id: c.product.id,
        product_name: c.product.name,
        sku: c.product.sku,
        quantity: c.quantity,
        unit_price: c.product.price,
        cogs: c.product.cogs,
        discount_percent: c.discountPercent
      })),
      payment_method: paymentMethod,
      cash_tendered: paymentMethod === 'CASH' ? cashTendered : grandTotal,
      customer_name: customerName || "Pelanggan Umum",
      customer_phone: customerPhone || undefined,
      notes: "Transaksi POS Kasir Cepat FINA"
    };

    try {
      const receipt = await api.checkoutPOS(payload);
      if (receipt) {
        setReceiptModal(receipt);
        handleClearCart();
        await reloadCatalog();
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || "Terjadi kesalahan saat memproses transaksi.";
      console.error("[POSView] Checkout transaksi POS gagal:", err);
      setErrorMessage(`Gagal Memproses Transaksi: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. CRUD Produk Tenant Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductFeedback(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: POSProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProduct(prod);
    setProductFeedback(null);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (payload: {
    name: string;
    sku?: string;
    category: string;
    price: number;
    cogs: number;
    stock: number;
    unit: string;
    image_url?: string;
  }) => {
    setIsSubmittingProduct(true);
    setProductFeedback(null);
    try {
      if (editingProduct) {
        await api.updatePOSProduct(editingProduct.id, payload);
        setProductFeedback({ type: 'success', message: 'Produk berhasil diperbarui di basis data!' });
      } else {
        await api.createPOSProduct(payload);
        setProductFeedback({ type: 'success', message: 'Produk baru berhasil ditambahkan ke basis data!' });
      }
      await reloadCatalog();
      setTimeout(() => {
        setIsProductModalOpen(false);
        setProductFeedback(null);
      }, 1200);
    } catch (err: any) {
      const msg = err?.message || 'Gagal menyimpan data produk.';
      setProductFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Membuka dialog konfirmasi penghapusan enterprise (mencegah accidental deletion)
  const handleRequestDelete = (prod: POSProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProductToDelete(prod);
  };

  // Eksekusi penghapusan produk dari database PostgreSQL secara ACID
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await api.deletePOSProduct(productToDelete.id);
      
      // Sinkronkan state inventaris lokal
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      
      // Hapus item dari keranjang kasir jika produk yang dihapus sedang ada di keranjang
      setCart((prev) => prev.filter((item) => item.product.id !== productToDelete.id));

      // Jika modal edit sedang terbuka untuk produk ini, tutup modal edit
      if (editingProduct?.id === productToDelete.id) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
      }

      setNotificationToast({
        type: 'success',
        message: `Produk "${productToDelete.name}" berhasil dihapus dari katalog tenant.`
      });
      setTimeout(() => setNotificationToast(null), 3500);
      setProductToDelete(null);
    } catch (err: any) {
      console.error("[POSView] Gagal menghapus produk:", err);
      setNotificationToast({
        type: 'error',
        message: `Gagal menghapus produk: ${err?.message || 'Kesalahan sistem basis data'}`
      });
      setTimeout(() => setNotificationToast(null), 4000);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleQuickStockAdjust = async (product: POSProduct, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    try {
      const updated = await api.updatePOSProduct(product.id, { stock: newStock });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      console.error("Gagal update stok cepat:", err);
    }
  };

  // Sub-Tab Switcher: 'POS' (Terminal Kasir) vs 'TIME_MANAGE' (Time & Attendance Dashboard)
  const [posSubTab, setPosSubTab] = useState<'POS' | 'TIME_MANAGE'>('POS');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* =========================================================================
          1. TOP BREADCRUMB & ACTION BUTTONS (Sesuai Referensi Gambar 4)
          ========================================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
          <span style={{ color: 'var(--mint-neon)', fontWeight: 600 }}>Home</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>/</span>
          <span style={{ color: '#94a3b8' }}>Time Manage</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sub-Tab Navigation Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            padding: '3px'
          }}>
            <button
              onClick={() => setPosSubTab('POS')}
              className={`homies-pill-btn ${posSubTab === 'POS' ? 'active' : ''}`}
            >
              🛒 Terminal Kasir POS
            </button>
            <button
              onClick={() => setPosSubTab('TIME_MANAGE')}
              className={`homies-pill-btn ${posSubTab === 'TIME_MANAGE' ? 'active' : ''}`}
            >
              ⏱️ Time Management & Shift
            </button>
          </div>

          <button className="homies-icon-btn" title="Kalender Shift">
            <Calendar size={16} />
          </button>
          <button className="homies-icon-btn" title="Ekspor Log Presensi">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. HEADER TITLE & SUBTITLE
          ========================================================================= */}
      <div>
        <h1 style={{ 
          fontSize: '2.1rem', 
          fontWeight: 700, 
          color: '#FFFFFF', 
          letterSpacing: '-0.025em',
          margin: '0 0 4px 0',
          fontFamily: 'var(--font-display)'
        }}>
          {posSubTab === 'POS' ? 'Point of Sale (POS) & Kasir' : 'Time Management Dashboard'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.90rem', margin: 0 }}>
          {posSubTab === 'POS' 
            ? 'Terminal Kasir Cepat • Auto-Posting Double-Entry SAK EMKM • Estimasi Pajak PP 55/2022'
            : 'Monitor attendance, shifts, and employee productivity efficiently.'}
        </p>
      </div>

      {/* =========================================================================
          3. TOP STAT PILLS (Dinamis Sesuai Tab: POS atau Time Management)
          ========================================================================= */}
      {posSubTab === 'POS' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {/* POS Stat 1: Total Produk */}
          <div className="homies-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(0, 223, 143, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mint-neon)',
              flexShrink: 0
            }}>
              <Package size={20} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                {products.length}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                Katalog Siap Jual
              </div>
            </div>
          </div>

          {/* POS Stat 2: Total Nilai Inventori */}
          <div className="homies-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8',
              flexShrink: 0
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: '1.20rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                {formatCurrency(totalInventoryValue)}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                Total Nilai Stok
              </div>
            </div>
          </div>

          {/* POS Stat 3: Stok Fisik Tersedia */}
          <div className="homies-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FBBF24',
              flexShrink: 0
            }}>
              <ShoppingCart size={20} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                {totalStockUnits}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                Unit Stok Fisik
              </div>
            </div>
          </div>

          {/* POS Stat 4: Estimasi PPh Final PP 55 */}
          <div className="homies-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(0, 223, 143, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mint-neon)',
              flexShrink: 0
            }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--mint-neon)', lineHeight: 1.1 }}>
                0.5%
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                PPh Final PP 55 (SAK EMKM)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TIME MANAGEMENT DASHBOARD WIDGETS
          ========================================================================= */}
      {posSubTab === 'TIME_MANAGE' && (
        <POSTimeManagementPanel
          staffList={staffList}
          totalStaffCount={totalStaffCount}
          presentStaffCount={presentStaffCount}
        />
      )}

      {/* =========================================================================
          ACTIVE CASHIER POS WORKSPACE (Katalog Produk & Keranjang)
          ========================================================================= */}
      {posSubTab === 'POS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Action Bar */}
          <div className="homies-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'rgba(0, 223, 143, 0.12)',
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid rgba(0, 223, 143, 0.3)'
              }}>
                <ShoppingCart size={20} color="var(--mint-neon)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Katalog Kasir Toko & Inventori
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                  {filteredProducts.length} Produk Siap Jual • Auto-Posting Double-Entry SAK EMKM
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsProductionRestockModalOpen(true)}
                className="homies-pill-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: 'var(--mint-neon)'
                }}
              >
                <Factory size={14} />
                <span>📦 Restock & Produksi AI</span>
              </button>

              <button
                onClick={handleOpenAddProduct}
                className="homies-pill-btn active"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusCircle size={14} />
                <span>+ Produk Baru</span>
              </button>

              <button
                onClick={() => setIsManageModalOpen(true)}
                className="homies-pill-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Settings size={14} />
                <span>Kelola Stok</span>
              </button>
            </div>
          </div>

      {/* 2. Main Workstation: Dual Panel (Katalog & Keranjang) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(360px, 1fr)', gap: '20px', alignItems: 'start' }}>
        
        {/* PANEL KIRI: Katalog Produk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Banner Peringatan Kebocoran Margin (Margin Leakage Guard) */}
          {marginAlerts.length > 0 && !isDismissedMarginBanner && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.12) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f87171',
                  flexShrink: 0
                }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Peringatan Kebocoran Margin (AI Pricing Guard)</span>
                    <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                      {marginAlerts.length} Produk Berisiko Rugi!
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#cbd5e1' }}>
                    Biaya bahan baku naik atau takaran BOM melebihi harga jual saat ini. Sesuaikan harga jual sekarang agar terhindar dari kerugian kasir!
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const firstAlertProd = products.find(p => p.id === marginAlerts[0]?.product_id);
                    if (firstAlertProd) {
                      handleOpenRecipePricing(firstAlertProd);
                    } else {
                      setIsProductionRestockModalOpen(true);
                    }
                  }}
                  className="btn btn-sm btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}
                >
                  <Sparkles size={13} />
                  <span>Evaluasi {marginAlerts[0]?.product_name || 'Produk'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDismissedMarginBanner(true)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  title="Tutup Peringatan"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Search & Kategori */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Cari nama produk, makanan, minuman, atau scan SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedCategory === cat
                      ? 'linear-gradient(135deg, var(--emerald-500), var(--cyan-600))'
                      : 'rgba(30, 41, 59, 0.6)',
                    color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Produk / State Penanganan */}
          {isLoadingCatalog ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '14px', height: '220px', opacity: 0.6 }}>
                  <div style={{ width: '100%', height: '110px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', marginBottom: '12px' }} />
                  <div style={{ width: '70%', height: '14px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', marginBottom: '8px' }} />
                  <div style={{ width: '40%', height: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          ) : catalogError ? (
            <div className="glass-panel" style={{ padding: '36px 20px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <AlertCircle size={40} color="var(--rose-400)" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>Koneksi Katalog Terputus</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto 12px auto' }}>{catalogError}</p>
              <button type="button" onClick={reloadCatalog} className="btn btn-sm btn-outline">Muat Ulang Katalog</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Package size={48} color="var(--text-muted)" style={{ opacity: 0.5, margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
                {products.length === 0 ? 'Katalog Produk Masih Kosong' : 'Tidak Ada Produk yang Cocok'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                {products.length === 0
                  ? 'Unit usaha Anda belum memiliki produk di basis data. Klik tombol di bawah untuk mendaftarkan produk baru.'
                  : `Tidak ditemukan produk untuk "${searchQuery}".`}
              </p>
              {products.length === 0 ? (
                <button type="button" onClick={handleOpenAddProduct} className="btn btn-primary btn-sm">
                  <PlusCircle size={15} />
                  <span>+ Tambah Produk Pertama</span>
                </button>
              ) : (
                <button type="button" onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); }} className="btn btn-secondary btn-sm">
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px' }}>
              {filteredProducts.map((p) => (
                <POSProductCard
                  key={p.id}
                  product={p}
                  inCart={cart.find((c) => c.product.id === p.id)}
                  onAddToCart={handleAddToCart}
                  onEdit={handleOpenEditProduct}
                  onDelete={handleRequestDelete}
                  onOpenPricing={handleOpenRecipePricing}
                />
              ))}
            </div>
          )}
        </div>


        {/* PANEL KANAN: Keranjang & Checkout Kasir */}
        <POSCartPanel
          cart={cart}
          customerName={customerName}
          customerPhone={customerPhone}
          onCustomerNameChange={setCustomerName}
          onCustomerPhoneChange={setCustomerPhone}
          onClearCart={handleClearCart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          subtotal={subtotal}
          taxPP55Estimated={taxPP55Estimated}
          grandTotal={grandTotal}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          cashTendered={cashTendered}
          onCashTenderedChange={setCashTendered}
          changeAmount={changeAmount}
          isCashInsufficient={isCashInsufficient}
          isProcessing={isProcessing}
          errorMessage={errorMessage}
          onCheckout={handleCheckout}
        />
      </div>
        </div>
      )}

      {/* MODAL 1: Cetak Struk Termal 80mm */}
      <POSThermalReceiptModal
        receipt={receiptModal}
        onClose={() => setReceiptModal(null)}
        onNavigateToLedger={onNavigateToLedger}
      />

      {/* MODAL 2: Tambah / Edit Produk */}
      <POSProductModal
        isOpen={isProductModalOpen}
        editingProduct={editingProduct}
        tenantName={tenant?.name || 'Unit Usaha'}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSaveProduct}
        onDelete={handleRequestDelete}
        isSubmitting={isSubmittingProduct}
        feedback={productFeedback}
      />

      {/* MODAL 3: Manajemen Stok & Katalog Tenant */}
      <POSManageCatalogModal
        isOpen={isManageModalOpen}
        products={products}
        tenantName={tenant?.name || 'Unit Usaha'}
        onClose={() => setIsManageModalOpen(false)}
        onOpenAddProduct={handleOpenAddProduct}
        onOpenEditProduct={(prod) => {
          setEditingProduct(prod);
          setIsProductModalOpen(true);
        }}
        onDeleteProduct={handleRequestDelete}
        onQuickStockAdjust={handleQuickStockAdjust}
      />

      {/* MODAL 4: Dialog Konfirmasi Penghapusan Produk Enterprise (WCAG 2.2 AA / Zero Browser Alert) */}
      <ConfirmDialog
        isOpen={productToDelete !== null}
        variant="danger"
        icon={<Trash2 size={22} color="#fb7185" />}
        title="Hapus Produk dari Katalog?"
        message={`Apakah Anda yakin ingin menghapus produk "${productToDelete?.name}" (SKU: ${productToDelete?.sku || '-'}) secara permanen dari katalog tenant?`}
        subtext="Tindakan ini menghapus produk dari inventaris aktif toko. Seluruh rekaman jurnal SAK EMKM dan arsip nota transaksi masa lalu tetap tersimpan utuh demi kepatuhan audit pembukuan."
        confirmLabel={isDeletingProduct ? "Menghapus..." : "Hapus Permanen"}
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeletingProduct) setProductToDelete(null);
        }}
      />

      {/* MODAL 5: AI Resep BOM & Dynamic Pricing Anti-Rugi */}
      <POSRecipePricingModal
        isOpen={isRecipeModalOpen}
        product={recipeProduct}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setRecipeProduct(null);
        }}
        onPriceUpdated={(updatedProduct) => {
          reloadCatalog();
          setNotificationToast({
            type: 'success',
            message: `Harga jual ${updatedProduct.name} berhasil diperbarui ke ${formatCurrency(updatedProduct.price)} (BOM Terlindungi).`
          });
        }}
      />

      {/* MODAL 6: Restock Bahan Baku & Produksi Batch */}
      <POSProductionRestockModal
        isOpen={isProductionRestockModalOpen}
        products={products}
        onClose={() => setIsProductionRestockModalOpen(false)}
        onRestockSuccess={(res) => {
          reloadCatalog();
          setNotificationToast({
            type: 'success',
            message: res.message
          });
        }}
        onProductionSuccess={(res) => {
          reloadCatalog();
          setNotificationToast({
            type: 'success',
            message: `Batch #${res.batch_number} berhasil diproduksi (+${res.quantity_produced} unit).`
          });
        }}
        onOpenRecipePricing={(prod) => {
          setIsProductionRestockModalOpen(false);
          handleOpenRecipePricing(prod);
        }}
      />

      {/* Toast Notifikasi Operasi Kasir */}
      {notificationToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 1100,
          padding: '12px 18px',
          borderRadius: '10px',
          background: notificationToast.type === 'success' 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))' 
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          fontWeight: 600,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {notificationToast.type === 'success' ? (
            <CheckCircle2 size={18} color="#ffffff" />
          ) : (
            <AlertTriangle size={18} color="#ffffff" />
          )}
          <span>{notificationToast.message}</span>
          <button
            type="button"
            onClick={() => setNotificationToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '2px',
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default POSView;
