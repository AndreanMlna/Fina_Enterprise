import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  RefreshCw,
  Layers
} from 'lucide-react';
import type { POSProduct } from '../../types';
import type {
  RecipeItem,
  DynamicPricingAnalysis
} from '../../services/types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';
import { POSRecipeTable } from './recipe/POSRecipeTable';
import { POSRecipeOverheadControl } from './recipe/POSRecipeOverheadControl';
import { POSRecipePricingTiers } from './recipe/POSRecipePricingTiers';
import { POSRecipeAIInsights } from './recipe/POSRecipeAIInsights';

interface POSRecipePricingModalProps {
  isOpen: boolean;
  product: POSProduct | null;
  availableMaterials?: POSProduct[];
  openedFromProduction?: boolean;
  onReturnToProduction?: () => void;
  onClose: () => void;
  onPriceUpdated: (updatedProduct: POSProduct) => void;
}

// Kalkulasi harga deterministik lokal bila server AI offline atau produk baru
function generateLocalPricingAnalysis(
  product: POSProduct,
  items: RecipeItem[],
  overheadCost: number,
  wastagePercent: number,
  targetMargin: number
): DynamicPricingAnalysis {
  const rawMaterialCost = items.reduce(
    (sum, it) => sum + (Number(it.quantity_required) || 0) * (Number(it.cost_per_unit) || 0),
    0
  );
  const safeWastage = Math.max(0, Math.min(30, wastagePercent || 0));
  const wastageMultiplier = safeWastage < 90 ? 1 / (1 - safeWastage / 100) : 1;
  const wastageCost = (rawMaterialCost * wastageMultiplier) - rawMaterialCost;
  const totalHpp = (rawMaterialCost * wastageMultiplier) + (Number(overheadCost) || 0);

  const curPrice = Number(product.price) || 0;
  const taxRate = 0.005; // PPh Final PP 55/2022 0.5%
  const safeMargin = Math.max(15, Math.min(80, targetMargin || 35)) / 100;

  const bepPrice = totalHpp > 0 ? Math.ceil(totalHpp / (1 - taxRate) / 500) * 500 : curPrice;
  const floorPrice = totalHpp > 0 ? Math.ceil(totalHpp / (1 - 0.20 - taxRate) / 500) * 500 : curPrice;
  const recommendedPrice = totalHpp > 0 ? Math.ceil(totalHpp / (1 - safeMargin - taxRate) / 500) * 500 : curPrice;
  const premiumPrice = totalHpp > 0 ? Math.ceil(totalHpp / (1 - 0.55 - taxRate) / 500) * 500 : curPrice;

  const currentMargin = curPrice > 0 ? ((curPrice - totalHpp) / curPrice) * 100 : 0;
  const isAtLoss = curPrice < floorPrice;

  let marginStatus: 'CRITICAL_LOSS' | 'MARGIN_LEAKAGE' | 'HEALTHY' | 'UNPRICED' = 'HEALTHY';
  let marginLabel = 'SEHAT: Margin Berkelanjutan';

  if (curPrice <= 0) {
    marginStatus = 'UNPRICED';
    marginLabel = 'Harga Belum Ditentukan';
  } else if (curPrice < bepPrice) {
    marginStatus = 'CRITICAL_LOSS';
    marginLabel = 'BAHAYA: RUGI OPERASIONAL!';
  } else if (curPrice < floorPrice) {
    marginStatus = 'MARGIN_LEAKAGE';
    marginLabel = 'WASPADA: Margin Terlalu Tipis (< 20%)';
  }

  return {
    product_id: product.id,
    product_name: product.name,
    sku: product.sku,
    category: product.category,
    current_selling_price: curPrice,
    raw_material_cost: rawMaterialCost,
    wastage_percent: safeWastage,
    wastage_cost: Math.round(wastageCost),
    overhead_cost_per_unit: overheadCost,
    total_unit_cost_hpp: Math.round(totalHpp),
    pricing_tiers: {
      bep_break_even: {
        price: bepPrice,
        margin_percent: 0.5,
        description: 'Titik impas modal bahan + overhead + pajak PP55 (Toleransi Nol Margin)'
      },
      safe_floor_minimum: {
        price: floorPrice,
        margin_percent: 20.0,
        description: 'Batas bawah aman grosir / reseller anti-rugi (Margin Minimal 20%)'
      },
      optimal_recommended: {
        price: recommendedPrice,
        margin_percent: Math.round(safeMargin * 100),
        description: `Rekomendasi AI harga sehat berkelanjutan (Margin ${Math.round(safeMargin * 100)}%)`
      },
      premium_retail: {
        price: premiumPrice,
        margin_percent: 55.0,
        description: 'Harga ritel premium saluran khusus (Margin 55%)'
      }
    },
    current_margin_percent: Number(currentMargin.toFixed(1)),
    margin_status: marginStatus,
    margin_label: marginLabel,
    is_at_loss: isAtLoss,
    detailed_materials_breakdown: items.map(it => ({
      material_name: it.material_name || 'Bahan',
      quantity: Number(it.quantity_required) || 0,
      unit: it.unit || 'Pcs',
      cost_per_unit: Number(it.cost_per_unit) || 0,
      subtotal_cost: (Number(it.quantity_required) || 0) * (Number(it.cost_per_unit) || 0),
      cost_share_percent: rawMaterialCost > 0 
        ? Math.round(((Number(it.quantity_required) || 0) * (Number(it.cost_per_unit) || 0) / rawMaterialCost) * 100) 
        : 0
    })),
    ai_insights: {
      ai_executive_summary: isAtLoss 
        ? `WASPADA: Margin produk ${product.name} saat ini (${currentMargin.toFixed(1)}%) berada di bawah ambang batas aman 20%.`
        : `Kondisi harga sehat dengan estimasi margin kotor ${currentMargin.toFixed(1)}% terhadap HPP riil Rp ${Math.round(totalHpp).toLocaleString('id-ID')}.`,
      ai_financial_rationale: `Total HPP riil per pcs adalah Rp ${Math.round(totalHpp).toLocaleString('id-ID')}. Disarankan menggunakan harga rekomendasi Rp ${recommendedPrice.toLocaleString('id-ID')} untuk memastikan cashflow aman sesuai SAK EMKM.`,
      cost_driver_analysis: items[0] ? `Komponen bahan '${items[0].material_name}' menjadi faktor biaya utama.` : 'Komponen bahan dasar produk.',
      strategic_actions: [
        `Sesuaikan harga jual ke Rp ${recommendedPrice.toLocaleString('id-ID')} untuk mengamankan margin ${Math.round(safeMargin * 100)}%.`,
        'Lakukan evaluasi pembelian bahan baku saat restock berikutnya.',
        'Pantau tingkat susut bahan agar HPP tetap stabil.'
      ],
      inflation_resilience_tip: 'Perbarui HPP secara berkala jika terjadi kenaikan harga bahan baku di atas 10%.'
    },
    engine: 'FINA-Deterministic-Pricing-Engine-v2.1'
  };
}

