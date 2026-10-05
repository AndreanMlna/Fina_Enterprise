import React from 'react';
import {
  Trash2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Wrench
} from 'lucide-react';
import type { InventoryItemPayload } from '../../../services/types';
import { formatCurrency } from '../../../utils';

interface SetupStep2ItemsTableProps {
  inventoryItems: InventoryItemPayload[];
  updateInventoryItem: (index: number, field: keyof InventoryItemPayload, val: any) => void;
  removeInventoryItem: (index: number) => void;
  onApplyAutoMargin: (marginPct: number) => void;
  onAddPreset: (type: 'warung' | 'retail') => void;
}

export const SetupStep2ItemsTable: React.FC<SetupStep2ItemsTableProps> = ({
  inventoryItems,
  updateInventoryItem,
  removeInventoryItem,
  onApplyAutoMargin,
  onAddPreset
}) => {
  // Helper kalkulasi margin anti-rugi per item
  const calculateMargin = (cost: number, price: number, category: string) => {
    const isEquipment = category.toLowerCase().includes('peralatan') || category.toLowerCase().includes('mesin') || category.toLowerCase().includes('alat');
    if (isEquipment && price === 0) {
      return { status: 'equipment', label: 'Alat Kerja', percent: 0, profit: 0, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.10)' };
    }
    if (cost <= 0) {
      return { status: 'neutral', label: 'Rp 0', percent: 0, profit: 0, color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.04)' };
    }
    if (price <= 0) {
      return { status: 'unset', label: 'Belum Dijual', percent: 0, profit: 0, color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.10)' };
    }

    const profit = price - cost;
    const marginPct = Math.round((profit / price) * 100);

    if (profit < 0) {
      return {
        status: 'loss',
        label: `🚨 Rugi ${formatCurrency(Math.abs(profit))}`,
        percent: marginPct,
        profit,
        color: '#F87171',
        bg: 'rgba(239, 68, 68, 0.15)'
      };
    }
    if (marginPct < 20) {
      return {
        status: 'tight',
        label: `⚠️ Tipis (+${marginPct}%)`,
        percent: marginPct,
        profit,
        color: '#FBBF24',
        bg: 'rgba(251, 191, 36, 0.12)'
      };
    }
    if (marginPct < 50) {
      return {
        status: 'safe',
        label: `✅ Aman (+${marginPct}%)`,
        percent: marginPct,
        profit,
        color: 'var(--mint-neon)',
        bg: 'rgba(0, 223, 143, 0.12)'
      };
    }
    return {
      status: 'high',
      label: `🚀 Untung (+${marginPct}%)`,
      percent: marginPct,
      profit,
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.12)'
    };
  };

  return (
    <>
      {/* TOOLBAR TABEL & QUICK MARGIN ACTIONS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '6px 2px'
        }}
      >
        <div style={{ fontSize: '0.80rem', fontWeight: 600, color: '#FFFFFF' }}>
          Daftar Bahan & Alat ({inventoryItems.length} item)
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.70rem', color: '#94a3b8' }}>Set Margin:</span>
          {[30, 40, 50, 70].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onApplyAutoMargin(m)}
              className="homies-pill-btn"
              style={{ fontSize: '0.68rem', padding: '3px 7px' }}
              title={`Terapkan harga jual +${m}% dari modal bahan`}
            >
              +{m}%
            </button>
          ))}
          <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 2px' }} />
          <button
            type="button"
            onClick={() => onAddPreset('warung')}
            className="homies-pill-btn"
            style={{ fontSize: '0.68rem', padding: '3px 7px' }}
          >
            + Contoh F&B
          </button>
          <button
            type="button"
            onClick={() => onAddPreset('retail')}
            className="homies-pill-btn"
            style={{ fontSize: '0.68rem', padding: '3px 7px' }}
          >
            + Contoh Retail
          </button>
        </div>
      </div>

      {/* TABEL DAFTAR BAHAN & ALAT USAHA */}
      <div
        style={{
          overflowX: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.03)',
                fontSize: '0.72rem',
                color: '#94a3b8'
              }}
            >
              <th style={{ padding: '10px 12px' }}>Nama Bahan / Alat</th>
              <th style={{ padding: '10px 12px', width: '130px' }}>Kategori</th>
              <th style={{ padding: '10px 12px', width: '65px' }}>Qty</th>
              <th style={{ padding: '10px 12px', width: '75px' }}>Satuan</th>
              <th style={{ padding: '10px 12px', width: '115px' }}>Harga Beli</th>
              <th style={{ padding: '10px 12px', width: '115px' }}>Harga Jual</th>
              <th style={{ padding: '10px 12px', width: '130px' }}>Status Margin</th>
              <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right' }}>Total Modal</th>
              <th style={{ padding: '10px 12px', width: '36px' }}></th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    Belum ada bahan atau alat yang dimasukkan
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Gunakan AI Generator di atas atau klik tombol Tambah Item di bawah.
                  </div>
                </td>
              </tr>
            ) : (
              inventoryItems.map((item, idx) => {
                const marginData = calculateMargin(item.unit_cost, item.selling_price, item.category);
                const isEquipment =
                  item.category.toLowerCase().includes('peralatan') ||
                  item.category.toLowerCase().includes('mesin') ||
                  item.category.toLowerCase().includes('alat');

                return (
                  <tr key={idx} className="homies-table-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {/* Nama */}
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="text"
                        placeholder="Nama bahan / alat..."
                        value={item.name}
                        onChange={(e) => updateInventoryItem(idx, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#FFFFFF',
                          fontSize: '0.80rem',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Kategori */}
                    <td style={{ padding: '6px 12px' }}>
                      <select
                        value={item.category}
                        onChange={(e) => updateInventoryItem(idx, 'category', e.target.value)}
                        className="homies-select"
                        style={{ width: '100%', padding: '6px 6px', fontSize: '0.75rem' }}
                      >
                        {['Bahan Baku', 'Peralatan & Mesin', 'Kemasan & Wadah', 'Perlengkapan Usaha', 'Sembako', 'Minuman', 'Makanan', 'Umum'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>

                    {/* Qty */}
                    <td style={{ padding: '6px 12px' }}>
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
                          padding: '6px 4px',
                          color: '#FFFFFF',
                          fontSize: '0.80rem',
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'center',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Satuan */}
                    <td style={{ padding: '6px 12px' }}>
                      <select
                        value={item.unit}
                        onChange={(e) => updateInventoryItem(idx, 'unit', e.target.value)}
                        className="homies-select"
                        style={{ width: '100%', padding: '6px 4px', fontSize: '0.75rem' }}
                      >
                        {['Pcs', 'Kg', 'Liter', 'Dus', 'Pack', 'Box', 'Unit', 'Set', 'Porsi', 'Karung', 'Lusin'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>

                    {/* Harga Beli */}
                    <td style={{ padding: '6px 12px' }}>
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
                          fontSize: '0.80rem',
                          fontFamily: 'var(--font-mono)',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Harga Jual */}
                    <td style={{ padding: '6px 12px' }}>
                      <input
                        type="number"
                        min={0}
                        placeholder={isEquipment ? '0 (Alat)' : '0'}
                        value={item.selling_price || ''}
                        onChange={(e) => updateInventoryItem(idx, 'selling_price', Math.max(0, Number(e.target.value)))}
                        style={{
                          width: '100%',
                          background: marginData.status === 'loss' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          border: marginData.status === 'loss' ? '1px solid #F87171' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: marginData.status === 'loss' ? '#F87171' : '#FFFFFF',
                          fontSize: '0.80rem',
                          fontFamily: 'var(--font-mono)',
                          outline: 'none'
                        }}
                      />
                    </td>

                    {/* Status Margin */}
                    <td style={{ padding: '6px 12px' }}>
                      <div
                        style={{
                          padding: '3px 7px',
                          borderRadius: '4px',
                          background: marginData.bg,
                          color: marginData.color,
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {marginData.status === 'equipment' && <Wrench size={10} />}
                        {marginData.status === 'loss' && <AlertTriangle size={10} />}
                        {marginData.status === 'tight' && <AlertCircle size={10} />}
                        {marginData.status === 'safe' && <CheckCircle2 size={10} />}
                        {marginData.status === 'high' && <TrendingUp size={10} />}
                        {marginData.label}
                      </div>
                    </td>

                    {/* Subtotal */}
                    <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                      <span className="mono" style={{ fontSize: '0.80rem', color: 'var(--mint-neon)', fontWeight: 600 }}>
                        {formatCurrency((item.quantity || 0) * (item.unit_cost || 0))}
                      </span>
                    </td>

                    {/* Hapus */}
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeInventoryItem(idx)}
                        className="homies-icon-btn"
                        style={{ color: '#F87171', width: '24px', height: '24px' }}
                        title="Hapus"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
