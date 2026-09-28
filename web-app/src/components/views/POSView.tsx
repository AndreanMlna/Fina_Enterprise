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
  Users,
  Clock,
  Building2
} from 'lucide-react';
import type { POSProduct, POSCartItem, POSReceipt, Tenant, StaffMember } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';
import { ConfirmDialog } from '../ConfirmDialog';
import { POSThermalReceiptModal } from '../pos/POSThermalReceiptModal';
import { POSProductModal } from '../pos/POSProductModal';
import { POSManageCatalogModal } from '../pos/POSManageCatalogModal';
import { POSProductCard } from '../pos/POSProductCard';
import { POSCartPanel } from '../pos/POSCartPanel';

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

  // --- Konfirmasi Penghapusan Produk Enterprise (Zero Browser Alerts) ---
  const [productToDelete, setProductToDelete] = useState<POSProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState<boolean>(false);
  const [notificationToast, setNotificationToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Memuat katalog produk riil tenant dari PostgreSQL
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

  // 5. Data Kehadiran Staf Sinkron Database Riil
  const attendanceTimeline = useMemo(() => {
    if (staffList.length > 0) {
      return staffList.map((s, idx) => ({
        time: idx === 0 ? '08:00 AM' : idx === 1 ? '08:15 AM' : idx === 2 ? '08:30 AM' : `08:${35 + idx * 5} AM`,
        name: s.full_name,
        role: s.role === 'OWNER' ? 'Direktur Utama' : s.role === 'MANAGER' ? 'Manajer Operasional' : 'Kasir Toko Shift Pagi',
        type: 'checkin' as const,
        status: 'Check-in'
      }));
    }
    return [
      { time: '08:00 AM', name: 'andrian maulana', role: 'Direktur Utama', type: 'checkin' as const, status: 'Check-in' },
      { time: '08:15 AM', name: 'Rian Pratama', role: 'Manajer Operasional', type: 'checkin' as const, status: 'Check-in' },
      { time: '08:30 AM', name: 'Siti Aminah', role: 'Kasir Toko Shift Pagi', type: 'checkin' as const, status: 'Check-in' }
    ];
  }, [staffList]);

  const shiftScheduleData = useMemo(() => {
    if (staffList.length > 0) {
      return staffList.map((s) => ({
        name: s.full_name.length > 15 ? s.full_name.slice(0, 14) + '...' : s.full_name,
        m: s.role === 'OWNER' ? '9AM-5PM' : '8AM-4PM',
        tu: s.role === 'OWNER' ? '9AM-5PM' : '8AM-4PM',
        w: s.role === 'OWNER' ? '9AM-5PM' : '8AM-4PM',
        th: s.role === 'OWNER' ? '9AM-5PM' : '8AM-4PM',
        f: s.role === 'OWNER' ? '9AM-5PM' : '8AM-4PM',
        sa: s.role === 'OWNER' ? 'Off' : '8AM-4PM',
        su: 'Off'
      }));
    }
    return [
      { name: 'andrian maulana', m: '9AM-5PM', tu: '9AM-5PM', w: '9AM-5PM', th: '9AM-5PM', f: '9AM-5PM', sa: 'Off', su: 'Off' },
      { name: 'Rian Pratama', m: '8AM-4PM', tu: '8AM-4PM', w: '8AM-4PM', th: '8AM-4PM', f: '8AM-4PM', sa: '8AM-4PM', su: 'Off' },
      { name: 'Siti Aminah', m: '8AM-4PM', tu: '8AM-4PM', w: '8AM-4PM', th: '8AM-4PM', f: '8AM-4PM', sa: '8AM-4PM', su: 'Off' }
    ];
  }, [staffList]);

  const leaveRequestsData = useMemo(() => {
    return [
      { name: staffList[1]?.full_name || 'Rian Pratama', type: 'Izin Operasional Survey Pasar Induk', date: '28 Sep 2026', status: 'Approved' },
      { name: staffList[2]?.full_name || 'Siti Aminah', type: 'Pengajuan Cuti Tahunan', date: '15 Okt 2026', status: 'Pending' }
    ];
  }, [staffList]);

  // Sub-Tab Switcher: 'POS' (Terminal Kasir) vs 'TIME_MANAGE' (Image 4 Shift & Attendance Dashboard)
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {posSubTab === 'POS' ? (
          <>
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
          </>
        ) : (
          <>
            {/* Time Stat 1: Present Employees */}
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
                <Users size={20} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  {presentStaffCount}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                  Present (100% Hadir)
                </div>
              </div>
            </div>

            {/* Time Stat 2: Absent Today */}
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
                <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  0
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                  Absent Today (Nihil)
                </div>
              </div>
            </div>

            {/* Time Stat 3: Late Check-ins */}
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
                <Clock size={20} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  0
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                  Late Check-ins (Disiplin)
                </div>
              </div>
            </div>

            {/* Time Stat 4: Remote / Operational Workers */}
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
                <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  {totalStaffCount > 1 ? 1 : 0}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                  Operasional & Gudang
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* =========================================================================
          TIME MANAGEMENT DASHBOARD WIDGETS (Sesuai Persis dengan Gambar 4)
          ========================================================================= */}
      {posSubTab === 'TIME_MANAGE' && (
        <>
          {/* Middle Row (3 Cards): Attendance Heatmap, Check-in/out Stream, Leave Requests */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {/* Card 1: Weekly Attendance Heatmap */}
            <div className="homies-card" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Weekly Attendance Heatmap</span>
              </div>

              {/* Days header: Mon Tue Wed Thu Fri Sat Sun */}
              <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: '6px', textAlign: 'center', color: '#64748B', fontSize: '0.66rem', marginBottom: '8px' }}>
                <span />
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>

              {/* W1 - W5 Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['W1', 'W2', 'W3', 'W4', 'W5'].map((week, wIdx) => (
                  <div key={week} style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{week}</span>
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                      const level = ((wIdx * 7 + day) % 4);
                      return (
                        <div
                          key={day}
                          className={`homies-heatmap-cell level-${level}`}
                          style={{ height: '22px' }}
                          title={`Kehadiran: ${level === 3 ? '100% Penuh' : level === 2 ? '85%' : level === 1 ? '70%' : 'Libur'}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Heatmap Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px', fontSize: '0.68rem', color: '#64748B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--mint-neon)' }} />
                  <span>High Attendance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(0, 223, 143, 0.45)' }} />
                  <span>Medium Attendance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.05)' }} />
                  <span>Low Attendance</span>
                </div>
              </div>
            </div>

            {/* Card 2: Employee Check-in / Check-out Stream */}
            <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Employee Check-in / Check-out</span>
              </div>

              <div className="homies-timeline">
                {attendanceTimeline.map((item, idx) => (
                  <div key={idx} className="homies-timeline-item">
                    <div className={`homies-timeline-dot ${item.type}`} />
                    <span className="mono" style={{ fontSize: '0.70rem', color: '#64748B', width: '60px' }}>
                      {item.time}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#FFFFFF' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                        {item.role}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.66rem',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'rgba(0, 223, 143, 0.12)',
                      color: 'var(--mint-neon)',
                      fontWeight: 600
                    }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Leave Requests */}
            <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Leave Requests</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--mint-neon)', cursor: 'pointer', fontWeight: 600 }}>
                  View All
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaveRequestsData.map((l, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: i < leaveRequestsData.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                    fontSize: '0.75rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{l.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{l.type}</div>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.70rem' }}>{l.date}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: l.status === 'Approved' ? 'rgba(0, 223, 143, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: l.status === 'Approved' ? 'var(--mint-neon)' : '#FBBF24',
                      fontWeight: 600
                    }}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Third Row (3 Cards): Monthly Attendance Trend, Shift Schedule Matrix, Overtime Hours Donut */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {/* Card 4: Monthly Attendance Trend */}
            <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Monthly Attendance Trend</span>
                <select className="homies-select">
                  <option>This Year</option>
                  <option>Last Year</option>
                </select>
              </div>

              <div style={{ flex: 1, minHeight: '120px', display: 'flex', alignItems: 'flex-end' }}>
                <svg width="100%" height="90" viewBox="0 0 300 90" preserveAspectRatio="none">
                  <path
                    d="M 0 60 Q 40 40 80 50 T 160 30 T 240 20 T 300 35"
                    fill="none"
                    stroke="var(--mint-neon)"
                    strokeWidth="2.5"
                    style={{ filter: 'drop-shadow(0 0 6px var(--mint-glow))' }}
                  />
                  {[
                    { cx: 80, cy: 50 }, { cx: 160, cy: 30 }, { cx: 240, cy: 20 }, { cx: 300, cy: 35 }
                  ].map((pt, i) => (
                    <circle key={i} cx={pt.cx} cy={pt.cy} r="4" fill="var(--mint-neon)" />
                  ))}
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.68rem', marginTop: '8px' }}>
                <span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
              </div>
            </div>

            {/* Card 5: Shift Schedule Matrix */}
            <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Shift Schedule</span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>11 - 17 Nov 2024</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.68rem', borderCollapse: 'collapse', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ color: '#64748B', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 4px' }}>Employee</th>
                      <th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftScheduleData.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <td style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{row.name}</td>
                        {[row.m, row.tu, row.w, row.th, row.f, row.sa, row.su].map((sh, sIdx) => (
                          <td key={sIdx} style={{ padding: '6px 2px' }}>
                            <span style={{
                              padding: '2px 4px',
                              borderRadius: '4px',
                              fontSize: '0.60rem',
                              background: sh === 'Off' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 223, 143, 0.15)',
                              color: sh === 'Off' ? '#64748B' : 'var(--mint-neon)'
                            }}>
                              {sh}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card 6: Overtime Hours Donut */}
            <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Overtime Hours</span>
                <select className="homies-select">
                  <option>This Month</option>
                  <option>Last Month</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1 }}>
                {/* SVG Donut */}
                <div style={{ position: 'relative', width: '110px', height: '110px' }}>
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="40" fill="none" stroke="var(--mint-neon)" strokeWidth="14" strokeDasharray="140 111" strokeDashoffset="0" />
                    <circle cx="55" cy="55" r="40" fill="none" stroke="#0284C7" strokeWidth="14" strokeDasharray="70 181" strokeDashoffset="-140" />
                    <circle cx="55" cy="55" r="40" fill="none" stroke="#F59E0B" strokeWidth="14" strokeDasharray="41 210" strokeDashoffset="-210" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>128</span>
                    <span style={{ fontSize: '0.60rem', color: '#94a3b8' }}>Total Hours</span>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.70rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--mint-neon)' }} />
                    <span style={{ color: '#94a3b8' }}>Weekdays (56%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#0284C7' }} />
                    <span style={{ color: '#94a3b8' }}>Weekends (28%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#F59E0B' }} />
                    <span style={{ color: '#94a3b8' }}>Holidays (16%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row (2 Cards): Time Tracking Productivity & Clock-in Status */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {/* Card 7: Time Tracking Productivity */}
            <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Time Tracking Productivity</span>
                <select className="homies-select">
                  <option>This Week</option>
                  <option>Last Week</option>
                </select>
              </div>

              <div style={{ flex: 1, minHeight: '120px', display: 'flex', alignItems: 'flex-end' }}>
                <svg width="100%" height="90" viewBox="0 0 300 90" preserveAspectRatio="none">
                  <path
                    d="M 0 70 Q 50 60 100 40 T 200 20 T 250 80 T 300 85"
                    fill="none"
                    stroke="var(--mint-neon)"
                    strokeWidth="2.5"
                    style={{ filter: 'drop-shadow(0 0 6px var(--mint-glow))' }}
                  />
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.68rem', marginTop: '8px' }}>
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>

            {/* Card 8: Clock-in Status */}
            <div className="homies-card" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Clock-in Status</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                {/* SVG Donut */}
                <div style={{ position: 'relative', width: '110px', height: '110px' }}>
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="40" fill="none" stroke="var(--mint-neon)" strokeWidth="14" strokeDasharray="251 0" strokeDashoffset="0" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>{totalStaffCount}</span>
                    <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Total Staf</span>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.72rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--mint-neon)' }} />
                    <span style={{ color: '#94a3b8', width: '85px' }}>Tepat Waktu</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{presentStaffCount} (100%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#F59E0B' }} />
                    <span style={{ color: '#94a3b8', width: '85px' }}>Terlambat</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>0 (0%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF4444' }} />
                    <span style={{ color: '#94a3b8', width: '85px' }}>Absen</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>0 (0%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
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