export const POSRecipePricingModal: React.FC<POSRecipePricingModalProps> = ({
  isOpen,
  product,
  availableMaterials = [],
  openedFromProduction = false,
  onReturnToProduction,
  onClose,
  onPriceUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'recipe' | 'analysis'>('recipe');
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [overheadCost, setOverheadCost] = useState<number>(0);
  const [wastagePercent, setWastagePercent] = useState<number>(0);
  const [targetMargin, setTargetMargin] = useState<number>(35);

  const [isLoadingRecipe, setIsLoadingRecipe] = useState<boolean>(false);
  const [isSavingRecipe, setIsSavingRecipe] = useState<boolean>(false);
  const [isApplyingPrice, setIsApplyingPrice] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<DynamicPricingAnalysis | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Muat resep produk yang tersimpan secara resilient (Graceful Degradation)
  const loadRecipeAndAnalysis = async () => {
    if (!product) return;
    setIsLoadingRecipe(true);
    setFeedback(null);

    let resolvedItems: RecipeItem[] = [];
    let resolvedOverhead = 0;
    let resolvedWastage = 0;

    // 1. Coba ambil resep spesifik dari backend
    try {
      const recipeRes = await api.getProductRecipe(product.id);
      if (recipeRes && Array.isArray(recipeRes.items) && recipeRes.items.length > 0) {
        resolvedItems = recipeRes.items;
        resolvedOverhead = recipeRes.overhead_cost_per_unit || 0;
        resolvedWastage = recipeRes.wastage_percent || 0;
      }
    } catch (err: any) {
      // 404 atau belum ada resep adalah kondisi wajar bagi produk baru; jangan tampilkan banner error merah!
      console.info('[POSRecipePricingModal] Produk belum memiliki formulasi BOM di database, menggunakan template awal.');
    }

    // 2. Jika belum ada resep tersimpan, sediakan 1 baris bahan awal bersih
    if (resolvedItems.length === 0) {
      resolvedItems = [{
        material_name: '',
        quantity_required: 1,
        unit: availableMaterials[0]?.unit || 'Gram',
        cost_per_unit: 0
      }];
    }

    setItems(resolvedItems);
    setOverheadCost(resolvedOverhead);
    setWastagePercent(resolvedWastage);

    // 3. Ambil analisis harga AI (dengan fallback deterministik lokal jika server belum merespons)
    try {
      const analysisRes = await api.getPricingAnalysis(product.id, targetMargin);
      if (analysisRes) {
        setAnalysis(analysisRes);
      } else {
        setAnalysis(generateLocalPricingAnalysis(product, resolvedItems, resolvedOverhead, resolvedWastage, targetMargin));
      }
    } catch (err: any) {
      console.warn('[POSRecipePricingModal] Analisis AI server tidak tersedia, mengaktifkan engine kalkulasi lokal:', err);
      setAnalysis(generateLocalPricingAnalysis(product, resolvedItems, resolvedOverhead, resolvedWastage, targetMargin));
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      loadRecipeAndAnalysis();
    }
  }, [isOpen, product?.id]);

  // Kalkulasi live modal bahan saat mengedit tabel
  const rawMaterialTotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.quantity_required || 0) * Number(item.cost_per_unit || 0)), 0);
  }, [items]);

  const estimatedHpp = useMemo(() => {
    const wastageMult = wastagePercent < 90 ? 1 / (1 - wastagePercent / 100) : 1;
    return (rawMaterialTotal * wastageMult) + Number(overheadCost || 0);
  }, [rawMaterialTotal, wastagePercent, overheadCost]);

  if (!isOpen || !product) return null;

  // Handler Tambah Bahan
  const handleAddMaterial = () => {
    setItems(prev => [
      ...prev,
      {
        material_name: '',
        quantity_required: 1,
        unit: 'Gram',
        cost_per_unit: 0,
        notes: ''
      }
    ]);
  };

  // Handler Hapus Bahan
  const handleRemoveMaterial = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handler Update Row
  const handleUpdateItem = (index: number, field: keyof RecipeItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Simpan Resep BOM
  const handleSaveRecipe = async () => {
    const validItems = items.filter(i => i.material_name.trim().length > 0 && i.quantity_required > 0);
    if (validItems.length === 0) {
      setFeedback({ type: 'error', message: 'Masukkan minimal 1 bahan baku dengan takaran valid.' });
      return;
    }

    setIsSavingRecipe(true);
    setFeedback(null);
    try {
      const res = await api.saveProductRecipe(product.id, {
        overhead_cost_per_unit: Number(overheadCost) || 0,
        wastage_percent: Number(wastagePercent) || 0,
        target_margin_percent: targetMargin,
        items: validItems
      });

      if (res && res.ai_pricing_analysis) {
        setAnalysis(res.ai_pricing_analysis);
      }
      setFeedback({ type: 'success', message: 'Resep bahan baku berhasil disimpan & HPP diperbarui!' });

      const updatedProduct = {
        ...product,
        cogs: res.new_cogs
      };

      // Update produk parent
      onPriceUpdated(updatedProduct);

      if (openedFromProduction && onReturnToProduction) {
        setTimeout(() => {
          onReturnToProduction();
        }, 300);
      } else {
        setActiveTab('analysis');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.detail || 'Gagal menyimpan resep bahan baku.'
      });
    } finally {
      setIsSavingRecipe(false);
    }
  };

  // Terapkan Harga Rekomendasi AI
  const handleApplyPrice = async (newPrice: number) => {
    setIsApplyingPrice(true);
    setFeedback(null);
    try {
      await api.applyRecommendedPrice(product.id, newPrice);
      setFeedback({
        type: 'success',
        message: `Harga jual kasir berhasil diperbarui ke ${formatCurrency(newPrice)}!`
      });
      onPriceUpdated({
        ...product,
        price: newPrice,
        cogs: analysis ? analysis.total_unit_cost_hpp : product.cogs
      });
      // Refresh analisis
      const updatedAnalysis = await api.getPricingAnalysis(product.id, targetMargin);
      setAnalysis(updatedAnalysis);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.detail || 'Gagal menerapkan harga baru.'
      });
    } finally {
      setIsApplyingPrice(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '16px'
    }}>
      <div style={{
        background: '#0B132B',
        border: '1px solid rgba(0, 223, 143, 0.3)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '880px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 223, 143, 0.15)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(0, 223, 143, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 223, 143, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
              border: '1px solid var(--mint-neon)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} color="var(--mint-neon)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                  AI Dynamic Pricing & Resep (BOM)
                </h3>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(0, 223, 143, 0.15)',
                  color: 'var(--mint-neon)',
                  fontWeight: 600,
                  border: '1px solid rgba(0, 223, 143, 0.3)'
                }}>
                  Anti-Margin Leakage
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                {product.name} ({product.sku}) • Harga Kasir Saat Ini: <strong style={{ color: '#F8FAFC' }}>{formatCurrency(product.price)}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#94A3B8'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '10px 20px',
          background: 'rgba(15, 23, 42, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <button
            onClick={() => setActiveTab('recipe')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'recipe' ? 'rgba(0, 223, 143, 0.15)' : 'transparent',
              color: activeTab === 'recipe' ? 'var(--mint-neon)' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={14} />
            <span>1. Komposisi Bahan Baku (BOM)</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'analysis' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'analysis' ? '#A5B4FC' : '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Calculator size={14} />
            <span>2. Analisis HPP & Rekomendasi AI</span>
            {analysis?.is_at_loss && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
            )}
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div style={{
            margin: '12px 20px 0 20px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: feedback.type === 'success' ? '#6EE7B7' : '#FCA5A5'
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoadingRecipe ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Menganalisis komposisi bahan & HPP produk...</p>
            </div>
          ) : activeTab === 'recipe' ? (
            <>
              <POSRecipeTable
                items={items}
                availableMaterials={availableMaterials}
                onAddItem={handleAddMaterial}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveMaterial}
              />
              <POSRecipeOverheadControl
                overheadCost={overheadCost}
                setOverheadCost={setOverheadCost}
                wastagePercent={wastagePercent}
                setWastagePercent={setWastagePercent}
                targetMargin={targetMargin}
                setTargetMargin={setTargetMargin}
                estimatedHpp={estimatedHpp}
                isSavingRecipe={isSavingRecipe}
                onSaveRecipe={handleSaveRecipe}
                openedFromProduction={openedFromProduction}
              />
            </>
          ) : (
            analysis && (
              <>
                <POSRecipePricingTiers
                  analysis={analysis}
                  isApplyingPrice={isApplyingPrice}
                  onApplyPrice={handleApplyPrice}
                />
                <POSRecipeAIInsights analysis={analysis} />
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};
