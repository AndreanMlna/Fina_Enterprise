/**
 * FINA-ENTERPRISE: Wizard Setup Saldo Awal (Initial Capital Balance)
 * 
 * Modul onboarding 4 langkah untuk pemilik UMKM memasukkan:
 * 1. Kas & Saldo Bank Awal
 * 2. Stok Bahan Baku & Barang Dagangan
 * 3. Peralatan & Aset Tetap
 * 4. Utang Awal (Opsional) + Preview Neraca
 * 
 * Compliance: SAK EMKM Double-Entry, SHA-256 Merkle Audit
 * Security: RBAC OWNER-only, Tenant-scoped isolation
 */

import React, { useState, useCallback } from 'react';
import {
  Wallet, Building2, Package, Wrench, CreditCard,
  Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2,
  Rocket, Calculator, AlertTriangle, ShieldCheck, Hash
} from 'lucide-react';
import { api } from '../../services/api';
import type { InventoryItemPayload, FixedAssetPayload } from '../../services/types';

interface InitialSetupViewProps {
  onSetupComplete: () => void;
  tenantName?: string;
}

type WizardStep = 1 | 2 | 3 | 4;

const STEP_TITLES: Record<WizardStep, { title: string; subtitle: string; icon: React.ElementType }> = {
  1: { title: 'Kas & Saldo Bank', subtitle: 'Masukkan uang tunai dan saldo rekening awal', icon: Wallet },
  2: { title: 'Stok Bahan & Barang', subtitle: 'Daftar persediaan bahan baku / barang dagangan', icon: Package },
  3: { title: 'Peralatan & Aset Tetap', subtitle: 'Peralatan usaha, mesin, dan kendaraan', icon: Wrench },
  4: { title: 'Review & Konfirmasi', subtitle: 'Preview neraca saldo awal sebelum posting', icon: Calculator },
};

const formatRupiah = (n: number): string => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
};

