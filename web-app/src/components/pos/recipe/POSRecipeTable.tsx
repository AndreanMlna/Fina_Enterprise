/**
 * FINA-ENTERPRISE: POSRecipeTable
 * Sub-komponen Tabel Komposisi Bahan Baku (Bill of Materials / BOM)
 * Single Responsibility: Presentasi dan manipulasi baris bahan baku resep
 */

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { RecipeItem } from '../../../services/types';
import { formatCurrency } from '../../../utils';

interface POSRecipeTableProps {
  items: RecipeItem[];
  onAddItem: () => void;
  onUpdateItem: (index: number, field: keyof RecipeItem, value: any) => void;
  onRemoveItem: (index: number) => void;
}

export const POSRecipeTable: React.FC<POSRecipeTableProps> = ({
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.90rem', color: '#F1F5F9', fontWeight: 600 }}>
            Daftar Bahan Baku per 1 Pcs / Porsi
          </h4>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748B' }}>
            HPP otomatis dihitung ulang saat stok bahan di-restock (Moving Weighted Average).
          </p>
        </div>
        <button
          type="button"
          onClick={onAddItem}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(0, 223, 143, 0.12)',
            border: '1px solid rgba(0, 223, 143, 0.3)',
            color: 'var(--mint-neon)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={14} />
          <span>Tambah Bahan</span>
        </button>
      </div>

      {/* Table BOM */}
      <div style={{
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        background: 'rgba(15, 23, 42, 0.4)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94A3B8', fontWeight: 600 }}>Nama Bahan</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94A3B8', fontWeight: 600, width: '110px' }}>Takaran / Pcs</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94A3B8', fontWeight: 600, width: '90px' }}>Satuan</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94A3B8', fontWeight: 600, width: '130px' }}>Harga / Satuan</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94A3B8', fontWeight: 600, width: '130px' }}>Subtotal Modal</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const subtotal = (Number(item.quantity_required) || 0) * (Number(item.cost_per_unit) || 0);
              return (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      type="text"
                      value={item.material_name}
                      onChange={(e) => onUpdateItem(idx, 'material_name', e.target.value)}
                      placeholder="Misal: Biji Kopi, Tepung, Box Kemasan"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantity_required || ''}
                      onChange={(e) => onUpdateItem(idx, 'quantity_required', parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        textAlign: 'right',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none'
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <select
                      value={item.unit}
                      onChange={(e) => onUpdateItem(idx, 'unit', e.target.value)}
                      style={{
                        width: '100%',
                        background: '#1E293B',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    >
                      <option value="Gram">Gram</option>
                      <option value="Kg">Kg</option>
                      <option value="Ml">Ml</option>
                      <option value="Liter">Liter</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Lembar">Lembar</option>
                      <option value="Porsi">Porsi</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      type="number"
                      min="0"
                      value={item.cost_per_unit || ''}
                      onChange={(e) => onUpdateItem(idx, 'cost_per_unit', parseFloat(e.target.value) || 0)}
                      placeholder="Rp 0"
                      style={{
                        width: '100%',
                        textAlign: 'right',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        color: '#FFFFFF',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none'
                      }}
                    />
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: '#E2E8F0' }}>
                    <span className="mono">{formatCurrency(subtotal)}</span>
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px'
                        }}
                        title="Hapus Bahan"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
