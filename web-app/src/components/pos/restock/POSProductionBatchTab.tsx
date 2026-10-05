import React from 'react';
import {
  Factory,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Layers,
  Sparkles
} from 'lucide-react';
import type { POSProduct } from '../../../types';
import type { ProductionBatchResponse } from '../../../services/types';
import { formatCurrency } from '../../../utils';

interface POSProductionBatchTabProps {
  products: POSProduct[];
  selectedFinishedProductId: string;
  setSelectedFinishedProductId: (val: string) => void;
  batchQuantity: number | '';
  setBatchQuantity: (val: number | '') => void;
  batchOverheadCost: number | '';
  setBatchOverheadCost: (val: number | '') => void;
  paymentMethod?: 'CASH' | 'BANK';
  setPaymentMethod?: (val: 'CASH' | 'BANK') => void;
  batchNotes: string;
  setBatchNotes: (val: string) => void;
  isLoadingRecipe: boolean;
  productionMaterialFeasibility: {
    hasRecipe: boolean;
    items: Array<{
      material_name: string;
      quantity_required: number;
      unit: string;
      requiredTotal: number;
      availableStock: number;
      isSufficient: boolean;
      subtotal: number;
    }>;
    allSufficient: boolean;
    totalMaterialCost: number;
    estimatedBatchHppPerUnit: number;
  };
  isSubmittingProduction: boolean;
  productionResult: ProductionBatchResponse | null;
  productionError: string | null;
  finishedProductSelected: POSProduct | undefined;
  onSubmit: (e: React.FormEvent) => void;
  onOpenRecipePricing: (product: POSProduct) => void;
}

export const POSProductionBatchTab: React.FC<POSProductionBatchTabProps> = ({
  products,
  selectedFinishedProductId,
  setSelectedFinishedProductId,
  batchQuantity,
  setBatchQuantity,
  batchOverheadCost,
  setBatchOverheadCost,
  paymentMethod = 'CASH',
  setPaymentMethod,
  batchNotes,
  setBatchNotes,
  isLoadingRecipe,
  productionMaterialFeasibility,
  isSubmittingProduction,
  productionResult,
  productionError,
  finishedProductSelected,
  onSubmit,
  onOpenRecipePricing
}) => {
  return (
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

      {/* Penjelasan Tahap 2: Pengolahan Bahan Baku */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <Layers size={20} color="var(--cyan-400)" />
        <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
          <strong style={{ color: '#ffffff' }}>Tahap 2: Pengolahan Bahan Baku menjadi Produk Jadi Siap Jual.</strong><br/>
          Pilih menu produk jadi (misal: Nasi Goreng, Ayam Geprek). Sistem akan mengonversi dan memotong bahan baku sesuai resep BOM, lalu otomatis menambahkan produk matang ke Katalog Kasir POS.
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              type="text"
              inputMode="numeric"
              placeholder="1"
              value={batchQuantity}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                if (raw === '') {
                  setBatchQuantity('');
                  return;
                }
                const cleaned = raw.replace(/^0+(?=\d)/, '');
                setBatchQuantity(cleaned === '' ? '' : parseInt(cleaned, 10));
              }}
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
              type="text"
              inputMode="numeric"
              placeholder="0 (LPG, listrik, dll.)"
              value={batchOverheadCost}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                if (raw === '') {
                  setBatchOverheadCost('');
                  return;
                }
                const cleaned = raw.replace(/^0+(?=\d)/, '');
                setBatchOverheadCost(cleaned === '' ? '' : parseInt(cleaned, 10));
              }}
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

          {/* Sumber Kas Overhead */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Sumber Kas Biaya Overhead
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod && setPaymentMethod(e.target.value as 'CASH' | 'BANK')}
              className="homies-select"
              style={{ width: '100%', padding: '10px 12px' }}
            >
              <option value="CASH">Kas Tunai di Tangan (Akun 1101)</option>
              <option value="BANK">Rekening Bank Operasional (Akun 1102)</option>
            </select>
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
                Daftar Kebutuhan Bahan Baku (Bill of Materials) untuk {batchQuantity || 0} Pcs
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
                {productionResult.overhead_cash_deducted !== undefined && productionResult.overhead_cash_deducted > 0 && (
                  <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.74rem' }}>
                    <span>💸 Biaya Overhead Terpotong: <strong>-{formatCurrency(productionResult.overhead_cash_deducted)}</strong> ({productionResult.payment_method === 'BANK' ? 'Bank 1102' : 'Kas Tunai 1101'}) • No Jurnal SAK EMKM: <code className="mono">{productionResult.overhead_journal_number || 'JV-OVD'}</code></span>
                  </div>
                )}
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
  );
};
