import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Factory,
  Boxes
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
import { POSRestockTab } from './restock/POSRestockTab';
import { POSProductionBatchTab } from './restock/POSProductionBatchTab';

export const isRawMaterialOrEquipment = (category?: string, name?: string): boolean => {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  const patterns = [
    'bahan', 'raw', 'material', 'kemasan', 'packaging',
    'alat', 'mesin', 'equipment', 'operasional', 'aset', 'peralatan'
  ];
  return patterns.some(p => cat.includes(p) || n.includes(p));
};

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

  // --- Form State: Restock Bahan Baku & Alat ---
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [materialName, setMaterialName] = useState<string>('');
  const [materialCategory, setMaterialCategory] = useState<string>('Bahan Baku');
  const [quantityAdded, setQuantityAdded] = useState<number | string>(10);
  const [unit, setUnit] = useState<string>('Kg');
  const [purchasePricePerUnit, setPurchasePricePerUnit] = useState<number | ''>(15000);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [supplierName, setSupplierName] = useState<string>('');
  const [restockNotes, setRestockNotes] = useState<string>('');

  const [isSubmittingRestock, setIsSubmittingRestock] = useState<boolean>(false);
  const [restockResult, setRestockResult] = useState<RestockInventoryResponse | null>(null);
  const [restockError, setRestockError] = useState<string | null>(null);

  // --- Form State: Produksi Batch ---
  const [selectedFinishedProductId, setSelectedFinishedProductId] = useState<string>('');
  const [batchQuantity, setBatchQuantity] = useState<number | ''>(25);
  const [batchOverheadCost, setBatchOverheadCost] = useState<number | ''>(15000);
  const [batchNotes, setBatchNotes] = useState<string>('');

  const [isLoadingRecipe, setIsLoadingRecipe] = useState<boolean>(false);
  const [recipeData, setRecipeData] = useState<ProductRecipeResponse | null>(null);
  const [isSubmittingProduction, setIsSubmittingProduction] = useState<boolean>(false);
  const [productionResult, setProductionResult] = useState<ProductionBatchResponse | null>(null);
  const [productionError, setProductionError] = useState<string | null>(null);

  // --- State Bahan Baku Mentah & Alat Kerja Terpisah ---
  const [inventoryMaterials, setInventoryMaterials] = useState<POSProduct[]>([]);

  // Memuat daftar bahan baku & alat kerja khusus dari database
  const loadMaterials = async () => {
    try {
      const mats = await api.getInventoryMaterials();
      if (Array.isArray(mats)) {
        setInventoryMaterials(mats);
      }
    } catch (e) {
      console.warn('[POSProductionRestockModal] Gagal memuat bahan baku:', e);
    }
  };

  // Bahan Baku & Alat (Tab 1)
  const displayMaterials = useMemo(() => {
    if (inventoryMaterials.length > 0) return inventoryMaterials;
    return products.filter(p => isRawMaterialOrEquipment(p.category, p.name));
  }, [inventoryMaterials, products]);

  // Produk Jadi Siap Jual (Tab 2)
  const finishedGoods = useMemo(() => {
    const list = products.filter(p => !isRawMaterialOrEquipment(p.category, p.name));
    return list.length > 0 ? list : products;
  }, [products]);

  // Gabungan semua katalog untuk pencocokan BOM
  const allMaterialCatalog = useMemo(() => {
    const map = new Map<string, POSProduct>();
    products.forEach(p => map.set(p.id, p));
    inventoryMaterials.forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [products, inventoryMaterials]);

  // Reset form bila modal dibuka
  useEffect(() => {
    if (isOpen) {
      setRestockResult(null);
      setRestockError(null);
      setProductionResult(null);
      setProductionError(null);
      loadMaterials();
    }
  }, [isOpen]);

  // Set default material saat displayMaterials tersedia
  useEffect(() => {
    if (displayMaterials.length > 0) {
      if (!selectedMaterialId || !displayMaterials.some(m => m.id === selectedMaterialId)) {
        const first = displayMaterials[0];
        setSelectedMaterialId(first.id);
        setMaterialName(first.name);
        setUnit(first.unit || 'Kg');
        setMaterialCategory(first.category || 'Bahan Baku');
        if (first.cogs && first.cogs > 0) {
          setPurchasePricePerUnit(first.cogs);
        } else {
          setPurchasePricePerUnit('');
        }
      }
    }
  }, [displayMaterials]);

  // Set default finished product saat finishedGoods tersedia
  useEffect(() => {
    if (finishedGoods.length > 0) {
      if (!selectedFinishedProductId || !finishedGoods.some(g => g.id === selectedFinishedProductId)) {
        setSelectedFinishedProductId(finishedGoods[0].id);
      }
    }
  }, [finishedGoods]);

  // Efek bila material ID dipilih pada form restock
  useEffect(() => {
    if (selectedMaterialId && selectedMaterialId !== '__NEW__') {
      const selected = displayMaterials.find(p => p.id === selectedMaterialId) || allMaterialCatalog.find(p => p.id === selectedMaterialId);
      if (selected) {
        setMaterialName(selected.name);
        setUnit(selected.unit || 'Kg');
        setMaterialCategory(selected.category || 'Bahan Baku');
        if (selected.cogs && selected.cogs > 0) {
          setPurchasePricePerUnit(selected.cogs);
        } else {
          setPurchasePricePerUnit('');
        }
      }
    } else if (selectedMaterialId === '__NEW__') {
      setMaterialName('');
      setMaterialCategory('Bahan Baku');
      setUnit('Kg');
      setPurchasePricePerUnit('');
    }
  }, [selectedMaterialId, displayMaterials, allMaterialCatalog]);

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
    return displayMaterials.find(p => p.id === selectedMaterialId) || allMaterialCatalog.find(p => p.id === selectedMaterialId);
  }, [displayMaterials, allMaterialCatalog, selectedMaterialId]);

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

    const numBatchQty = Number(batchQuantity) || 0;
    const items = recipeData.items.map(item => {
      const requiredTotal = Number((item.quantity_required * numBatchQty).toFixed(4));
      // Cari produk bahan baku di katalog untuk cek stok fisik saat ini
      const matchedProd = item.material_id ? allMaterialCatalog.find(p => p.id === item.material_id) : allMaterialCatalog.find(p => p.name.toLowerCase() === item.material_name.toLowerCase());
      const availableStock = matchedProd ? matchedProd.stock : 0;
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
    const estimatedBatchHppPerUnit = numBatchQty > 0 ? Math.round(totalBatchCost / numBatchQty) : 0;

    return {
      hasRecipe: true,
      items,
      allSufficient,
      totalMaterialCost: Math.round(totalBatchCost),
      estimatedBatchHppPerUnit
    };
  }, [recipeData, batchQuantity, batchOverheadCost, allMaterialCatalog]);

  // Handler Submit Restock Bahan Baku
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim()) {
      setRestockError('Nama bahan baku wajib diisi.');
      return;
    }
    const numQty = Number(quantityAdded) || 0;
    const numPrice = Number(purchasePricePerUnit) || 0;
    if (numQty <= 0 || numPrice <= 0) {
      setRestockError('Kuantitas restock dan harga beli faktur harus bernilai lebih dari 0.');
      return;
    }

    setIsSubmittingRestock(true);
    setRestockError(null);

    const payload: RestockInventoryPayload = {
      product_id: selectedMaterialId && selectedMaterialId !== '__NEW__' ? selectedMaterialId : undefined,
      material_name: materialName.trim(),
      category: materialCategory.trim() || 'Bahan Baku',
      quantity_added: numQty,
      unit: unit.trim() || 'Kg',
      purchase_price_per_unit: numPrice,
      payment_method: paymentMethod,
      supplier_name: supplierName.trim() || undefined,
      notes: restockNotes.trim() || undefined
    };

    try {
      const res = await api.restockInventory(payload);
      setRestockResult(res);
      await loadMaterials();
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
    const numBatchQty = Number(batchQuantity) || 0;
    if (numBatchQty <= 0) {
      setProductionError('Jumlah kuantitas batch harus bernilai lebih dari 0 unit.');
      return;
    }

    setIsSubmittingProduction(true);
    setProductionError(null);

    const payload: ProductionBatchPayload = {
      product_id: selectedFinishedProductId,
      quantity_produced: numBatchQty,
      overhead_cost: Number(batchOverheadCost) || 0,
      payment_method: paymentMethod,
      notes: batchNotes.trim() || undefined
    };

    try {
      const res = await api.recordProductionBatch(payload);
      setProductionResult(res);
      await loadMaterials();
      onProductionSuccess(res);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Gagal memproses batch produksi.';
      setProductionError(msg);
    } finally {
      setIsSubmittingProduction(false);
    }
  };

  if (!isOpen) return null;

  const finishedProductSelected = finishedGoods.find(p => p.id === selectedFinishedProductId) || products.find(p => p.id === selectedFinishedProductId);

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
          {activeTab === 'restock' ? (
            <POSRestockTab
              products={displayMaterials}
              selectedMaterialId={selectedMaterialId}
              setSelectedMaterialId={setSelectedMaterialId}
              materialName={materialName}
              setMaterialName={setMaterialName}
              materialCategory={materialCategory}
              setMaterialCategory={setMaterialCategory}
              quantityAdded={quantityAdded}
              setQuantityAdded={setQuantityAdded}
              unit={unit}
              setUnit={setUnit}
              purchasePricePerUnit={purchasePricePerUnit}
              setPurchasePricePerUnit={setPurchasePricePerUnit}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              supplierName={supplierName}
              setSupplierName={setSupplierName}
              restockNotes={restockNotes}
              setRestockNotes={setRestockNotes}
              isSubmittingRestock={isSubmittingRestock}
              restockResult={restockResult}
              restockError={restockError}
              movingAveragePreview={movingAveragePreview}
              onSubmit={handleRestockSubmit}
              onOpenRecipePricing={onOpenRecipePricing}
            />
          ) : (
            <POSProductionBatchTab
              products={finishedGoods}
              selectedFinishedProductId={selectedFinishedProductId}
              setSelectedFinishedProductId={setSelectedFinishedProductId}
              batchQuantity={batchQuantity}
              setBatchQuantity={setBatchQuantity}
              batchOverheadCost={batchOverheadCost}
              setBatchOverheadCost={setBatchOverheadCost}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              batchNotes={batchNotes}
              setBatchNotes={setBatchNotes}
              isLoadingRecipe={isLoadingRecipe}
              productionMaterialFeasibility={productionMaterialFeasibility}
              isSubmittingProduction={isSubmittingProduction}
              productionResult={productionResult}
              productionError={productionError}
              finishedProductSelected={finishedProductSelected}
              onSubmit={handleProductionSubmit}
              onOpenRecipePricing={onOpenRecipePricing}
            />
          )}
        </div>
      </div>
    </div>
  );
};
