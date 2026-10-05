import React from 'react';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  RefreshCw,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import type { POSProduct } from '../../../types';
import type { RestockInventoryResponse } from '../../../services/types';
import { formatCurrency } from '../../../utils';

interface POSRestockTabProps {
  products: POSProduct[];
  selectedMaterialId: string;
  setSelectedMaterialId: (val: string) => void;
  materialName: string;
  setMaterialName: (val: string) => void;
  materialCategory: string;
  setMaterialCategory: (val: string) => void;
  quantityAdded: number;
  setQuantityAdded: (val: number) => void;
  unit: string;
  setUnit: (val: string) => void;
  purchasePricePerUnit: number;
  setPurchasePricePerUnit: (val: number) => void;
  paymentMethod: 'CASH' | 'BANK';
  setPaymentMethod: (val: 'CASH' | 'BANK') => void;
  supplierName: string;
  setSupplierName: (val: string) => void;
  restockNotes: string;
  setRestockNotes: (val: string) => void;
  isSubmittingRestock: boolean;
  restockResult: RestockInventoryResponse | null;
  restockError: string | null;
  movingAveragePreview: {
    oldStock: number;
    oldCogs: number;
    totalStock: number;
    newCogs: number;
  };
  onSubmit: (e: React.FormEvent) => void;
  onOpenRecipePricing: (product: POSProduct) => void;
}

export const POSRestockTab: React.FC<POSRestockTabProps> = ({
  products,
  selectedMaterialId,
  setSelectedMaterialId,
  materialName,
  setMaterialName,
  materialCategory,
  setMaterialCategory,
  quantityAdded,
  setQuantityAdded,
  unit,
  setUnit,
  purchasePricePerUnit,
  setPurchasePricePerUnit,
  paymentMethod,
  setPaymentMethod,
  supplierName,
  setSupplierName,
  restockNotes,
  setRestockNotes,
  isSubmittingRestock,
  restockResult,
  restockError,
  movingAveragePreview,
  onSubmit,
  onOpenRecipePricing
}) => {
  return (
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
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Pilih Bahan atau Tambah Baru */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Pilih Bahan Baku / Alat Terdaftar
            </label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="homies-select"
              style={{ width: '100%', padding: '10px 12px' }}
            >
              <option value="__NEW__">+ Input Bahan Baku / Alat Baru</option>
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
              Nama Bahan Baku / Alat / Material
            </label>
            <input
              type="text"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="Contoh: Kopi Arabika, Beras Ramos, Kemasan Box, Wajan"
              required
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
              Kategori Item
            </label>
            <select
              value={materialCategory}
              onChange={(e) => setMaterialCategory(e.target.value)}
              className="homies-select"
              style={{ width: '100%', padding: '10px 12px' }}
            >
              <option value="Bahan Baku">Bahan Baku (Raw Material)</option>
              <option value="Kemasan">Kemasan & Packaging</option>
              <option value="Bahan Pembantu">Bahan Pembantu / Aditif</option>
              <option value="Bahan Segar">Bahan Segar / Perishable</option>
              <option value="Alat Kerja">Alat Kerja & Peralatan (Equipment)</option>
            </select>
          </div>

          {/* Kuantitas Restock */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Kuantitas Ditambahkan
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={quantityAdded}
              onChange={(e) => setQuantityAdded(parseFloat(e.target.value) || 0)}
              required
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

          {/* Satuan */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Satuan Ukur
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
              <option value="Pcs">Pcs / Butir / Buah</option>
              <option value="Pack">Pack / Kotak</option>
              <option value="Lembar">Lembar</option>
              <option value="Unit">Unit / Set</option>
            </select>
          </div>

          {/* Harga Beli Faktur */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Harga Beli Satuan Faktur Terkini (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={purchasePricePerUnit}
              onChange={(e) => setPurchasePricePerUnit(parseFloat(e.target.value) || 0)}
              required
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

          {/* Sumber Dana Pembelian (SAK EMKM) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--mint-neon)', marginBottom: '6px' }}>
              Sumber Dana Pembelian (SAK EMKM)
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'BANK')}
              className="homies-select"
              style={{ width: '100%', padding: '10px 12px', borderColor: 'rgba(16, 185, 129, 0.4)' }}
            >
              <option value="CASH">Kas Tunai di Tangan (Akun 1101)</option>
              <option value="BANK">Rekening Bank Operasional (Akun 1102)</option>
            </select>
          </div>

          {/* Nama Supplier */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Supplier / Sumber Pembelian (Opsional)
            </label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Contoh: Pasar Induk, Toko Jaya Abadi"
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

          {/* Catatan / Ref Faktur */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Catatan / No. Faktur (Opsional)
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

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #f87171' }}>
              <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 600 }}>Dampak Kas/Bank Riil (SAK EMKM)</div>
              <div className="mono" style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fca5a5', marginTop: '2px' }}>
                -{formatCurrency((Number(quantityAdded) || 0) * (Number(purchasePricePerUnit) || 0))}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                Dipotong dari {paymentMethod === 'BANK' ? 'Bank (1102)' : 'Kas Tunai (1101)'}
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
                <span>Simpan Restock & Potong Kas</span>
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
              {restockResult.cash_deducted !== undefined && restockResult.cash_deducted > 0 && (
                <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.78rem' }}>
                  <span>💸 Uang Kas Terpotong: <strong>-{formatCurrency(restockResult.cash_deducted)}</strong> ({restockResult.payment_method === 'BANK' ? 'Bank 1102' : 'Kas Tunai 1101'}) • No Jurnal SAK EMKM: <code className="mono">{restockResult.journal_entry_number || 'JV-BUY'}</code></span>
                </div>
              )}
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
  );
};