export const InitialSetupView: React.FC<InitialSetupViewProps> = ({ onSetupComplete, tenantName }) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    journal_entry_number: string;
    owner_equity: number;
    products_created: number;
    audit_merkle_hash: string;
  } | null>(null);

  // --- Form State ---
  const [effectiveDate, setEffectiveDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [cashOnHand, setCashOnHand] = useState<number>(0);
  const [bankBalance, setBankBalance] = useState<number>(0);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemPayload[]>([]);
  const [fixedAssets, setFixedAssets] = useState<FixedAssetPayload[]>([]);
  const [openingPayables, setOpeningPayables] = useState<number>(0);

  // --- Computed Values ---
  const totalInventory = inventoryItems.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
  const totalEquipment = fixedAssets.filter(a => a.asset_type === 'equipment').reduce((sum, a) => sum + a.value, 0);
  const totalVehicles = fixedAssets.filter(a => a.asset_type === 'vehicle').reduce((sum, a) => sum + a.value, 0);
  const totalAssets = cashOnHand + bankBalance + totalInventory + totalEquipment + totalVehicles;
  const totalLiabilities = openingPayables;
  const ownerEquity = totalAssets - totalLiabilities;

  // --- Inventory Handlers ---
  const addInventoryItem = useCallback(() => {
    setInventoryItems(prev => [...prev, {
      name: '', quantity: 1, unit: 'Pcs', unit_cost: 0, selling_price: 0, category: 'Umum'
    }]);
  }, []);

  const updateInventoryItem = useCallback((index: number, field: keyof InventoryItemPayload, value: string | number) => {
    setInventoryItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  const removeInventoryItem = useCallback((index: number) => {
    setInventoryItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // --- Fixed Asset Handlers ---
  const addFixedAsset = useCallback(() => {
    setFixedAssets(prev => [...prev, { name: '', value: 0, asset_type: 'equipment' }]);
  }, []);

  const updateFixedAsset = useCallback((index: number, field: keyof FixedAssetPayload, value: string | number) => {
    setFixedAssets(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  const removeFixedAsset = useCallback((index: number) => {
    setFixedAssets(prev => prev.filter((_, i) => i !== index));
  }, []);

  // --- Submit ---
  const handleSubmit = async () => {
    if (totalAssets <= 0) {
      setError('Total aset harus lebih besar dari Rp 0. Masukkan minimal saldo kas atau stok barang.');
      return;
    }
    if (ownerEquity <= 0) {
      setError('Modal pemilik tidak boleh negatif. Total aset harus lebih besar dari total utang.');
      return;
    }

    // Filter out incomplete inventory items
    const validInventory = inventoryItems.filter(i => i.name.trim() && i.unit_cost > 0 && i.quantity > 0);
    const validAssets = fixedAssets.filter(a => a.name.trim() && a.value > 0);

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await api.postInitialBalance({
        effective_date: effectiveDate,
        cash_on_hand: cashOnHand,
        bank_balance: bankBalance,
        inventory_items: validInventory,
        fixed_assets: validAssets,
        opening_payables: openingPayables,
      });

      setSuccessData({
        journal_entry_number: result.journal_entry_number,
        owner_equity: result.owner_equity,
        products_created: result.products_created,
        audit_merkle_hash: result.audit_merkle_hash,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan saldo awal. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Success Screen ---
  if (successData) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIconWrapper}>
            <CheckCircle2 size={64} color="#10B981" />
          </div>
          <h2 style={styles.successTitle}>🎉 Setup Saldo Awal Berhasil!</h2>
          <p style={styles.successSubtitle}>
            Usaha <strong>{tenantName || 'Anda'}</strong> siap beroperasi di sistem FINA-ENTERPRISE.
          </p>

          <div style={styles.successDetails}>
            <div style={styles.successRow}>
              <span style={styles.successLabel}>No. Jurnal</span>
              <span style={styles.successValue}>{successData.journal_entry_number}</span>
            </div>
            <div style={styles.successRow}>
              <span style={styles.successLabel}>Modal Pemilik</span>
              <span style={{ ...styles.successValue, color: '#10B981', fontWeight: 700 }}>
                {formatRupiah(successData.owner_equity)}
              </span>
            </div>
            <div style={styles.successRow}>
              <span style={styles.successLabel}>Produk Terdaftar</span>
              <span style={styles.successValue}>{successData.products_created} item</span>
            </div>
            <div style={styles.successRow}>
              <span style={styles.successLabel}>
                <Hash size={14} style={{ marginRight: 4 }} />Audit Hash
              </span>
              <span style={{ ...styles.successValue, fontSize: '0.7rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {successData.audit_merkle_hash.substring(0, 32)}...
              </span>
            </div>
          </div>

          <div style={styles.successBadges}>
            <span style={styles.badge}><ShieldCheck size={14} /> SAK EMKM Compliant</span>
            <span style={styles.badge}><ShieldCheck size={14} /> SHA-256 Merkle Chained</span>
          </div>

          <button style={styles.primaryButton} onClick={onSetupComplete}>
            <Rocket size={18} />
            Mulai Gunakan Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>
            <Building2 size={28} color="#6366F1" />
            Setup Usaha — Modal Awal
          </h1>
          <p style={styles.headerSubtitle}>
            Masukkan data keuangan awal {tenantName ? `untuk ${tenantName}` : 'usaha Anda'} sebelum mulai beroperasi.
          </p>
        </div>
        <div style={styles.dateInput}>
          <label style={styles.dateLabel}>Tanggal Efektif</label>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            style={styles.dateField}
          />
        </div>
      </div>

      {/* Step Indicator */}
      <div style={styles.stepIndicator}>
        {([1, 2, 3, 4] as WizardStep[]).map((s) => {
          const StepIcon = STEP_TITLES[s].icon;
          const isActive = s === step;
          const isDone = s < step;
          return (
            <div
              key={s}
              style={{
                ...styles.stepItem,
                ...(isActive ? styles.stepItemActive : {}),
                ...(isDone ? styles.stepItemDone : {}),
                cursor: isDone ? 'pointer' : 'default',
              }}
              onClick={() => isDone && setStep(s)}
            >
              <div style={{
                ...styles.stepCircle,
                ...(isActive ? styles.stepCircleActive : {}),
                ...(isDone ? styles.stepCircleDone : {}),
              }}>
                {isDone ? <CheckCircle2 size={18} /> : <StepIcon size={18} />}
              </div>
              <span style={styles.stepLabel}>{STEP_TITLES[s].title}</span>
            </div>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={styles.contentCard}>
        <h3 style={styles.sectionTitle}>
          {React.createElement(STEP_TITLES[step].icon, { size: 20 })}
          {STEP_TITLES[step].title}
        </h3>
        <p style={styles.sectionSubtitle}>{STEP_TITLES[step].subtitle}</p>

        {/* Step 1: Kas & Bank */}
        {step === 1 && (
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Wallet size={16} color="#6366F1" />
                Uang Tunai di Laci / Dompet (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={cashOnHand || ''}
                onChange={(e) => setCashOnHand(Math.max(0, Number(e.target.value)))}
                placeholder="Contoh: 5000000"
                style={styles.input}
              />
              <span style={styles.hint}>Uang kertas/logam yang ada di tangan saat ini</span>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Building2 size={16} color="#6366F1" />
                Saldo Rekening Bank / E-Wallet (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={bankBalance || ''}
                onChange={(e) => setBankBalance(Math.max(0, Number(e.target.value)))}
                placeholder="Contoh: 15000000"
                style={styles.input}
              />
              <span style={styles.hint}>BCA, BRI, Mandiri, GoPay, OVO, Dana, dll</span>
            </div>
          </div>
        )}

        {/* Step 2: Inventory */}
        {step === 2 && (
          <div>
            <div style={styles.tableHeader}>
              <span style={{ flex: 2 }}>Nama Barang/Bahan</span>
              <span style={{ flex: 1 }}>Qty</span>
              <span style={{ flex: 1 }}>Satuan</span>
              <span style={{ flex: 1 }}>Harga Beli</span>
              <span style={{ flex: 1 }}>Harga Jual</span>
              <span style={{ width: 40 }}></span>
            </div>
            {inventoryItems.map((item, idx) => (
              <div key={idx} style={styles.tableRow}>
                <input
                  style={{ ...styles.inputSmall, flex: 2 }}
                  placeholder="Beras Ramos"
                  value={item.name}
                  onChange={(e) => updateInventoryItem(idx, 'name', e.target.value)}
                />
                <input
                  type="number" min={1}
                  style={{ ...styles.inputSmall, flex: 1 }}
                  value={item.quantity || ''}
                  onChange={(e) => updateInventoryItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                />
                <select
                  style={{ ...styles.inputSmall, flex: 1 }}
                  value={item.unit}
                  onChange={(e) => updateInventoryItem(idx, 'unit', e.target.value)}
                >
                  {['Pcs', 'Kg', 'Liter', 'Karung', 'Peti', 'Lusin', 'Porsi', 'Pack', 'Box', 'Roll'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <input
                  type="number" min={0}
                  style={{ ...styles.inputSmall, flex: 1 }}
                  placeholder="350000"
                  value={item.unit_cost || ''}
                  onChange={(e) => updateInventoryItem(idx, 'unit_cost', Math.max(0, Number(e.target.value)))}
                />
                <input
                  type="number" min={0}
                  style={{ ...styles.inputSmall, flex: 1 }}
                  placeholder="455000"
                  value={item.selling_price || ''}
                  onChange={(e) => updateInventoryItem(idx, 'selling_price', Math.max(0, Number(e.target.value)))}
                />
                <button style={styles.deleteBtn} onClick={() => removeInventoryItem(idx)} title="Hapus">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button style={styles.addButton} onClick={addInventoryItem}>
              <Plus size={16} /> Tambah Barang/Bahan
            </button>
            {totalInventory > 0 && (
              <div style={styles.subtotalBar}>
                Total Persediaan Awal: <strong>{formatRupiah(totalInventory)}</strong>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Fixed Assets */}
        {step === 3 && (
          <div>
            <div style={styles.tableHeader}>
              <span style={{ flex: 3 }}>Nama Aset</span>
              <span style={{ flex: 1 }}>Jenis</span>
              <span style={{ flex: 1 }}>Nilai (Rp)</span>
              <span style={{ width: 40 }}></span>
            </div>
            {fixedAssets.map((asset, idx) => (
              <div key={idx} style={styles.tableRow}>
                <input
                  style={{ ...styles.inputSmall, flex: 3 }}
                  placeholder="Gerobak Bakso Stainless"
                  value={asset.name}
                  onChange={(e) => updateFixedAsset(idx, 'name', e.target.value)}
                />
                <select
                  style={{ ...styles.inputSmall, flex: 1 }}
                  value={asset.asset_type}
                  onChange={(e) => updateFixedAsset(idx, 'asset_type', e.target.value)}
                >
                  <option value="equipment">Peralatan</option>
                  <option value="vehicle">Kendaraan</option>
                </select>
                <input
                  type="number" min={0}
                  style={{ ...styles.inputSmall, flex: 1 }}
                  placeholder="8000000"
                  value={asset.value || ''}
                  onChange={(e) => updateFixedAsset(idx, 'value', Math.max(0, Number(e.target.value)))}
                />
                <button style={styles.deleteBtn} onClick={() => removeFixedAsset(idx)} title="Hapus">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button style={styles.addButton} onClick={addFixedAsset}>
              <Plus size={16} /> Tambah Aset Tetap
            </button>
            {(totalEquipment + totalVehicles) > 0 && (
              <div style={styles.subtotalBar}>
                Total Aset Tetap: <strong>{formatRupiah(totalEquipment + totalVehicles)}</strong>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <div>
            {/* Utang Awal */}
            <div style={{ ...styles.formGroup, marginBottom: 24 }}>
              <label style={styles.label}>
                <CreditCard size={16} color="#EF4444" />
                Utang Awal ke Pemasok / Supplier (Opsional)
              </label>
              <input
                type="number"
                min={0}
                value={openingPayables || ''}
                onChange={(e) => setOpeningPayables(Math.max(0, Number(e.target.value)))}
                placeholder="Contoh: 3000000 (kosongkan jika tidak ada)"
                style={styles.input}
              />
            </div>

            {/* Preview Neraca Saldo Awal */}
            <div style={styles.balanceSheet}>
              <h4 style={styles.balanceTitle}>📊 Preview Neraca Saldo Awal</h4>

              <div style={styles.balanceSection}>
                <div style={styles.balanceSectionTitle}>ASET (Harta)</div>
                {cashOnHand > 0 && (
                  <div style={styles.balanceRow}>
                    <span>1101 — Kas Tunai</span>
                    <span style={{ color: '#10B981' }}>{formatRupiah(cashOnHand)}</span>
                  </div>
                )}
                {bankBalance > 0 && (
                  <div style={styles.balanceRow}>
                    <span>1102 — Saldo Bank/E-Wallet</span>
                    <span style={{ color: '#10B981' }}>{formatRupiah(bankBalance)}</span>
                  </div>
                )}
                {totalInventory > 0 && (
                  <div style={styles.balanceRow}>
                    <span>1104 — Persediaan ({inventoryItems.filter(i => i.name).length} item)</span>
                    <span style={{ color: '#10B981' }}>{formatRupiah(totalInventory)}</span>
                  </div>
                )}
                {totalEquipment > 0 && (
                  <div style={styles.balanceRow}>
                    <span>1201 — Peralatan Usaha</span>
                    <span style={{ color: '#10B981' }}>{formatRupiah(totalEquipment)}</span>
                  </div>
                )}
                {totalVehicles > 0 && (
                  <div style={styles.balanceRow}>
                    <span>1203 — Kendaraan Operasional</span>
                    <span style={{ color: '#10B981' }}>{formatRupiah(totalVehicles)}</span>
                  </div>
                )}
                <div style={styles.balanceTotalRow}>
                  <span>TOTAL ASET</span>
                  <span>{formatRupiah(totalAssets)}</span>
                </div>
              </div>

              <div style={styles.balanceSection}>
                <div style={styles.balanceSectionTitle}>KEWAJIBAN (Utang)</div>
                {openingPayables > 0 && (
                  <div style={styles.balanceRow}>
                    <span>2101 — Utang Usaha Pemasok</span>
                    <span style={{ color: '#EF4444' }}>{formatRupiah(openingPayables)}</span>
                  </div>
                )}
                <div style={styles.balanceTotalRow}>
                  <span>TOTAL KEWAJIBAN</span>
                  <span>{formatRupiah(totalLiabilities)}</span>
                </div>
              </div>

              <div style={styles.balanceSection}>
                <div style={styles.balanceSectionTitle}>EKUITAS (Modal Pemilik)</div>
                <div style={styles.balanceRow}>
                  <span>3101 — Modal Pemilik (Auto-Computed)</span>
                  <span style={{ color: ownerEquity > 0 ? '#6366F1' : '#EF4444', fontWeight: 700 }}>
                    {formatRupiah(ownerEquity)}
                  </span>
                </div>
                <div style={{ ...styles.balanceTotalRow, background: ownerEquity > 0 ? 'rgba(99,102,241,0.1)' : 'rgba(239,68,68,0.1)' }}>
                  <span>KEWAJIBAN + EKUITAS</span>
                  <span>{formatRupiah(totalLiabilities + ownerEquity)}</span>
                </div>
              </div>

              {/* Balance Check */}
              <div style={{
                ...styles.balanceCheck,
                borderColor: Math.abs(totalAssets - (totalLiabilities + ownerEquity)) < 0.01 && totalAssets > 0
                  ? '#10B981' : '#EF4444'
              }}>
                {Math.abs(totalAssets - (totalLiabilities + ownerEquity)) < 0.01 && totalAssets > 0 ? (
                  <><CheckCircle2 size={18} color="#10B981" /> Neraca BERIMBANG ✓ (Aset = Kewajiban + Modal)</>
                ) : (
                  <><AlertTriangle size={18} color="#EF4444" /> {totalAssets <= 0 ? 'Total aset masih Rp 0' : 'Modal pemilik harus positif'}</>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.errorBar}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={styles.navButtons}>
        {step > 1 && (
          <button style={styles.secondaryButton} onClick={() => { setStep((step - 1) as WizardStep); setError(null); }}>
            <ArrowLeft size={16} /> Kembali
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < 4 ? (
          <button style={styles.primaryButton} onClick={() => setStep((step + 1) as WizardStep)}>
            Lanjutkan <ArrowRight size={16} />
          </button>
        ) : (
          <button
            style={{
              ...styles.primaryButton,
              opacity: isSubmitting || totalAssets <= 0 || ownerEquity <= 0 ? 0.5 : 1,
              cursor: isSubmitting || totalAssets <= 0 || ownerEquity <= 0 ? 'not-allowed' : 'pointer',
            }}
            onClick={handleSubmit}
            disabled={isSubmitting || totalAssets <= 0 || ownerEquity <= 0}
          >
            {isSubmitting ? (
              <>⏳ Membukukan Jurnal...</>
            ) : (
              <><Rocket size={16} /> Mulai Usaha 🚀</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};


// --- Premium Styles ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0F0F23 0%, #1a1a3e 50%, #0F0F23 100%)',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    color: '#E2E8F0',
  },
  header: {
    width: '100%',
    maxWidth: 900,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  headerTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: 0,
    background: 'linear-gradient(135deg, #818CF8, #6366F1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  headerSubtitle: {
    fontSize: '0.9rem',
    color: '#94A3B8',
    marginTop: 4,
  },
  dateInput: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  dateLabel: {
    fontSize: '0.75rem',
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  dateField: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#E2E8F0',
    fontSize: '0.9rem',
    outline: 'none',
  },
  stepIndicator: {
    width: '100%',
    maxWidth: 900,
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'all 0.3s ease',
    flex: 1,
    justifyContent: 'center',
  },
  stepItemActive: {
    background: 'rgba(99,102,241,0.15)',
    border: '1px solid rgba(99,102,241,0.4)',
    boxShadow: '0 0 20px rgba(99,102,241,0.15)',
  },
  stepItemDone: {
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
    color: '#94A3B8',
    flexShrink: 0,
  },
  stepCircleActive: {
    background: 'rgba(99,102,241,0.3)',
    color: '#818CF8',
  },
  stepCircleDone: {
    background: 'rgba(16,185,129,0.2)',
    color: '#10B981',
  },
  stepLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  contentCard: {
    width: '100%',
    maxWidth: 900,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 28,
    minHeight: 320,
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '0 0 4px',
    color: '#E2E8F0',
  },
  sectionSubtitle: {
    fontSize: '0.85rem',
    color: '#94A3B8',
    marginBottom: 20,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#CBD5E1',
  },
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#E2E8F0',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  hint: {
    fontSize: '0.75rem',
    color: '#64748B',
  },
  tableHeader: {
    display: 'flex',
    gap: 8,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: 6,
  },
  tableRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 6,
    alignItems: 'center',
  },
  inputSmall: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '8px 10px',
    color: '#E2E8F0',
    fontSize: '0.85rem',
    outline: 'none',
    minWidth: 0,
  },
  deleteBtn: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer',
    color: '#F87171',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    flexShrink: 0,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: '10px 18px',
    background: 'rgba(99,102,241,0.1)',
    border: '1px dashed rgba(99,102,241,0.4)',
    borderRadius: 10,
    color: '#818CF8',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    width: '100%',
    justifyContent: 'center',
  },
  subtotalBar: {
    marginTop: 12,
    padding: '10px 16px',
    background: 'rgba(16,185,129,0.08)',
    borderRadius: 8,
    border: '1px solid rgba(16,185,129,0.2)',
    fontSize: '0.9rem',
    color: '#10B981',
    textAlign: 'right' as const,
  },
  balanceSheet: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    padding: 24,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  balanceTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    marginBottom: 16,
  },
  balanceSection: {
    marginBottom: 16,
  },
  balanceSectionTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: '#94A3B8',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  balanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '0.88rem',
  },
  balanceTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    marginTop: 4,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    fontWeight: 700,
    fontSize: '0.92rem',
  },
  balanceCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid',
    fontSize: '0.88rem',
    fontWeight: 600,
    marginTop: 8,
  },
  navButtons: {
    width: '100%',
    maxWidth: 900,
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '12px 24px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#CBD5E1',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  errorBar: {
    width: '100%',
    maxWidth: 900,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10,
    color: '#F87171',
    fontSize: '0.88rem',
    fontWeight: 500,
  },
  // Success
  successCard: {
    maxWidth: 560,
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 20,
    padding: '40px 36px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'rgba(16,185,129,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    margin: 0,
    background: 'linear-gradient(135deg, #10B981, #34D399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  successSubtitle: {
    color: '#94A3B8',
    fontSize: '0.95rem',
  },
  successDetails: {
    width: '100%',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  successRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.88rem',
  },
  successLabel: {
    color: '#94A3B8',
    display: 'flex',
    alignItems: 'center',
  },
  successValue: {
    fontWeight: 600,
    color: '#E2E8F0',
  },
  successBadges: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: 20,
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#818CF8',
  },
};
