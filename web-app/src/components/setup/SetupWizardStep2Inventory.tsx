/**
 * FINA-ENTERPRISE: Step 2 — Bahan & Alat Usaha
 * 
 * Modular Clean Architecture:
 * - SetupStep2CashBar: Alokasi kas & budget counter.
 * - SetupStep2AIAssistant: Asisten Gemini LLM & Quick Chips.
 * - SetupStep2ItemsTable: Tabel bahan/alat & kalkulator anti-rugi.
 * - SetupStep2FooterSummary: Ringkasan omzet dan laba kotor.
 */

import React, { useState, useMemo } from 'react';
import type { InventoryItemPayload, FinishedProductPayload } from '../../services/types';
import { SetupStep2CashBar } from './step2/SetupStep2CashBar';
import { SetupStep2AIAssistant } from './step2/SetupStep2AIAssistant';
import { SetupStep2ItemsTable } from './step2/SetupStep2ItemsTable';
import { SetupStep2FooterSummary } from './step2/SetupStep2FooterSummary';

interface SetupWizardStep2InventoryProps {
  inventoryItems: InventoryItemPayload[];
  updateInventoryItem: (index: number, field: keyof InventoryItemPayload, val: any) => void;
  removeInventoryItem: (index: number) => void;
  addInventoryItem: () => void;
  addPresetInventory: (type: 'warung' | 'retail') => void;
  totalInventory: number;
  availableCash?: number;
  deductFromCash?: boolean;
  setDeductFromCash?: (val: boolean) => void;
  onApplyAISupplies?: (items: InventoryItemPayload[], finishedProducts?: FinishedProductPayload[]) => void;
  finishedProducts?: FinishedProductPayload[];
}

export const SetupWizardStep2Inventory: React.FC<SetupWizardStep2InventoryProps> = ({
  inventoryItems,
  updateInventoryItem,
  removeInventoryItem,
  addInventoryItem,
  addPresetInventory,
  totalInventory,
  availableCash = 0,
  deductFromCash = true,
  setDeductFromCash,
  onApplyAISupplies,
  finishedProducts = [],
}) => {
  const [targetMargin, setTargetMargin] = useState<number>(40);

  // Terapkan rekomendasi AI ke daftar item
  const handleApplyAIRecommendation = (
    mappedItems: InventoryItemPayload[],
    replaceExisting: boolean,
    finished?: FinishedProductPayload[]
  ) => {
    if (!onApplyAISupplies) return;
    if (replaceExisting) {
      onApplyAISupplies(mappedItems, finished);
    } else {
      onApplyAISupplies([...inventoryItems, ...mappedItems], finished);
    }
  };

  // Terapkan margin persentase otomatis ke seluruh bahan baku (bukan alat)
  const handleApplyAutoMarginGlobal = (marginPct: number) => {
    inventoryItems.forEach((item, idx) => {
      const isEquipment =
        item.category.toLowerCase().includes('peralatan') ||
        item.category.toLowerCase().includes('mesin') ||
        item.category.toLowerCase().includes('alat');
      if (!isEquipment && item.unit_cost > 0) {
        const calculatedPrice = Math.ceil((item.unit_cost / (1 - marginPct / 100)) / 500) * 500;
        updateInventoryItem(idx, 'selling_price', calculatedPrice);
      }
    });
  };

  // Kalkulasi Finansial (Memisahkan Bahan Baku vs Alat Kerja)
  const financialStats = useMemo(() => {
    let materialCost = 0;
    let equipmentCost = 0;
    let materialRevenue = 0;

    inventoryItems.forEach(item => {
      const isEquipment =
        item.category.toLowerCase().includes('peralatan') ||
        item.category.toLowerCase().includes('mesin') ||
        item.category.toLowerCase().includes('alat');
      const itemCost = (item.quantity || 0) * (item.unit_cost || 0);

      if (isEquipment) {
        equipmentCost += itemCost;
      } else {
        materialCost += itemCost;
        if (item.selling_price > 0) {
          materialRevenue += (item.quantity || 0) * item.selling_price;
        }
      }
    });

    const materialGrossProfit = Math.max(0, materialRevenue - materialCost);
    const materialMargin = materialRevenue > 0 ? Math.round((materialGrossProfit / materialRevenue) * 100) : 0;

    return {
      materialCost,
      equipmentCost,
      totalCost: materialCost + equipmentCost,
      materialRevenue,
      materialGrossProfit,
      materialMargin,
    };
  }, [inventoryItems]);

  const remainingCash = availableCash - (deductFromCash ? totalInventory : 0);
  const isOverBudget = deductFromCash && totalInventory > availableCash && availableCash > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Bar Alokasi Kas Modal */}
      <SetupStep2CashBar
        availableCash={availableCash}
        totalInventory={totalInventory}
        remainingCash={remainingCash}
        isOverBudget={isOverBudget}
        deductFromCash={deductFromCash}
        setDeductFromCash={setDeductFromCash}
      />

      {/* 2. Asisten AI Kebutuhan Usaha */}
      <SetupStep2AIAssistant
        availableCash={availableCash}
        targetMargin={targetMargin}
        setTargetMargin={setTargetMargin}
        onApplyRecommendation={handleApplyAIRecommendation}
      />

      {/* Indikator Katalog Produk Siap Jual di POS Kasir */}
      {finishedProducts && finishedProducts.length > 0 && (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '0.74rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.90rem' }}>🏷️</span>
            <div>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                {finishedProducts.length} Produk Jadi Siap Jual
              </span>
              <span style={{ color: '#94a3b8', marginLeft: '6px' }}>
                akan otomatis aktif di fitur Kasir POS: {finishedProducts.slice(0, 3).map(f => f.name).join(', ')}{finishedProducts.length > 3 ? '...' : ''}
              </span>
            </div>
          </div>
          <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.70rem' }}>
            Etalase POS Otomatis Sesuai
          </span>
        </div>
      )}

      {/* 3. Toolbar & Tabel Daftar Bahan & Alat Usaha */}
      <SetupStep2ItemsTable
        inventoryItems={inventoryItems}
        updateInventoryItem={updateInventoryItem}
        removeInventoryItem={removeInventoryItem}
        onApplyAutoMargin={handleApplyAutoMarginGlobal}
        onAddPreset={addPresetInventory}
      />

      {/* 4. Footer Summary Finansial */}
      <SetupStep2FooterSummary
        onAddItem={addInventoryItem}
        financialStats={financialStats}
      />
    </div>
  );
};
