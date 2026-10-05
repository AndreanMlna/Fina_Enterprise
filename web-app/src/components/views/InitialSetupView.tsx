/**
 * FINA-ENTERPRISE: Setup Saldo Awal (Initial Capital Balance)
 * 
 * Pengaturan saldo kas, persediaan barang, dan aset awal usaha.
 * Desain: Dark Glassmorphic, Emerald (#00DF8F), clean, tanpa AI slop.
 * Arsitektur: Modular SRP Decomposition (Components terisolasi di components/setup)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { api } from '../../services/api';
import type { InventoryItemPayload, FixedAssetPayload, SetupStatusResponse, FinishedProductPayload } from '../../services/types';
import type { NavigationTab } from '../../types';
import {
  SetupMonitoringView,
  SetupSummaryPills,
  SetupSuccessScreen,
  SetupWizardStepper,
  SetupWizardStep1CashBank,
  SetupWizardStep2Inventory,
  SetupWizardStep3Assets,
  SetupWizardStep4Confirm,
  SetupWizardNavFooter
} from '../setup';
import type { WizardStep, SetupSuccessData } from '../setup';

interface InitialSetupViewProps {
  onSetupComplete: () => void;
  tenantName?: string;
  onNavigate?: (tab: NavigationTab) => void;
}

export const InitialSetupView: React.FC<InitialSetupViewProps> = ({ onSetupComplete, tenantName, onNavigate }) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [successData, setSuccessData] = useState<SetupSuccessData | null>(null);

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
  const [finishedProducts, setFinishedProducts] = useState<FinishedProductPayload[]>([]);
  const [openingPayables, setOpeningPayables] = useState<number>(0);
  const [deductFromCash, setDeductFromCash] = useState<boolean>(true);

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

  // Real-time Cash & Bank Deduction (Double-Entry Allocation)
  const { effectiveCashOnHand, effectiveBankBalance } = useMemo(() => {
    if (!deductFromCash || totalInventory <= 0) {
      return { effectiveCashOnHand: cashOnHand, effectiveBankBalance: bankBalance };
    }
    let rem = totalInventory;
    let remCash = cashOnHand;
    let remBank = bankBalance;

    if (remCash >= rem) {
      remCash -= rem;
      rem = 0;
    } else {
      rem -= remCash;
      remCash = 0;
      remBank = Math.max(0, remBank - rem);
    }
    return { effectiveCashOnHand: remCash, effectiveBankBalance: remBank };
  }, [deductFromCash, totalInventory, cashOnHand, bankBalance]);

  const totalAssets = effectiveCashOnHand + effectiveBankBalance + totalInventory + totalFixedAssets;
  const totalLiabilities = openingPayables;
  const ownerEquity = totalAssets - totalLiabilities;
  const isNeracaBalanced = totalAssets > 0 && ownerEquity > 0;

  // --- Inventory Handlers ---
  const handleApplyAISupplies = useCallback((items: InventoryItemPayload[], finished?: FinishedProductPayload[]) => {
    setInventoryItems(items);
    if (finished && finished.length > 0) {
      setFinishedProducts(finished);
    }
  }, []);

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
        cash_on_hand: effectiveCashOnHand,
        bank_balance: effectiveBankBalance,
        inventory_items: validInventory,
        fixed_assets: validAssets,
        finished_products: finishedProducts,
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

  // SUCCESS SCREEN
  if (successData) {
    return (
      <SetupSuccessScreen
        successData={successData}
        businessName={businessName}
        onSetupComplete={onSetupComplete}
      />
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

  // ENTERPRISE MONITORING VIEW (Perusahaan yang Sudah Berjalan)
  if (setupStatus?.is_setup_complete) {
    return (
      <SetupMonitoringView
        setupStatus={setupStatus}
        businessName={businessName}
        onNavigate={onNavigate}
        onSetupComplete={onSetupComplete}
      />
    );
  }

  // MAIN WIZARD (Untuk Perusahaan Baru yang Belum Setup)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. Breadcrumb & Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Home</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>/</span>
          <span style={{ color: '#94a3b8' }}>Setup Perusahaan</span>
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
          Alokasikan modal awal, kebutuhan bahan, dan peralatan usaha.
        </p>
      </div>

      {/* 3. 4-Card Live Summary Pills */}
      <SetupSummaryPills
        cashOnHand={effectiveCashOnHand}
        bankBalance={effectiveBankBalance}
        totalInventory={totalInventory}
        totalFixedAssets={totalFixedAssets}
        ownerEquity={ownerEquity}
      />

      {/* 4. Sleek 4-Step Stepper */}
      <SetupWizardStepper
        step={step}
        onStepClick={(s) => setStep(s)}
      />

      {/* 5. Main Content Card */}
      <div className="homies-card" style={{ padding: '24px', minHeight: '340px' }}>
        
        {/* Step Title Header */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
            {step === 1 && 'Kas & Saldo Bank'}
            {step === 2 && 'Bahan & Alat Usaha'}
            {step === 3 && 'Aset Tetap'}
            {step === 4 && 'Konfirmasi Saldo'}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.80rem', margin: '3px 0 0 0' }}>
            {step === 1 && 'Tentukan saldo uang tunai dan rekening bank untuk modal usaha.'}
            {step === 2 && 'Daftar kebutuhan bahan baku dan alat kerja operasional.'}
            {step === 3 && 'Peralatan besar atau kendaraan yang dimiliki usaha.'}
            {step === 4 && 'Ringkasan neraca pembukaan sebelum dibukukan.'}
          </p>
        </div>

        {/* STEP 1: KAS & BANK */}
        {step === 1 && (
          <SetupWizardStep1CashBank
            cashOnHand={cashOnHand}
            setCashOnHand={setCashOnHand}
            bankBalance={bankBalance}
            setBankBalance={setBankBalance}
          />
        )}

        {/* STEP 2: BAHAN & ALAT USAHA (AI + ANTI-RUGI) */}
        {step === 2 && (
          <SetupWizardStep2Inventory
            inventoryItems={inventoryItems}
            updateInventoryItem={updateInventoryItem}
            removeInventoryItem={removeInventoryItem}
            addInventoryItem={addInventoryItem}
            addPresetInventory={addPresetInventory}
            totalInventory={totalInventory}
            availableCash={cashOnHand + bankBalance}
            deductFromCash={deductFromCash}
            setDeductFromCash={setDeductFromCash}
            onApplyAISupplies={handleApplyAISupplies}
            finishedProducts={finishedProducts}
          />
        )}

        {/* STEP 3: ASET TETAP */}
        {step === 3 && (
          <SetupWizardStep3Assets
            fixedAssets={fixedAssets}
            updateFixedAsset={updateFixedAsset}
            removeFixedAsset={removeFixedAsset}
            addFixedAsset={addFixedAsset}
            addPresetAsset={addPresetAsset}
            totalFixedAssets={totalFixedAssets}
          />
        )}

        {/* STEP 4: KONFIRMASI & REVIEW NERACA */}
        {step === 4 && (
          <SetupWizardStep4Confirm
            openingPayables={openingPayables}
            setOpeningPayables={setOpeningPayables}
            cashOnHand={effectiveCashOnHand}
            bankBalance={effectiveBankBalance}
            inventoryItems={inventoryItems}
            totalInventory={totalInventory}
            totalFixedAssets={totalFixedAssets}
            totalAssets={totalAssets}
            ownerEquity={ownerEquity}
            totalLiabilities={totalLiabilities}
            isNeracaBalanced={isNeracaBalanced}
          />
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
          <span>{error}</span>
        </div>
      )}

      {/* 7. Bottom Navigation */}
      <SetupWizardNavFooter
        step={step}
        setStep={setStep}
        setError={setError}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isNeracaBalanced={isNeracaBalanced}
      />

    </div>
  );
};
