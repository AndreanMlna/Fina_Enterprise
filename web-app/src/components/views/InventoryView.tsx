import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  PlusCircle,
  RefreshCw,
  Search,
  AlertTriangle,
  Package,
  Wrench,
  Layers,
  ClipboardCheck,
  CheckCircle2,
  X,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import type { Tenant, POSProduct, InventorySummary, StockMovement, InventoryItem } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';
import { POSProductionRestockModal } from '../pos/POSProductionRestockModal';
import { POSRecipePricingModal } from '../pos/POSRecipePricingModal';

interface InventoryViewProps {
  tenant?: Tenant | null;
  onNavigateToPOS?: () => void;
  onNavigateToLedger?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  tenant,
  onNavigateToPOS,
  onNavigateToLedger
}) => {
  // Sub-tabs utama
  const [activeSubTab, setActiveSubTab] = useState<'RAW_MATERIALS' | 'FINISHED_GOODS' | 'EQUIPMENT' | 'MOVEMENTS'>('RAW_MATERIALS');

  // State data dari backend
  const [summaryData, setSummaryData] = useState<InventorySummary | null>(null);
  const [allProducts, setAllProducts] = useState<POSProduct[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [movementFilter, setMovementFilter] = useState<string>('ALL');

  // Modals integration
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [restockInitialTab, setRestockInitialTab] = useState<'restock' | 'production'>('restock');
  const [restockTargetProductId, setRestockTargetProductId] = useState<string | undefined>(undefined);

  // Recipe Modal integration
  const [recipeProduct, setRecipeProduct] = useState<POSProduct | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false);

  // Stock Opname / Adjustment Modal
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState<boolean>(false);
  const [opnameItem, setOpnameItem] = useState<InventoryItem | null>(null);
  const [opnameActualStock, setOpnameActualStock] = useState<number>(0);
  const [opnameReason, setOpnameReason] = useState<string>('Selisih Perhitungan Opname Fisik');
  const [opnameNotes, setOpnameNotes] = useState<string>('');
  const [isSubmittingOpname, setIsSubmittingOpname] = useState<boolean>(false);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Muat data dari backend
  const loadInventoryData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, prodRes, movRes] = await Promise.all([
        api.getInventorySummary(),
        api.getPOSProducts(undefined, undefined, 'all'),
        api.getStockMovements(undefined, undefined, 100)
      ]);
      setSummaryData(sumRes);
      setAllProducts(Array.isArray(prodRes) ? prodRes : []);
      setMovements(Array.isArray(movRes) ? movRes : []);
    } catch (err: any) {
      console.error('[InventoryView] Gagal memuat data inventaris:', err);
      showToast('error', err?.message || 'Gagal memuat data persediaan gudang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, [tenant?.id]);

  // Filter bahan baku
  const filteredRawMaterials = useMemo(() => {
    if (!summaryData) return [];
    return summaryData.raw_materials.filter(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [summaryData, searchQuery]);

  // Filter produk jadi
  const filteredFinishedGoods = useMemo(() => {
    if (!summaryData) return [];
    return summaryData.finished_goods.filter(g =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [summaryData, searchQuery]);

  // Filter alat & aset
  const filteredEquipment = useMemo(() => {
    if (!summaryData) return [];
    return summaryData.equipment_assets.filter(e =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [summaryData, searchQuery]);

  // Filter buku mutasi
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchSearch =
        m.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = movementFilter === 'ALL' || m.movement_type === movementFilter;
      return matchSearch && matchType;
    });
  }, [movements, searchQuery, movementFilter]);

  // Buka modal restock bahan tertentu
  const handleOpenRestock = (productId?: string) => {
    setRestockInitialTab('restock');
    setRestockTargetProductId(productId);
    setIsRestockModalOpen(true);
  };

  // Buka modal produksi batch untuk produk tertentu
  const handleOpenProduction = (productId?: string) => {
    setRestockInitialTab('production');
    setRestockTargetProductId(productId);
    setIsRestockModalOpen(true);
  };

  // Buka modal resep
  const handleOpenRecipe = (item: InventoryItem) => {
    const fullProd = allProducts.find(p => p.id === item.id);
    if (fullProd) {
      setRecipeProduct(fullProd);
      setIsRecipeModalOpen(true);
    }
  };

  // Buka modal opname
  const handleOpenOpname = (item: InventoryItem) => {
    setOpnameItem(item);
    setOpnameActualStock(item.stock);
    setOpnameReason('Selisih Perhitungan Opname Fisik');
    setOpnameNotes('');
    setIsOpnameModalOpen(true);
  };

  // Submit stock opname
  const handleConfirmOpname = async () => {
    if (!opnameItem) return;
    setIsSubmittingOpname(true);
    try {
      const res = await api.adjustStock({
        product_id: opnameItem.id,
        actual_physical_stock: Number(opnameActualStock),
        reason: opnameReason,
        notes: opnameNotes
      });
      showToast('success', res.message || 'Stok fisik berhasil diselaraskan.');
      setIsOpnameModalOpen(false);
      setOpnameItem(null);
      await loadInventoryData();
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || err?.message || 'Gagal menyimpan penyesuaian opname.');
    } finally {
      setIsSubmittingOpname(false);
    }
  };

  // Bahan baku untuk recipe modal
  const availableMaterialsForRecipe = useMemo(() => {
    return allProducts.filter(p => {
      const cat = (p.category || '').toLowerCase();
      const n = (p.name || '').toLowerCase();
      return ['bahan', 'raw', 'material', 'kemasan', 'packaging'].some(k => cat.includes(k) || n.includes(k));
    });
  }, [allProducts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(17, 26, 36, 0.95), rgba(15, 23, 42, 0.95))',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Boxes size={26} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Gudang & Manajemen Persediaan
              </h1>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                SAK EMKM Kepatuhan 100%
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Pencatatan otomatis persediaan bahan baku, barang siap jual, alat operasional, serta audit mutasi fisik real-time.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenRestock()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <PlusCircle size={15} />
            <span>Restock / Tambah Bahan</span>
          </button>

          <button
            onClick={() => handleOpenProduction()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
            }}
          >
            <Layers size={15} />
            <span>Eksekusi Batch Produksi</span>
          </button>

          <button
            onClick={loadInventoryData}
            title="Segarkan Data Gudang"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {onNavigateToPOS && (
            <button
              onClick={onNavigateToPOS}
              title="Kembali ke Layar Kasir POS"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <span>Kasir POS</span>
              <ArrowRight size={13} />
            </button>
          )}

          {onNavigateToLedger && (
            <button
              onClick={onNavigateToLedger}
              title="Buka Buku Jurnal SAK EMKM"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <span>Jurnal SAK EMKM</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {/* Card 1: Bahan Baku (1104) */}
        <div style={{
          background: 'rgba(17, 26, 36, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Bahan Baku & Kemasan
            </span>
            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.12)', color: '#38bdf8' }}>
              Akun 1104
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
            {formatCurrency(summaryData?.summary.total_raw_material_value || 0)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
            {summaryData?.summary.raw_materials_count || 0} item bahan baku aktif tersimpan
          </div>
        </div>

        {/* Card 2: Produk Jadi (1105) */}
        <div style={{
          background: 'rgba(17, 26, 36, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Produk Siap Jual
            </span>
            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
              Akun 1105
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
            {formatCurrency(summaryData?.summary.total_finished_goods_value || 0)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
            {summaryData?.summary.finished_goods_count || 0} varian produk siap transaksi di POS
          </div>
        </div>

        {/* Card 3: Alat & Perlengkapan (1201) */}
        <div style={{
          background: 'rgba(17, 26, 36, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Peralatan & Aset Toko
            </span>
            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
              Akun 1201
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
            {formatCurrency(summaryData?.summary.total_equipment_value || 0)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
            {summaryData?.summary.equipment_assets_count || 0} unit aset alat tidak susut di resep
          </div>
        </div>

        {/* Card 4: Total Aset Persediaan & Peringatan Stok */}
        <div style={{
          background: 'rgba(17, 26, 36, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Nilai Fisik Gudang
            </span>
            {(summaryData?.summary.low_stock_alerts_count || 0) > 0 && (
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', fontWeight: 700 }}>
                {summaryData?.summary.low_stock_alerts_count} Menipis
              </span>
            )}
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#a78bfa' }}>
            {formatCurrency(summaryData?.summary.total_warehouse_value || 0)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Akumulasi seluruh barang, bahan & aset toko
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION & SEARCH BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.75)',
        padding: '10px 14px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {/* Tab Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('RAW_MATERIALS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeSubTab === 'RAW_MATERIALS' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              color: activeSubTab === 'RAW_MATERIALS' ? '#38bdf8' : '#94a3b8',
              boxShadow: activeSubTab === 'RAW_MATERIALS' ? 'inset 0 0 0 1px rgba(6, 182, 212, 0.4)' : 'none'
            }}
          >
            <Package size={15} />
            <span>Bahan Baku ({summaryData?.summary.raw_materials_count || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('FINISHED_GOODS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeSubTab === 'FINISHED_GOODS' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeSubTab === 'FINISHED_GOODS' ? '#34d399' : '#94a3b8',
              boxShadow: activeSubTab === 'FINISHED_GOODS' ? 'inset 0 0 0 1px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            <Boxes size={15} />
            <span>Produk Jadi ({summaryData?.summary.finished_goods_count || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('EQUIPMENT')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeSubTab === 'EQUIPMENT' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: activeSubTab === 'EQUIPMENT' ? '#fbbf24' : '#94a3b8',
              boxShadow: activeSubTab === 'EQUIPMENT' ? 'inset 0 0 0 1px rgba(245, 158, 11, 0.4)' : 'none'
            }}
          >
            <Wrench size={15} />
            <span>Alat & Peralatan ({summaryData?.summary.equipment_assets_count || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('MOVEMENTS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeSubTab === 'MOVEMENTS' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              color: activeSubTab === 'MOVEMENTS' ? '#c084fc' : '#94a3b8',
              boxShadow: activeSubTab === 'MOVEMENTS' ? 'inset 0 0 0 1px rgba(139, 92, 246, 0.4)' : 'none'
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Buku Mutasi Stok Fisik</span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, SKU, atau kategori..."
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* CONTENT TAB 1: BAHAN BAKU */}
      {activeSubTab === 'RAW_MATERIALS' && (
        <div style={{
          background: 'rgba(17, 26, 36, 0.85)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
              Daftar Stok Bahan Baku & Kemasan Dapur
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Menampilkan {filteredRawMaterials.length} bahan
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px' }}>SKU</th>
                  <th style={{ padding: '12px 16px' }}>Nama Bahan Baku</th>
                  <th style={{ padding: '12px 16px' }}>Kategori</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Stok Fisik</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Harga Rata-Rata (MWA)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Nilai Total Stok</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRawMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      Belum ada data bahan baku yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRawMaterials.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace' }}>{item.sku}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f1f5f9' }}>{item.name}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{item.category}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: item.is_low_stock ? '#fb7185' : '#f8fafc' }}>
                        {item.stock} {item.unit}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8' }}>
                        {formatCurrency(item.cogs)}/{item.unit}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#38bdf8' }}>
                        {formatCurrency(item.total_inventory_value)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {item.is_low_stock ? (
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', fontWeight: 600 }}>
                            Stok Kritis
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 600 }}>
                            Tersedia
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenRestock(item.id)}
                            title="Restock Bahan Ini"
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(2, 132, 199, 0.15)',
                              border: '1px solid rgba(2, 132, 199, 0.35)',
                              color: '#38bdf8',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            + Restock
                          </button>
                          <button
                            onClick={() => handleOpenOpname(item)}
                            title="Stock Opname Fisik"
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#94a3b8',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Opname
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT TAB 2: PRODUK JADI */}
      {activeSubTab === 'FINISHED_GOODS' && (
        <div style={{
          background: 'rgba(17, 26, 36, 0.85)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
              Daftar Produk Jadi Siap Jual di Kasir POS
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Menampilkan {filteredFinishedGoods.length} produk jadi
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px' }}>SKU</th>
                  <th style={{ padding: '12px 16px' }}>Nama Produk</th>
                  <th style={{ padding: '12px 16px' }}>Kategori</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Stok Siap Jual</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>HPP Dasar</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Harga Kasir POS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Margin Kotor</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredFinishedGoods.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      Belum ada produk jadi siap jual yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredFinishedGoods.map((item) => {
                    const marginVal = item.price - item.cogs;
                    const marginPct = item.price > 0 ? (marginVal / item.price) * 100 : 0;
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace' }}>{item.sku}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f1f5f9' }}>{item.name}</td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{item.category}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: item.is_low_stock ? '#fb7185' : '#34d399' }}>
                          {item.stock} {item.unit}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8' }}>
                          {formatCurrency(item.cogs)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#f8fafc' }}>
                          {formatCurrency(item.price)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: marginPct < 20 ? '#fb7185' : '#34d399' }}>
                          {marginPct.toFixed(1)}% ({formatCurrency(marginVal)})
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenProduction(item.id)}
                              title="Produksi Batch Tambahan"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(5, 150, 105, 0.15)',
                                border: '1px solid rgba(5, 150, 105, 0.35)',
                                color: '#34d399',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              + Produksi
                            </button>
                            <button
                              onClick={() => handleOpenRecipe(item)}
                              title="Susun / Edit Resep BOM"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(6, 182, 212, 0.15)',
                                border: '1px solid rgba(6, 182, 212, 0.35)',
                                color: '#38bdf8',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Resep BOM
                            </button>
                            <button
                              onClick={() => handleOpenOpname(item)}
                              title="Stock Opname Fisik"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#94a3b8',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Opname
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT TAB 3: ALAT & PERLENGKAPAN */}
      {activeSubTab === 'EQUIPMENT' && (
        <div style={{
          background: 'rgba(17, 26, 36, 0.85)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
                Inventaris Peralatan Kerja & Aset Operasional Toko
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                Aset peralatan dicatat pada Akun SAK EMKM 1201 dan tidak berkurang saat produksi resep masakan.
              </p>
            </div>
            <button
              onClick={() => handleOpenRestock()}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Tambah / Beli Alat Baru
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px' }}>SKU</th>
                  <th style={{ padding: '12px 16px' }}>Nama Alat / Mesin</th>
                  <th style={{ padding: '12px 16px' }}>Kategori Aset</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Jumlah Unit</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Nilai Perolehan Awal</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Nilai Aset (1201)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      Belum ada aset peralatan yang terdaftar. Anda dapat menambahkan alat (misal: grinder, timbangan, wajan) via tombol Beli Alat Baru.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace' }}>{item.sku}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f1f5f9' }}>{item.name}</td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{item.category}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>
                        {item.stock} {item.unit}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8' }}>
                        {formatCurrency(item.cogs)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#f8fafc' }}>
                        {formatCurrency(item.total_inventory_value)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleOpenOpname(item)}
                          title="Audit Fisik Alat"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Audit Alat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT TAB 4: BUKU MUTASI STOK FISIK */}
      {activeSubTab === 'MOVEMENTS' && (
        <div style={{
          background: 'rgba(17, 26, 36, 0.85)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
                Buku Riwayat Mutasi Stok Fisik (Stock Movement Ledger)
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                Audit trail tak terputus: setiap mutasi (+/-) terekam otomatis beserta nomor referensi faktur, batch produksi, atau nota kasir.
              </p>
            </div>

            {/* Filter Movement Type */}
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '0.78rem',
                outline: 'none'
              }}
            >
              <option value="ALL">Semua Jenis Mutasi</option>
              <option value="RESTOCK_IN">Pembelian Masuk (+)</option>
              <option value="PRODUCTION_IN">Produksi Masuk (+)</option>
              <option value="PRODUCTION_OUT">Konsumsi Bahan Keluar (-)</option>
              <option value="POS_SALE_OUT">Penjualan Kasir (-)</option>
              <option value="STOCK_OPNAME_ADJUSTMENT">Penyesuaian Opname (±)</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 16px' }}>Waktu Mutasi</th>
                  <th style={{ padding: '12px 16px' }}>Tipe Mutasi</th>
                  <th style={{ padding: '12px 16px' }}>Nama Barang / Bahan</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Perubahan Qty</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Stok Fisik (Awal &rarr; Akhir)</th>
                  <th style={{ padding: '12px 16px' }}>No. Referensi Transaksi</th>
                  <th style={{ padding: '12px 16px' }}>Keterangan Mutasi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      Belum ada rekaman mutasi stok fisik. Seluruh transaksi restock, batch produksi, atau opname akan otomatis muncul di sini.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => {
                    const isPositive = m.quantity_delta > 0;
                    let badgeBg = 'rgba(16, 185, 129, 0.15)';
                    let badgeColor = '#34d399';
                    let label = 'Masuk (+)';

                    if (m.movement_type === 'PRODUCTION_OUT') {
                      badgeBg = 'rgba(245, 158, 11, 0.15)';
                      badgeColor = '#fbbf24';
                      label = 'Bahan Dipakai (-)';
                    } else if (m.movement_type === 'POS_SALE_OUT') {
                      badgeBg = 'rgba(59, 130, 246, 0.15)';
                      badgeColor = '#60a5fa';
                      label = 'Penjualan Kasir (-)';
                    } else if (m.movement_type === 'STOCK_OPNAME_ADJUSTMENT') {
                      badgeBg = 'rgba(139, 92, 246, 0.15)';
                      badgeColor = '#c084fc';
                      label = 'Opname Fisik (±)';
                    } else if (m.movement_type === 'RESTOCK_IN') {
                      label = 'Restock Masuk (+)';
                    } else if (m.movement_type === 'PRODUCTION_IN') {
                      label = 'Produksi Jadi (+)';
                    }

                    return (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.78rem' }}>{m.created_at}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: badgeBg, color: badgeColor, fontWeight: 600 }}>
                            {label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f1f5f9' }}>{m.product_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: isPositive ? '#34d399' : '#fb7185' }}>
                          {isPositive ? `+${m.quantity_delta}` : m.quantity_delta} {m.unit}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8' }}>
                          {m.stock_before} &rarr; <span style={{ fontWeight: 700, color: '#f8fafc' }}>{m.stock_after} {m.unit}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.76rem', color: '#38bdf8' }}>
                          {m.reference_number}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.78rem' }}>
                          {m.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: STOCK OPNAME / PENYESUAIAN STOK FISIK */}
      {isOpnameModalOpen && opnameItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ClipboardCheck size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                  Stock Opname Fisik
                </h3>
              </div>
              <button
                onClick={() => setIsOpnameModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Nama Barang</label>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {opnameItem.name} <span style={{ fontSize: '0.78rem', color: '#64748b' }}>({opnameItem.sku})</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Stok di Sistem</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                    {opnameItem.stock} {opnameItem.unit}
                  </div>
                </div>

                <div style={{ background: 'rgba(6, 182, 212, 0.06)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Stok Fisik Riil</span>
                  <input
                    type="number"
                    min={0}
                    value={opnameActualStock}
                    onChange={(e) => setOpnameActualStock(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      outline: 'none',
                      marginTop: '2px'
                    }}
                  />
                </div>
              </div>

              {/* Selisih Evaluasi */}
              {(() => {
                const diff = opnameActualStock - opnameItem.stock;
                const absDiff = Math.abs(diff);
                const diffVal = absDiff * opnameItem.cogs;
                return (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: diff < 0 ? 'rgba(244, 63, 94, 0.08)' : diff > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${diff < 0 ? 'rgba(244, 63, 94, 0.25)' : diff > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Selisih Fisik:</span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: diff < 0 ? '#fb7185' : diff > 0 ? '#34d399' : '#f8fafc' }}>
                        {diff > 0 ? `+${diff}` : diff} {opnameItem.unit} ({diff < 0 ? `Kurang Rp ${formatCurrency(diffVal)}` : diff > 0 ? `Lebih Rp ${formatCurrency(diffVal)}` : 'Sesuai'})
                      </span>
                    </div>
                    {diff < 0 && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#fb7185' }}>
                        *Selisih kurang otomatis dibukukan ke jurnal SAK EMKM: Debet Beban Kerugian Persediaan (5101) & Kredit Persediaan (1104/1105).
                      </p>
                    )}
                  </div>
                );
              })()}

              <div>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Alasan Penyesuaian</label>
                <select
                  value={opnameReason}
                  onChange={(e) => setOpnameReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '0.82rem',
                    outline: 'none',
                    marginTop: '4px'
                  }}
                >
                  <option value="Selisih Perhitungan Opname Fisik">Selisih Perhitungan Opname Fisik</option>
                  <option value="Bahan Baku Rusak / Basi / Spoilage">Bahan Baku Rusak / Basi / Spoilage</option>
                  <option value="Kemasan Pecah / Bocor Saat Penyimpanan">Kemasan Pecah / Bocor Saat Penyimpanan</option>
                  <option value="Bonus Sampel Tambahan dari Supplier">Bonus Sampel Tambahan dari Supplier</option>
                  <option value="Retur / Koreksi Kesalahan Input">Retur / Koreksi Kesalahan Input</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Catatan Petugas (Opsional)</label>
                <textarea
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  placeholder="Contoh: Ditemukan 2 botol susu basi di chiller..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '0.82rem',
                    outline: 'none',
                    marginTop: '4px',
                    resize: 'none'
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <button
                onClick={() => setIsOpnameModalOpen(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmOpname}
                disabled={isSubmittingOpname}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isSubmittingOpname ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingOpname ? 0.6 : 1
                }}
              >
                {isSubmittingOpname ? 'Menyimpan...' : 'Simpan & Selaraskan Stok'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESTOCK BAHAN BAKU & PRODUKSI BATCH */}
      <POSProductionRestockModal
        isOpen={isRestockModalOpen}
        products={allProducts}
        initialTab={restockInitialTab}
        initialProductId={restockTargetProductId}
        onClose={() => {
          setIsRestockModalOpen(false);
          setRestockTargetProductId(undefined);
        }}
        onRestockSuccess={(res) => {
          showToast('success', res.message);
          loadInventoryData();
        }}
        onProductionSuccess={(res) => {
          showToast('success', `Batch #${res.batch_number} berhasil diproduksi (+${res.quantity_produced} unit).`);
          loadInventoryData();
        }}
        onOpenRecipePricing={(prod) => {
          setIsRestockModalOpen(false);
          setRecipeProduct(prod);
          setIsRecipeModalOpen(true);
        }}
      />

      {/* MODAL 3: RESEP BOM & DYNAMIC PRICING */}
      <POSRecipePricingModal
        isOpen={isRecipeModalOpen}
        product={recipeProduct}
        availableMaterials={availableMaterialsForRecipe}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setRecipeProduct(null);
        }}
        onPriceUpdated={(updatedProduct) => {
          showToast('success', `Harga jual ${updatedProduct.name} berhasil diperbarui.`);
          loadInventoryData();
        }}
      />

      {/* TOAST NOTIFIKASI */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: toast.type === 'success' ? 'rgba(6, 78, 59, 0.95)' : 'rgba(159, 18, 57, 0.95)',
          border: `1px solid ${toast.type === 'success' ? '#10b981' : '#f43f5e'}`,
          borderRadius: '10px',
          padding: '12px 18px',
          color: '#ffffff',
          fontSize: '0.84rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
export default InventoryView;
