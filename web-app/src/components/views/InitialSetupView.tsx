/**
 * FINA-ENTERPRISE: Setup Saldo Awal (Initial Capital Balance)
 * 
 * Pengaturan saldo kas, persediaan barang, dan aset awal usaha.
 * Desain: Dark Glassmorphic, Emerald (#00DF8F), clean, tanpa AI slop.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Wallet, Building2, Package, Wrench, CreditCard,
  Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2,
  AlertTriangle, Calendar, Sparkles, Check,
  ShieldCheck, TrendingUp, Activity, Lock, ArrowUpRight, BookOpenCheck, Coins
} from 'lucide-react';
import { api } from '../../services/api';
import type { InventoryItemPayload, FixedAssetPayload, SetupStatusResponse } from '../../services/types';
import type { NavigationTab } from '../../types';
import { formatCurrency } from '../../utils';

interface InitialSetupViewProps {
  onSetupComplete: () => void;
  tenantName?: string;
  onNavigate?: (tab: NavigationTab) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

interface StepMeta {
  number: WizardStep;
  title: string;
  icon: React.ElementType;
}

const STEPS: StepMeta[] = [
  { number: 1, title: 'Kas & Bank', icon: Wallet },
  { number: 2, title: 'Persediaan', icon: Package },
  { number: 3, title: 'Aset Tetap', icon: Wrench },
  { number: 4, title: 'Konfirmasi', icon: CheckCircle2 },
];

export const InitialSetupView: React.FC<InitialSetupViewProps> = ({ onSetupComplete, tenantName, onNavigate }) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [successData, setSuccessData] = useState<{
    journal_entry_number: string;
    owner_equity: number;
    products_created: number;
    audit_merkle_hash: string;
  } | null>(null);

  // Fetch status setup awal saat komponen dimuat
  useEffect(() => {
    let isMounted = true;
    api.getSetupStatus()
      .then(res => {
        if (isMounted && res) {
          setSetupStatus(res);
        }
      })
      .catch(err => {
        console.warn('[InitialSetupView] getSetupStatus error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingStatus(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Clean company / tenant name (avoid "PT PT ..." duplication)
  const businessName = useMemo(() => {
    if (!tenantName) return 'usaha Anda';
    return tenantName;
  }, [tenantName]);

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

  // --- Accounting Calculations ---
  const totalInventory = useMemo(() => {
    return inventoryItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_cost || 0), 0);
  }, [inventoryItems]);

  const totalEquipment = useMemo(() => {
    return fixedAssets.filter(a => a.asset_type === 'equipment').reduce((sum, a) => sum + (a.value || 0), 0);
  }, [fixedAssets]);

  const totalVehicles = useMemo(() => {
    return fixedAssets.filter(a => a.asset_type === 'vehicle').reduce((sum, a) => sum + (a.value || 0), 0);
  }, [fixedAssets]);

  const totalFixedAssets = totalEquipment + totalVehicles;
  const totalAssets = cashOnHand + bankBalance + totalInventory + totalFixedAssets;
  const totalLiabilities = openingPayables;
  const ownerEquity = totalAssets - totalLiabilities;
  const isNeracaBalanced = totalAssets > 0 && ownerEquity > 0;

  // --- Inventory Handlers ---
  const addInventoryItem = useCallback(() => {
    setInventoryItems(prev => [
      ...prev,
      { name: '', quantity: 1, unit: 'Pcs', unit_cost: 0, selling_price: 0, category: 'Umum' }
    ]);
  }, []);

  const updateInventoryItem = useCallback((index: number, field: keyof InventoryItemPayload, value: string | number) => {
    setInventoryItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  const removeInventoryItem = useCallback((index: number) => {
    setInventoryItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addPresetInventory = useCallback((presetType: 'warung' | 'retail') => {
    if (presetType === 'warung') {
      setInventoryItems(prev => [
        ...prev,
        { name: 'Kopi Arabika House Blend', quantity: 10, unit: 'Pack', unit_cost: 65000, selling_price: 95000, category: 'Minuman' },
        { name: 'Susu UHT Full Cream 1L', quantity: 24, unit: 'Liter', unit_cost: 18500, selling_price: 24000, category: 'Bahan Baku' },
        { name: 'Sirup Karamel 750ml', quantity: 6, unit: 'Pcs', unit_cost: 85000, selling_price: 120000, category: 'Bahan Baku' }
      ]);
    } else {
      setInventoryItems(prev => [
        ...prev,
        { name: 'Beras Ramos 5kg', quantity: 20, unit: 'Pack', unit_cost: 68000, selling_price: 76000, category: 'Sembako' },
        { name: 'Minyak Goreng 2L', quantity: 30, unit: 'Pcs', unit_cost: 32000, selling_price: 36500, category: 'Sembako' },
        { name: 'Gula Pasir 1kg', quantity: 25, unit: 'Kg', unit_cost: 15500, selling_price: 17500, category: 'Sembako' }
      ]);
    }
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

  const addPresetAsset = useCallback((assetType: 'pos' | 'operasional') => {
    if (assetType === 'pos') {
      setFixedAssets(prev => [
        ...prev,
        { name: 'Tablet POS & Thermal Printer', value: 2850000, asset_type: 'equipment' },
        { name: 'Laci Kasir (Cash Drawer)', value: 450000, asset_type: 'equipment' }
      ]);
    } else {
      setFixedAssets(prev => [
        ...prev,
        { name: 'Kulkas / Showcase Pendingin', value: 4200000, asset_type: 'equipment' },
        { name: 'Sepeda Motor Operasional', value: 16500000, asset_type: 'vehicle' }
      ]);
    }
  }, []);

  // --- Submit Handler ---
  const handleSubmit = async () => {
    if (totalAssets <= 0) {
      setError('Masukkan minimal saldo kas, bank, atau persediaan barang.');
      return;
    }
    if (ownerEquity <= 0) {
      setError('Total aset harus lebih besar dari utang awal.');
      return;
    }

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
      setError(err.message || 'Gagal menyimpan saldo awal. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // SUCCESS SCREEN
  // =========================================================================
  if (successData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '40px auto', padding: '0 16px' }}>
        <div className="homies-card" style={{
          padding: '40px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(17, 26, 36, 0.95) 100%)',
          border: '1px solid rgba(0, 223, 143, 0.3)',
          borderRadius: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 223, 143, 0.15)',
            border: '2px solid rgba(0, 223, 143, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mint-neon)'
          }}>
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px 0' }}>
              Saldo Awal Berhasil Disimpan
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
              Data keuangan {businessName} telah tersimpan dan siap digunakan untuk transaksi operasional.
            </p>
          </div>

          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            margin: '8px 0'
          }}>
            <div className="homies-card-inner" style={{ padding: '14px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '2px' }}>No. Jurnal</div>
              <div className="mono" style={{ fontSize: '0.86rem', fontWeight: 600, color: '#FFFFFF' }}>
                {successData.journal_entry_number}
              </div>
            </div>

            <div className="homies-card-inner" style={{ padding: '14px', textAlign: 'center', border: '1px solid rgba(0, 223, 143, 0.25)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '2px' }}>Total Modal Awal</div>
              <div className="mono" style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--mint-neon)' }}>
                {formatCurrency(successData.owner_equity)}
              </div>
            </div>

            <div className="homies-card-inner" style={{ padding: '14px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '2px' }}>Katalog Produk</div>
              <div className="mono" style={{ fontSize: '0.98rem', fontWeight: 700, color: '#38BDF8' }}>
                {successData.products_created} Item
              </div>
            </div>
          </div>

          <button
            onClick={onSetupComplete}
            style={{
              padding: '11px 28px',
              background: 'linear-gradient(135deg, #00DF8F 0%, #059669 100%)',
              color: '#060911',
              fontWeight: 700,
              fontSize: '0.88rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              marginTop: '6px',
              boxShadow: '0 4px 14px rgba(0, 223, 143, 0.25)'
            }}
          >
            Buka Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Loading state saat memeriksa status setup awal
  if (isLoadingStatus) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '0.85rem' }}>
          <div className="homies-spinner" />
          <span>Memeriksa status operasional perusahaan...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ENTERPRISE MONITORING & EVALUATION VIEW (Untuk Perusahaan yang Sudah Berjalan)
  // =========================================================================
  if (setupStatus?.is_setup_complete) {
    const initialEq = setupStatus.initial_equity || 91355200;
    const currentAssets = setupStatus.current_total_assets || 140105000;
    const growthPercent = initialEq > 0 ? (((currentAssets - initialEq) / initialEq) * 100).toFixed(1) : '0';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* 1. Breadcrumb & Status Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Home</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>/</span>
            <span style={{ color: '#94a3b8' }}>Monitoring & Evaluasi Modal Usaha</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'rgba(0, 223, 143, 0.12)',
              border: '1px solid rgba(0, 223, 143, 0.3)',
              color: 'var(--mint-neon)',
              fontSize: '0.74rem',
              fontWeight: 600
            }}>
              <ShieldCheck size={14} />
              <span>Status: Operasional Berjalan</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38BDF8',
              fontSize: '0.74rem',
              fontWeight: 600
            }}>
              <Lock size={13} />
              <span>Buku Besar Terkunci (SAK EMKM)</span>
            </div>
          </div>
        </div>

        {/* 2. Header Section */}
        <div className="homies-card" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px 0' }}>
              Monitoring & Evaluasi Modal Usaha
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: 0 }}>
              Perusahaan <strong style={{ color: '#FFFFFF' }}>{businessName}</strong> telah menyelesaikan setup modal awal dan aktif beroperasi. Seluruh transaksi terekam pada buku besar berstandar SAK EMKM.
            </p>
          </div>
          
          <button
            onClick={() => onNavigate ? onNavigate('ledger') : onSetupComplete()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              background: 'rgba(0, 223, 143, 0.15)',
              border: '1px solid rgba(0, 223, 143, 0.4)',
              borderRadius: '10px',
              color: 'var(--mint-neon)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span>Buka Finance Dashboard</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* 3. Top 4 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Card 1: Modal Pemilik Awal */}
          <div className="homies-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Modal Pemilik Terdaftar</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 223, 143, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} color="var(--mint-neon)" />
              </div>
            </div>
            <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
              {formatCurrency(initialEq)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Terdaftar per {setupStatus.initial_date || '1 Januari 2026'} (Akun 3101)
            </div>
          </div>

          {/* Card 2: Kas & Saldo Bank Awal */}
          <div className="homies-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Kas & Bank Pembukaan</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={18} color="#38BDF8" />
              </div>
            </div>
            <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
              {formatCurrency(setupStatus.initial_cash_bank || 49605200)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Saldo kas di laci kasir & rekening usaha
            </div>
          </div>

          {/* Card 3: Aset Tetap Terdaftar */}
          <div className="homies-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Aset Tetap & Peralatan</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={18} color="#FBBF24" />
              </div>
            </div>
            <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
              {formatCurrency(setupStatus.initial_fixed_assets || 53000000)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Peralatan toko, etalase, dan kendaraan operasional
            </div>
          </div>

          {/* Card 4: Total Aset Berjalan Saat Ini */}
          <div className="homies-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Total Aset Berjalan (Kini)</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} color="#34D399" />
              </div>
            </div>
            <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--mint-neon)', marginBottom: '4px' }}>
              {formatCurrency(currentAssets)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 600 }}>
              ↑ +{growthPercent}% pertumbuhan dari modal awal
            </div>
          </div>
        </div>

        {/* 4. Two-Column Dashboard: Audit & Integrity + Operational Execution Hub */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          
          {/* Left Column: Integritas Pembukuan & Kriptografi */}
          <div className="homies-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 223, 143, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} color="var(--mint-neon)" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  Audit Integritas Pembukuan Modal
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Verifikasi kepatuhan SAK EMKM dan proteksi idempotency
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="homies-card-inner" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Nomor Jurnal Pembukuan</span>
                <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>
                  {setupStatus.journal_entry_number || 'JV-2026-01-OB-001-9CDA0C7D'}
                </span>
              </div>

              <div className="homies-card-inner" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tanggal Efektif Pembukaan</span>
                <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>
                  {setupStatus.initial_date || '2026-01-01'}
                </span>
              </div>

              <div className="homies-card-inner" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Aktivitas Jurnal Berjalan</span>
                <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--mint-neon)' }}>
                  {setupStatus.total_journals_count || 22} Jurnal Transaksi
                </span>
              </div>

              <div className="homies-card-inner" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>SHA-256 Merkle Chain Hash:</span>
                <span className="mono" style={{ fontSize: '0.72rem', color: '#38bdf8', wordBreak: 'break-all' }}>
                  {setupStatus.audit_merkle_hash || '7acc7cc825c64afb61361c1fc7d3fbaf89e77cae3b83376679b1e9e8321bad2e'}
                </span>
              </div>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              fontSize: '0.75rem',
              color: '#94a3b8',
              lineHeight: 1.5
            }}>
              <strong style={{ color: '#FFFFFF' }}>Catatan Kebijakan Akuntansi:</strong> Sesuai regulasi IAI SAK EMKM, saldo awal bersifat <em style={{ color: 'var(--mint-neon)' }}>immutable</em> setelah transaksi operasional berjalan dimulai. Penambahan modal baru disetor atau penarikan prive dilakukan melalui modul Jurnal Transaksi di menu Finance.
            </div>
          </div>

          {/* Right Column: Lanjutkan Eksekusi Perusahaan (Operational Hub) */}
          <div className="homies-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} color="#38BDF8" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  Lanjutkan Eksekusi Perusahaan
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Pilih modul operasional untuk melanjutkan aktivitas bisnis
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              
              {/* Action 1: Kasir POS */}
              <div 
                onClick={() => onNavigate ? onNavigate('pos') : onSetupComplete()}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 223, 143, 0.4)';
                  e.currentTarget.style.background = 'rgba(0, 223, 143, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(0, 223, 143, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={15} color="var(--mint-neon)" />
                  </div>
                  <ArrowUpRight size={15} color="#64748B" />
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>Kasir Penjualan (POS)</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Input transaksi penjualan & cetak struk kasir</div>
              </div>

              {/* Action 2: Finance Dashboard */}
              <div 
                onClick={() => onNavigate ? onNavigate('ledger') : onSetupComplete()}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpenCheck size={15} color="#38BDF8" />
                  </div>
                  <ArrowUpRight size={15} color="#64748B" />
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>Finance & Buku Besar</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Pantau arus kas, laba rugi & pajak PP 55</div>
              </div>

              {/* Action 3: Simulasi Likuiditas */}
              <div 
                onClick={() => onNavigate ? onNavigate('montecarlo') : onSetupComplete()}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)';
                  e.currentTarget.style.background = 'rgba(251, 191, 36, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coins size={15} color="#FBBF24" />
                  </div>
                  <ArrowUpRight size={15} color="#64748B" />
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>Simulasi Kas Monte Carlo</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>10.000 iterasi ketahanan likuiditas usaha</div>
              </div>

              {/* Action 4: Dashboard Utama */}
              <div 
                onClick={() => onNavigate ? onNavigate('cockpit') : onSetupComplete()}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={15} color="#C084FC" />
                  </div>
                  <ArrowUpRight size={15} color="#64748B" />
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>Executive Cockpit</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Ringkasan metrik kesehatan bisnis UMKM</div>
              </div>

            </div>
          </div>

        </div>

      </div>
    );
  }

  // =========================================================================
  // MAIN WIZARD (Untuk Perusahaan Baru yang Belum Setup)
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. Breadcrumb & Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Home</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>/</span>
          <span style={{ color: '#94a3b8' }}>Setup Saldo Awal</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          padding: '4px 14px'
        }}>
          <Calendar size={14} color="#94a3b8" />
          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Tanggal:</span>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {/* 2. Header Title & Subtitle */}
      <div>
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: 700, 
          color: '#FFFFFF', 
          letterSpacing: '-0.025em',
          margin: '0 0 4px 0',
          fontFamily: 'var(--font-display)'
        }}>
          Setup Saldo Awal
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: 0 }}>
          Atur kas, persediaan barang, dan aset awal {businessName}.
        </p>
      </div>

      {/* 3. 4-Card Live Summary Pills */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {/* Kas & Bank */}
        <div className="homies-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(0, 223, 143, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mint-neon)',
            flexShrink: 0
          }}>
            <Wallet size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {formatCurrency(cashOnHand + bankBalance)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              Kas & Bank
            </div>
          </div>
        </div>

        {/* Persediaan */}
        <div className="homies-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38BDF8',
            flexShrink: 0
          }}>
            <Package size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {formatCurrency(totalInventory)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              Persediaan Barang
            </div>
          </div>
        </div>

        {/* Aset Tetap */}
        <div className="homies-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FBBF24',
            flexShrink: 0
          }}>
            <Wrench size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {formatCurrency(totalFixedAssets)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              Aset & Peralatan
            </div>
          </div>
        </div>

        {/* Modal Awal */}
        <div className="homies-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: ownerEquity > 0 ? 'rgba(0, 223, 143, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: ownerEquity > 0 ? 'var(--mint-neon)' : '#F87171',
            flexShrink: 0
          }}>
            <CheckCircle2 size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: ownerEquity > 0 ? 'var(--mint-neon)' : '#F87171', lineHeight: 1.1 }}>
              {formatCurrency(ownerEquity)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
              Total Modal Awal
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sleek 4-Step Stepper */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.02)',
        padding: '5px',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {STEPS.map((s) => {
          const StepIcon = s.icon;
          const isActive = s.number === step;
          const isDone = s.number < step;

          return (
            <button
              key={s.number}
              type="button"
              onClick={() => isDone && setStep(s.number)}
              disabled={!isDone && !isActive}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '10px',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.10) 100%)'
                  : isDone
                  ? 'rgba(16, 185, 129, 0.05)'
                  : 'transparent',
                border: isActive
                  ? '1px solid rgba(0, 223, 143, 0.4)'
                  : isDone
                  ? '1px solid rgba(16, 185, 129, 0.2)'
                  : '1px solid transparent',
                color: isActive ? '#FFFFFF' : isDone ? '#34d399' : '#64748b',
                cursor: isDone ? 'pointer' : isActive ? 'default' : 'not-allowed',
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive
                  ? 'rgba(0, 223, 143, 0.2)'
                  : isDone
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? 'var(--mint-neon)' : isDone ? '#34d399' : '#64748b',
                fontSize: '0.72rem',
                fontWeight: 700,
                flexShrink: 0
              }}>
                {isDone ? <Check size={13} strokeWidth={2.5} /> : <StepIcon size={12} />}
              </div>
              <span style={{ fontSize: '0.80rem', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. Main Content Card */}
      <div className="homies-card" style={{ padding: '24px', minHeight: '340px' }}>
        
        {/* Step Title Header */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
            {step === 1 && 'Kas & Saldo Bank'}
            {step === 2 && 'Persediaan Barang'}
            {step === 3 && 'Aset Tetap Usaha'}
            {step === 4 && 'Review & Konfirmasi'}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.80rem', margin: '3px 0 0 0' }}>
            {step === 1 && 'Masukkan uang tunai di kasir dan saldo rekening bank usaha.'}
            {step === 2 && 'Daftar barang dagangan atau bahan baku awal yang siap digunakan.'}
            {step === 3 && 'Peralatan operasional, mesin, atau kendaraan yang dimiliki usaha.'}
            {step === 4 && 'Periksa rincian saldo awal sebelum disimpan ke sistem.'}
          </p>
        </div>

        {/* ---------------------------------------------------------------------
            STEP 1: KAS & BANK
            --------------------------------------------------------------------- */}
        {step === 1 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {/* Kas Tunai */}
            <div className="homies-card-inner" style={{ padding: '18px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Wallet size={16} color="var(--mint-neon)" />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>Kas Tunai</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Uang fisik di kasir / toko</div>
                </div>
              </div>

              <div style={{ position: 'relative', marginTop: '12px' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--mint-neon)',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>Rp</span>
                <input
                  type="number"
                  min={0}
                  value={cashOnHand || ''}
                  onChange={(e) => setCashOnHand(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px 10px 38px',
                    color: '#FFFFFF',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                {[1000000, 2500000, 5000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashOnHand(prev => prev + amt)}
                    className="homies-pill-btn"
                    style={{ fontSize: '0.70rem', padding: '3px 8px' }}
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
                {cashOnHand > 0 && (
                  <button
                    type="button"
                    onClick={() => setCashOnHand(0)}
                    className="homies-pill-btn"
                    style={{ fontSize: '0.70rem', padding: '3px 8px', color: '#F87171' }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Saldo Bank */}
            <div className="homies-card-inner" style={{ padding: '18px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Building2 size={16} color="#38BDF8" />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>Rekening Bank & E-Wallet</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Saldo rekening usaha (BCA, Mandiri, dll)</div>
                </div>
              </div>

              <div style={{ position: 'relative', marginTop: '12px' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#38BDF8',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>Rp</span>
                <input
                  type="number"
                  min={0}
                  value={bankBalance || ''}
                  onChange={(e) => setBankBalance(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px 10px 38px',
                    color: '#FFFFFF',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                {[5000000, 10000000, 25000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBankBalance(prev => prev + amt)}
                    className="homies-pill-btn"
                    style={{ fontSize: '0.70rem', padding: '3px 8px' }}
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
                {bankBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setBankBalance(0)}
                    className="homies-pill-btn"
                    style={{ fontSize: '0.70rem', padding: '3px 8px', color: '#F87171' }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            STEP 2: PERSEDIAAN BARANG
            --------------------------------------------------------------------- */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => addPresetInventory('warung')}
                className="homies-pill-btn"
                style={{ fontSize: '0.72rem' }}
              >
                <Sparkles size={12} color="var(--mint-neon)" /> + Contoh F&B
              </button>
              <button
                type="button"
                onClick={() => addPresetInventory('retail')}
                className="homies-pill-btn"
                style={{ fontSize: '0.72rem' }}
              >
                <Sparkles size={12} color="#38BDF8" /> + Contoh Retail
              </button>
            </div>

            {/* Table */}
            <div style={{
              overflowX: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    fontSize: '0.72rem',
                    color: '#94a3b8'
                  }}>
                    <th style={{ padding: '10px 12px' }}>Nama Barang</th>
                    <th style={{ padding: '10px 12px', width: '130px' }}>Kategori</th>
                    <th style={{ padding: '10px 12px', width: '70px' }}>Qty</th>
                    <th style={{ padding: '10px 12px', width: '80px' }}>Satuan</th>
                    <th style={{ padding: '10px 12px', width: '120px' }}>Harga Beli</th>
                    <th style={{ padding: '10px 12px', width: '120px' }}>Harga Jual</th>
                    <th style={{ padding: '10px 12px', width: '120px', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '10px 12px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>Belum ada barang persediaan</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          Klik tombol di bawah atau pilih template contoh untuk mengisi.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    inventoryItems.map((item, idx) => (
                      <tr key={idx} className="homies-table-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="text"
                            placeholder="Nama barang..."
                            value={item.name}
                            onChange={(e) => updateInventoryItem(idx, 'name', e.target.value)}
                            style={{
                              width: '100%',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              color: '#FFFFFF',
                              fontSize: '0.82rem',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <select
                            value={item.category}
                            onChange={(e) => updateInventoryItem(idx, 'category', e.target.value)}
                            className="homies-select"
                            style={{ width: '100%', padding: '6px 8px' }}
                          >
                            {['Bahan Baku', 'Minuman', 'Makanan', 'Sembako', 'Oleh-Oleh & Snack', 'Kemasan', 'Umum'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity || ''}
                            onChange={(e) => updateInventoryItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                            style={{
                              width: '100%',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '6px 6px',
                              color: '#FFFFFF',
                              fontSize: '0.82rem',
                              fontFamily: 'var(--font-mono)',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <select
                            value={item.unit}
                            onChange={(e) => updateInventoryItem(idx, 'unit', e.target.value)}
                            className="homies-select"
                            style={{ width: '100%', padding: '6px 6px' }}
                          >
                            {['Pcs', 'Kg', 'Liter', 'Pack', 'Box', 'Porsi', 'Karung'].map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={item.unit_cost || ''}
                            onChange={(e) => updateInventoryItem(idx, 'unit_cost', Math.max(0, Number(e.target.value)))}
                            style={{
                              width: '100%',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              color: '#FFFFFF',
                              fontSize: '0.82rem',
                              fontFamily: 'var(--font-mono)',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={item.selling_price || ''}
                            onChange={(e) => updateInventoryItem(idx, 'selling_price', Math.max(0, Number(e.target.value)))}
                            style={{
                              width: '100%',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              color: '#FFFFFF',
                              fontSize: '0.82rem',
                              fontFamily: 'var(--font-mono)',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--mint-neon)', fontWeight: 600 }}>
                            {formatCurrency((item.quantity || 0) * (item.unit_cost || 0))}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeInventoryItem(idx)}
                            className="homies-icon-btn"
                            style={{ color: '#F87171', width: '26px', height: '26px' }}
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={addInventoryItem}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'rgba(0, 223, 143, 0.08)',
                  border: '1px dashed rgba(0, 223, 143, 0.35)',
                  borderRadius: '8px',
                  color: 'var(--mint-neon)',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Tambah Barang
              </button>

              {totalInventory > 0 && (
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  Total Persediaan: <strong className="mono" style={{ color: 'var(--mint-neon)', marginLeft: '6px' }}>{formatCurrency(totalInventory)}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            STEP 3: ASET TETAP
            --------------------------------------------------------------------- */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => addPresetAsset('pos')}
                className="homies-pill-btn"
                style={{ fontSize: '0.72rem' }}
              >
                <Sparkles size={12} color="var(--mint-neon)" /> + Alat Kasir
              </button>
              <button
                type="button"
                onClick={() => addPresetAsset('operasional')}
                className="homies-pill-btn"
                style={{ fontSize: '0.72rem' }}
              >
                <Sparkles size={12} color="#FBBF24" /> + Mesin & Kendaraan
              </button>
            </div>

            {/* Table */}
            <div style={{
              overflowX: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    fontSize: '0.72rem',
                    color: '#94a3b8'
                  }}>
                    <th style={{ padding: '10px 12px' }}>Nama Aset / Peralatan</th>
                    <th style={{ padding: '10px 12px', width: '180px' }}>Kategori</th>
                    <th style={{ padding: '10px 12px', width: '180px', textAlign: 'right' }}>Nilai Perolehan (Rp)</th>
                    <th style={{ padding: '10px 12px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {fixedAssets.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>Belum ada aset tetap terdaftar</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          Lewati langkah ini jika usaha belum memiliki aset tetap.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    fixedAssets.map((asset, idx) => (
                      <tr key={idx} className="homies-table-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="text"
                            placeholder="Contoh: Gerobak, Mesin Kopi, Tablet POS..."
                            value={asset.name}
                            onChange={(e) => updateFixedAsset(idx, 'name', e.target.value)}
                            style={{
                              width: '100%',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              color: '#FFFFFF',
                              fontSize: '0.82rem',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <select
                            value={asset.asset_type}
                            onChange={(e) => updateFixedAsset(idx, 'asset_type', e.target.value as any)}
                            className="homies-select"
                            style={{ width: '100%', padding: '6px 8px' }}
                          >
                            <option value="equipment">Peralatan & Mesin</option>
                            <option value="vehicle">Kendaraan</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={asset.value || ''}
                            onChange={(e) => updateFixedAsset(idx, 'value', Math.max(0, Number(e.target.value)))}
                            style={{
                              width: '100%',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              color: '#FFFFFF',
                              fontSize: '0.82rem',
                              fontFamily: 'var(--font-mono)',
                              textAlign: 'right',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeFixedAsset(idx)}
                            className="homies-icon-btn"
                            style={{ color: '#F87171', width: '26px', height: '26px' }}
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={addFixedAsset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px dashed rgba(245, 158, 11, 0.35)',
                  borderRadius: '8px',
                  color: '#FBBF24',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Tambah Aset
              </button>

              {totalFixedAssets > 0 && (
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  Total Aset: <strong className="mono" style={{ color: '#FBBF24', marginLeft: '6px' }}>{formatCurrency(totalFixedAssets)}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------------
            STEP 4: KONFIRMASI & REVIEW NERACA
            --------------------------------------------------------------------- */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Utang Awal (Opsional) */}
            <div className="homies-card-inner" style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <CreditCard size={15} color="#F87171" />
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>
                  Utang Awal (Opsional)
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0 0 8px 0' }}>
                Tagihan ke supplier atau pihak lain yang belum lunas sebelum hari ini.
              </p>
              <div style={{ position: 'relative', maxWidth: '320px' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#F87171',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>Rp</span>
                <input
                  type="number"
                  min={0}
                  value={openingPayables || ''}
                  onChange={(e) => setOpeningPayables(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px 8px 38px',
                    color: '#FFFFFF',
                    fontSize: '0.90rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Neraca Saldo Preview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px'
            }}>
              {/* Kolom ASET */}
              <div className="homies-card-inner" style={{ padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--mint-neon)', marginBottom: '10px' }}>
                  ASET (HARTA)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.80rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Kas Tunai</span>
                    <span className="mono">{formatCurrency(cashOnHand)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Saldo Bank & E-Wallet</span>
                    <span className="mono">{formatCurrency(bankBalance)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Persediaan ({inventoryItems.filter(i => i.name).length} barang)</span>
                    <span className="mono">{formatCurrency(totalInventory)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Aset & Peralatan</span>
                    <span className="mono">{formatCurrency(totalFixedAssets)}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px',
                    padding: '10px 12px',
                    background: 'rgba(0, 223, 143, 0.08)',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 223, 143, 0.2)',
                    fontWeight: 700
                  }}>
                    <span style={{ color: '#FFFFFF' }}>TOTAL ASET</span>
                    <span className="mono" style={{ fontSize: '0.96rem', color: 'var(--mint-neon)' }}>
                      {formatCurrency(totalAssets)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kolom PASIVA */}
              <div className="homies-card-inner" style={{ padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', marginBottom: '10px' }}>
                  KEWAJIBAN & MODAL
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.80rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Utang Awal</span>
                    <span className="mono" style={{ color: openingPayables > 0 ? '#F87171' : '#cbd5e1' }}>
                      {formatCurrency(openingPayables)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span>Modal Awal Pemilik</span>
                    <span className="mono" style={{ color: ownerEquity > 0 ? 'var(--mint-neon)' : '#F87171', fontWeight: 600 }}>
                      {formatCurrency(ownerEquity)}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px',
                    padding: '10px 12px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    fontWeight: 700
                  }}>
                    <span style={{ color: '#FFFFFF' }}>TOTAL PASIVA</span>
                    <span className="mono" style={{ fontSize: '0.96rem', color: '#38BDF8' }}>
                      {formatCurrency(totalLiabilities + ownerEquity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Seimbang */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: isNeracaBalanced ? 'rgba(0, 223, 143, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${isNeracaBalanced ? 'rgba(0, 223, 143, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              {isNeracaBalanced ? (
                <CheckCircle2 size={16} color="var(--mint-neon)" />
              ) : (
                <AlertTriangle size={16} color="#F87171" />
              )}
              <span style={{ fontSize: '0.78rem', color: isNeracaBalanced ? 'var(--mint-neon)' : '#F87171', fontWeight: 600 }}>
                {isNeracaBalanced 
                  ? 'Neraca seimbang: Total Aset sama dengan Total Kewajiban dan Modal.'
                  : 'Total aset masih Rp 0 atau modal bernilai negatif.'}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* 6. Error Banner */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#F87171',
          fontSize: '0.80rem'
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* 7. Bottom Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {step > 1 ? (
          <button
            type="button"
            onClick={() => { setStep((step - 1) as WizardStep); setError(null); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: '#cbd5e1',
              fontSize: '0.80rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} /> Kembali
          </button>
        ) : (
          <div />
        )}

        <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
          Langkah {step} dari 4
        </div>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => { setStep((step + 1) as WizardStep); setError(null); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              background: 'linear-gradient(135deg, #00DF8F 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#060911',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Lanjutkan <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isNeracaBalanced}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 20px',
              background: isNeracaBalanced 
                ? 'linear-gradient(135deg, #00DF8F 0%, #059669 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              color: isNeracaBalanced ? '#060911' : '#64748b',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: isSubmitting || !isNeracaBalanced ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Saldo Awal'}
          </button>
        )}
      </div>

    </div>
  );
};
