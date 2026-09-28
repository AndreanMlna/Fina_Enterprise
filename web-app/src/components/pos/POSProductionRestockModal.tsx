import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calculator,
  RefreshCw,
  Factory,
  Boxes,
  ShieldAlert
} from 'lucide-react';
import type { POSProduct } from '../../types';
import type {
  RestockInventoryPayload,
  RestockInventoryResponse,
  ProductionBatchPayload,
  ProductionBatchResponse,
  ProductRecipeResponse
} from '../../services/types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';

interface POSProductionRestockModalProps {
  isOpen: boolean;
  products: POSProduct[];
  onClose: () => void;
  onRestockSuccess: (res: RestockInventoryResponse) => void;
  onProductionSuccess: (res: ProductionBatchResponse) => void;
  onOpenRecipePricing: (product: POSProduct) => void;
}

export const POSProductionRestockModal: React.FC<POSProductionRestockModalProps> = ({
  isOpen,
  products,
  onClose,
  onRestockSuccess,
  onProductionSuccess,
  onOpenRecipePricing
}) => {
  const [activeTab, setActiveTab] = useState<'restock' | 'production'>('restock');

  // --- Form State: Restock Bahan Baku ---
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [materialName, setMaterialName] = useState<string>('');
  const [materialCategory, setMaterialCategory] = useState<string>('Bahan Baku');
  const [quantityAdded, setQuantityAdded] = useState<number>(10);
  const [unit, setUnit] = useState<string>('Kg');
  const [purchasePricePerUnit, setPurchasePricePerUnit] = useState<number>(15000);
  const [supplierName, setSupplierName] = useState<string>('');
  const [restockNotes, setRestockNotes] = useState<string>('');

  const [isSubmittingRestock, setIsSubmittingRestock] = useState<boolean>(false);
  const [restockResult, setRestockResult] = useState<RestockInventoryResponse | null>(null);
  const [restockError, setRestockError] = useState<string | null>(null);

  // --- Form State: Produksi Batch ---
  const [selectedFinishedProductId, setSelectedFinishedProductId] = useState<string>('');
  const [batchQuantity, setBatchQuantity] = useState<number>(25);
  const [batchOverheadCost, setBatchOverheadCost] = useState<number>(15000);
  const [batchNotes, setBatchNotes] = useState<string>('');

  const [isLoadingRecipe, setIsLoadingRecipe] = useState<boolean>(false);
  const [recipeData, setRecipeData] = useState<ProductRecipeResponse | null>(null);
  const [isSubmittingProduction, setIsSubmittingProduction] = useState<boolean>(false);
  const [productionResult, setProductionResult] = useState<ProductionBatchResponse | null>(null);
  const [productionError, setProductionError] = useState<string | null>(null);

  // Reset form bila modal dibuka
  useEffect(() => {
    if (isOpen) {
      setRestockResult(null);
      setRestockError(null);
      setProductionResult(null);
      setProductionError(null);
      if (products.length > 0) {
        // Otomatis pilih bahan pertama jika ada
        const firstMat = products.find(p => p.category?.toLowerCase().includes('bahan') || p.category?.toLowerCase().includes('raw')) || products[0];
        if (firstMat) {
          setSelectedMaterialId(firstMat.id);
          setMaterialName(firstMat.name);
          setUnit(firstMat.unit || 'Kg');
          setMaterialCategory(firstMat.category || 'Bahan Baku');
        }

        // Otomatis pilih produk jadi pertama
        const firstProd = products.find(p => !p.category?.toLowerCase().includes('bahan')) || products[0];
        if (firstProd) {
          setSelectedFinishedProductId(firstProd.id);
        }
      }
    }
  }, [isOpen, products]);

  // Efek bila material ID dipilih pada form restock
  useEffect(() => {
    if (selectedMaterialId && selectedMaterialId !== '__NEW__') {
      const selected = products.find(p => p.id === selectedMaterialId);
      if (selected) {
        setMaterialName(selected.name);
        setUnit(selected.unit || 'Kg');
        setMaterialCategory(selected.category || 'Bahan Baku');
        if (selected.cogs && selected.cogs > 0) {
          setPurchasePricePerUnit(selected.cogs);
        }
      }
    } else if (selectedMaterialId === '__NEW__') {
      setMaterialName('');
      setMaterialCategory('Bahan Baku');
      setUnit('Kg');
      setPurchasePricePerUnit(10000);
    }
  }, [selectedMaterialId, products]);

  // Efek memuat resep ketika produk jadi dipilih pada form produksi
  useEffect(() => {
    if (selectedFinishedProductId) {
      loadRecipeForProduction(selectedFinishedProductId);
    } else {
      setRecipeData(null);
    }
  }, [selectedFinishedProductId]);

  const loadRecipeForProduction = async (productId: string) => {
    setIsLoadingRecipe(true);
    try {
      const res = await api.getProductRecipe(productId);
      setRecipeData(res);
    } catch (err: any) {
      console.warn('[POSProductionRestockModal] Resep belum ada untuk produk ini:', err);
      setRecipeData(null);
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  // Objek material terpilih
  const currentMaterialProduct = useMemo(() => {
    return products.find(p => p.id === selectedMaterialId);
  }, [products, selectedMaterialId]);

  // Simulasi Moving Weighted Average Cost sebelum submit
  const movingAveragePreview = useMemo(() => {
    const oldStock = currentMaterialProduct ? currentMaterialProduct.stock : 0;
    const oldCogs = currentMaterialProduct ? currentMaterialProduct.cogs : 0;
    const newQty = Number(quantityAdded) || 0;
    const newPrice = Number(purchasePricePerUnit) || 0;

    const totalStock = oldStock + newQty;
    if (totalStock <= 0) return { totalStock: 0, newCogs: newPrice, oldStock, oldCogs };

    const weightedCost = (oldStock * oldCogs + newQty * newPrice) / totalStock;
    return {
      oldStock,
      oldCogs,
      totalStock,
      newCogs: Math.round(weightedCost)
    };
  }, [currentMaterialProduct, quantityAdded, purchasePricePerUnit]);

  // Analisis Kecukupan Bahan Baku untuk Produksi Batch
  const productionMaterialFeasibility = useMemo(() => {
    if (!recipeData || !Array.isArray(recipeData.items) || recipeData.items.length === 0) {
      return { hasRecipe: false, items: [], allSufficient: false, totalMaterialCost: 0, estimatedBatchHppPerUnit: 0 };
    }

    let allSufficient = true;
    let totalMaterialCost = 0;

    const items = recipeData.items.map(item => {
      const requiredTotal = Number((item.quantity_required * batchQuantity).toFixed(4));
      // Cari produk bahan baku di katalog untuk cek stok fisik saat ini
      const matchedProd = item.material_id ? products.find(p => p.id === item.material_id) : products.find(p => p.name.toLowerCase() === item.material_name.toLowerCase());
      const availableStock = matchedProd ? matchedProd.stock : 999;
      const isSufficient = availableStock >= requiredTotal;
      if (!isSufficient) allSufficient = false;

      const subtotal = requiredTotal * item.cost_per_unit;
      totalMaterialCost += subtotal;

      return {
        ...item,
        requiredTotal,
        availableStock,
        isSufficient,
        subtotal
      };
    });

    const wastageMultiplier = 1 / (1 - ((recipeData.wastage_percent || 0) / 100));
    const adjustedMaterialCost = totalMaterialCost * wastageMultiplier;
    const totalBatchCost = adjustedMaterialCost + (Number(batchOverheadCost) || 0);
    const estimatedBatchHppPerUnit = batchQuantity > 0 ? Math.round(totalBatchCost / batchQuantity) : 0;

    return {
      hasRecipe: true,
      items,
      allSufficient,
      totalMaterialCost: Math.round(totalBatchCost),
      estimatedBatchHppPerUnit
    };
  }, [recipeData, batchQuantity, batchOverheadCost, products]);

  // Handler Submit Restock Bahan Baku
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim()) {
      setRestockError('Nama bahan baku wajib diisi.');
      return;
    }
    if (quantityAdded <= 0 || purchasePricePerUnit <= 0) {
      setRestockError('Kuantitas restock dan harga beli faktur harus bernilai lebih dari 0.');
      return;
    }

    setIsSubmittingRestock(true);
    setRestockError(null);

    const payload: RestockInventoryPayload = {
      product_id: selectedMaterialId && selectedMaterialId !== '__NEW__' ? selectedMaterialId : undefined,
      material_name: materialName.trim(),
      category: materialCategory.trim() || 'Bahan Baku',
      quantity_added: Number(quantityAdded),
      unit: unit.trim() || 'Kg',
      purchase_price_per_unit: Number(purchasePricePerUnit),
      supplier_name: supplierName.trim() || undefined,
      notes: restockNotes.trim() || undefined
    };

    try {
      const res = await api.restockInventory(payload);
      setRestockResult(res);
      onRestockSuccess(res);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Gagal memproses restock bahan baku.';
      setRestockError(msg);
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Handler Submit Produksi Batch
  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinishedProductId) {
      setProductionError('Pilih produk jadi yang akan diproduksi.');
      return;
    }
    if (batchQuantity <= 0) {
      setProductionError('Jumlah kuantitas batch harus bernilai lebih dari 0 unit.');
      return;
    }

    setIsSubmittingProduction(true);
    setProductionError(null);

    const payload: ProductionBatchPayload = {
      product_id: selectedFinishedProductId,
      quantity_produced: Number(batchQuantity),
      overhead_cost: Number(batchOverheadCost) || 0,
      notes: batchNotes.trim() || undefined
    };

    try {
      const res = await api.recordProductionBatch(payload);
      setProductionResult(res);
      onProductionSuccess(res);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Gagal memproses batch produksi.';
      setProductionError(msg);
    } finally {
      setIsSubmittingProduction(false);
    }
  };

  if (!isOpen) return null;

  const finishedProductSelected = products.find(p => p.id === selectedFinishedProductId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.98) 100%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mint-neon)'
              }}
            >
              <Factory size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Siklus Restock & Produksi AI
                </h2>
                <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                  Dynamic Pricing Engine
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Evaluasi HPP dinamis di setiap recycle stock & batch produksi agar harga jual selalu relevan dan anti-rugi.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.5)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('restock')}
            className={`homies-pill-btn ${activeTab === 'restock' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px' }}
          >
            <Boxes size={15} />
            <span>1. Restock Bahan Baku (Recycle Stock)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('production')}
            className={`homies-pill-btn ${activeTab === 'production' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px' }}
          >
            <Factory size={15} />
            <span>2. Produksi Batch Produk Jadi</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* =========================================================================
              TAB 1: RESTOCK BAHAN BAKU (RECYCLE STOCK & CASCADE ALERT)
              ========================================================================= */}
          {activeTab === 'restock' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {restockError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <AlertTriangle size={18} />
                  <span>{restockError}</span>
                </div>
              )}

              {/* Form Restock */}
              <form onSubmit={handleRestockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  
                  {/* Pilih Bahan atau Tambah Baru */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Pilih Bahan Baku Terdaftar
                    </label>
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      className="homies-select"
                      style={{ width: '100%', padding: '10px 12px' }}
                    >
                      <option value="__NEW__">+ Input Bahan Baku Baru</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stock} {p.unit || 'Pcs'} - HPP: {formatCurrency(p.cogs)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nama Bahan Baku */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Nama Bahan Baku / Material
                    </label>
                    <input
                      type="text"
                      value={materialName}
                      onChange={(e) => setMaterialName(e.target.value)}
                      placeholder="Misal: Daging Ayam Fillet, Kopi Arabika..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Kategori Bahan
                    </label>
                    <input
                      type="text"
                      value={materialCategory}
                      onChange={(e) => setMaterialCategory(e.target.value)}
                      placeholder="Bahan Baku, Kemasan, Bumbu..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  {/* Satuan Unit */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Satuan Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="homies-select"
                      style={{ width: '100%', padding: '10px 12px' }}
                    >
                      <option value="Kg">Kg (Kilogram)</option>
                      <option value="Gram">Gram</option>
                      <option value="Liter">Liter</option>
                      <option value="Ml">Ml (Mililiter)</option>
                      <option value="Pcs">Pcs (Satuan/Butir)</option>
                      <option value="Lembar">Lembar</option>
                      <option value="Pack">Pack</option>
                      <option value="Dus">Dus / Box</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {/* Kuantitas Tambahan Masuk */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Kuantitas Dibeli / Masuk
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={quantityAdded}
                      onChange={(e) => setQuantityAdded(parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  {/* Harga Beli Faktur per Satuan */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Harga Beli Faktur per {unit} (Rp)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={purchasePricePerUnit}
                      onChange={(e) => setPurchasePricePerUnit(parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  {/* Nama Supplier (Opsional) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Nama Pemasok / Toko
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="Pasar Induk, CV Sumber Pangan..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  {/* Catatan Restock (Opsional) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Catatan Pembelian / Restock
                    </label>
                    <input
                      type="text"
                      value={restockNotes}
                      onChange={(e) => setRestockNotes(e.target.value)}
                      placeholder="No faktur, batch kedatangan..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>
                </div>

                {/* Live Simulation Card: Moving Weighted Average */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calculator size={16} color="var(--cyan-400)" />
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                        Simulasi Moving Weighted Average Cost (SAK EMKM)
                      </span>
                    </div>
                    <span className="mono" style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      C_new = (S_old·C_old + Q_new·C_new) / (S_old + Q_new)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Kondisi Stok Lama</div>
                      <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                        {movingAveragePreview.oldStock} {unit} @ {formatCurrency(movingAveragePreview.oldCogs)}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Restock Masuk</div>
                      <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--cyan-400)', marginTop: '2px' }}>
                        +{quantityAdded} {unit} @ {formatCurrency(purchasePricePerUnit)}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--emerald-400)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--emerald-400)', fontWeight: 600 }}>Stok & HPP Rata-rata Baru</div>
                      <div className="mono" style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {movingAveragePreview.totalStock} {unit} • {formatCurrency(movingAveragePreview.newCogs)}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={isSubmittingRestock}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    {isSubmittingRestock ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Menyimpan & Menghitung Imbas BOM...</span>
                      </>
                    ) : (
                      <>
                        <Boxes size={16} />
                        <span>Simpan Restock & Evaluasi Imbas BOM</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Hasil Restock & Peringatan Cascade */}
              {restockResult && (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={20} color="var(--mint-neon)" />
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#ffffff' }}>
                        {restockResult.message}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        Stok bahan telah terakumulasi menjadi {restockResult.material.new_total_stock} {restockResult.material.unit} dengan biaya rata-rata {formatCurrency(restockResult.material.new_weighted_cogs)} per unit.
                      </div>
                    </div>
                  </div>

                  {/* Cascade Alert jika produk jadi terimbas */}
                  {restockResult.affected_products_count > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: '#f59e0b' }}>
                        <ShieldAlert size={16} />
                        <span>
                          Deteksi Dampak Cascade: {restockResult.affected_products_count} Produk Jadi Menggunakan Bahan Ini!
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {restockResult.affected_finished_products.map((aff) => {
                          const matchedProduct = products.find(p => p.id === aff.product_id);
                          return (
                            <div
                              key={aff.product_id}
                              style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                background: aff.is_at_loss ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                                border: aff.is_at_loss ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '10px'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.88rem' }}>
                                    {aff.product_name}
                                  </span>
                                  <span className={`badge ${aff.is_at_loss ? 'badge-rose' : 'badge-amber'}`} style={{ fontSize: '0.68rem' }}>
                                    {aff.margin_label}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                                  HPP Lama: {formatCurrency(aff.old_cogs)} ➔ HPP Baru: <strong style={{ color: aff.cogs_increased ? '#f87171' : '#34d399' }}>{formatCurrency(aff.new_cogs)}</strong> • Harga Jual: {formatCurrency(aff.current_price)}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '4px' }}>
                                  💡 {aff.ai_warning}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>Rekomendasi AI:</div>
                                  <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--mint-neon)' }}>
                                    {formatCurrency(aff.recommended_price)}
                                  </div>
                                </div>

                                {matchedProduct && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenRecipePricing(matchedProduct)}
                                    className="btn btn-sm btn-outline"
                                    style={{ borderColor: 'rgba(168, 85, 247, 0.5)', color: '#c084fc', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <Sparkles size={13} />
                                    <span>Sesuaikan Harga</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: PRODUKSI BATCH PRODUK JADI (BOM DEDUCTION & REAL HPP)
              ========================================================================= */}
          {activeTab === 'production' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {productionError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <AlertTriangle size={18} />
                  <span>{productionError}</span>
                </div>
              )}

              <form onSubmit={handleProductionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {/* Pilih Produk Jadi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Pilih Produk Jadi yang Diproduksi
                    </label>
                    <select
                      value={selectedFinishedProductId}
                      onChange={(e) => setSelectedFinishedProductId(e.target.value)}
                      className="homies-select"
                      style={{ width: '100%', padding: '10px 12px' }}
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok Saat Ini: {p.stock} {p.unit || 'Pcs'} - Harga: {formatCurrency(p.price)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kuantitas Batch yang Diproduksi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Kuantitas Batch Dihasilkan (Pcs)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={batchQuantity}
                      onChange={(e) => setBatchQuantity(parseInt(e.target.value, 10) || 1)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  {/* Overhead Langsung Batch */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Biaya Overhead Langsung Batch (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={batchOverheadCost}
                      onChange={(e) => setBatchOverheadCost(parseFloat(e.target.value) || 0)}
                      placeholder="Gas, listrik, tenaga harian..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>
                </div>

                {/* Catatan Batch */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    Catatan Batch Produksi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    placeholder="Batch pagi jam 07:00, resep reguler..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                {/* BOM Checklist Card */}
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: '12px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={16} color="var(--mint-neon)" />
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                        Daftar Kebutuhan Bahan Baku (Bill of Materials) untuk {batchQuantity} Pcs
                      </span>
                    </div>

                    {finishedProductSelected && (
                      <button
                        type="button"
                        onClick={() => onOpenRecipePricing(finishedProductSelected)}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '0.72rem', padding: '4px 8px', color: 'var(--cyan-400)' }}
                      >
                        Edit Resep BOM
                      </button>
                    )}
                  </div>

                  {isLoadingRecipe ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.82rem' }}>
                      <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                      Memuat komposisi resep produk...
                    </div>
                  ) : !productionMaterialFeasibility.hasRecipe ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#f59e0b', fontSize: '0.82rem' }}>
                      <AlertTriangle size={18} style={{ margin: '0 auto 6px auto' }} />
                      Produk ini belum memiliki resep bahan baku (BOM) tersimpan. Klik tombol "Edit Resep BOM" di atas untuk menyusun takaran bahan.
                    </div>
                  ) : (
                    <>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                              <th style={{ padding: '8px 4px' }}>Bahan Baku</th>
                              <th style={{ padding: '8px 4px' }}>Takaran / Pcs</th>
                              <th style={{ padding: '8px 4px' }}>Dibutuhkan ({batchQuantity}x)</th>
                              <th style={{ padding: '8px 4px' }}>Stok Fisik Tersedia</th>
                              <th style={{ padding: '8px 4px' }}>Subtotal Biaya</th>
                              <th style={{ padding: '8px 4px' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productionMaterialFeasibility.items.map((it, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '8px 4px', fontWeight: 600, color: '#ffffff' }}>{it.material_name}</td>
                                <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>{it.quantity_required} {it.unit}</td>
                                <td style={{ padding: '8px 4px', fontWeight: 700, color: 'var(--cyan-400)' }}>{it.requiredTotal} {it.unit}</td>
                                <td style={{ padding: '8px 4px', color: it.isSufficient ? 'var(--mint-neon)' : '#f87171' }}>
                                  {it.availableStock} {it.unit}
                                </td>
                                <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>{formatCurrency(it.subtotal)}</td>
                                <td style={{ padding: '8px 4px' }}>
                                  {it.isSufficient ? (
                                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Cukup</span>
                                  ) : (
                                    <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>Stok Kurang!</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Estimasi HPP Batch Card */}
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '4px'
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          Estimasi Biaya Produksi Batch ({batchQuantity} Pcs): <strong>{formatCurrency(productionMaterialFeasibility.totalMaterialCost)}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Estimasi HPP / Pcs:</span>
                          <span className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--mint-neon)' }}>
                            {formatCurrency(productionMaterialFeasibility.estimatedBatchHppPerUnit)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={isSubmittingProduction || !productionMaterialFeasibility.hasRecipe || !productionMaterialFeasibility.allSufficient}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: (!productionMaterialFeasibility.hasRecipe || !productionMaterialFeasibility.allSufficient) ? 0.5 : 1
                    }}
                  >
                    {isSubmittingProduction ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Mengeksekusi Batch & Mengurangi Stok Bahan...</span>
                      </>
                    ) : (
                      <>
                        <Factory size={16} />
                        <span>Eksekusi Produksi Batch & Evaluasi HPP</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Hasil Eksekusi Batch Produksi */}
              {productionResult && (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: productionResult.is_at_loss ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                    border: productionResult.is_at_loss ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={22} color={productionResult.is_at_loss ? '#f87171' : 'var(--mint-neon)'} />
                      <div>
                        <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff' }}>
                          Batch #{productionResult.batch_number} Berhasil Diproduksi!
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                          +{productionResult.quantity_produced} unit ditambahkan ke katalog kasir. Stok baru: {productionResult.new_finished_stock} unit.
                        </div>
                      </div>
                    </div>

                    <span className={`badge ${productionResult.is_at_loss ? 'badge-rose' : 'badge-emerald'}`} style={{ fontSize: '0.74rem' }}>
                      {productionResult.margin_label}
                    </span>
                  </div>

                  {/* Perbandingan HPP vs Harga Jual */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>HPP Riil Batch per Pcs</div>
                      <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {formatCurrency(productionResult.unit_cost_hpp)}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Harga Jual Kasir Saat Ini</div>
                      <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: productionResult.is_at_loss ? '#f87171' : 'var(--mint-neon)', marginTop: '2px' }}>
                        {formatCurrency(productionResult.current_selling_price)}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--cyan-400)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--cyan-400)', fontWeight: 600 }}>Rekomendasi Harga AI Anti-Rugi</div>
                      <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {formatCurrency(productionResult.recommended_price ?? 0)}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Cepat Buka AI Pricing */}
                  {finishedProductSelected && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => onOpenRecipePricing(finishedProductSelected)}
                        className="btn btn-sm btn-outline"
                        style={{ borderColor: 'rgba(168, 85, 247, 0.5)', color: '#c084fc', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Sparkles size={14} />
                        <span>Buka AI Pricing Engine untuk Produk Ini</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
