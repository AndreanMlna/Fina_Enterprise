import React from 'react';
import { Sparkles, Trash2, Plus } from 'lucide-react';
import type { InventoryItemPayload } from '../../services/types';
import { formatCurrency } from '../../utils';

interface SetupWizardStep2InventoryProps {
  inventoryItems: InventoryItemPayload[];
  updateInventoryItem: (index: number, field: keyof InventoryItemPayload, val: any) => void;
  removeInventoryItem: (index: number) => void;
  addInventoryItem: () => void;
  addPresetInventory: (type: 'warung' | 'retail') => void;
  totalInventory: number;
}

export const SetupWizardStep2Inventory: React.FC<SetupWizardStep2InventoryProps> = ({
  inventoryItems,
  updateInventoryItem,
  removeInventoryItem,
  addInventoryItem,
  addPresetInventory,
  totalInventory
}) => {
  return (
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
  );
};
