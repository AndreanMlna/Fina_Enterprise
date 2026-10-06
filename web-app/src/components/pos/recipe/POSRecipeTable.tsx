/**
 * FINA-ENTERPRISE: POSRecipeTable
 * Sub-komponen Tabel Komposisi Bahan Baku (Bill of Materials / BOM)
 * Single Responsibility: Presentasi dan manipulasi baris bahan baku resep
 */

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { POSProduct } from '../../../types';
import type { RecipeItem } from '../../../services/types';
import { formatCurrency } from '../../../utils';

interface POSRecipeTableProps {
  items: RecipeItem[];
  availableMaterials?: POSProduct[];
  onAddItem: () => void;
  onUpdateItem: (index: number, field: keyof RecipeItem, value: any) => void;
  onRemoveItem: (index: number) => void;
}

export const POSRecipeTable: React.FC<POSRecipeTableProps> = ({
  items,
  availableMaterials = [],
  onAddItem,
  onUpdateItem,
  onRemoveItem
}) => {
  const handleMaterialNameChange = (idx: number, newName: string) => {
    onUpdateItem(idx, 'material_name', newName);
    if (availableMaterials && availableMaterials.length > 0) {
      const matched = availableMaterials.find(m => m.name.toLowerCase() === newName.trim().toLowerCase());
      if (matched) {
        if (matched.cogs && matched.cogs > 0) {
          onUpdateItem(idx, 'cost_per_unit', matched.cogs);
        }
        if (matched.unit) {
          onUpdateItem(idx, 'unit', matched.unit);
        }
        if (matched.id) {
          onUpdateItem(idx, 'material_id', matched.id);
        }
      }
    }
  };
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
                      list="recipe-available-materials"
                      value={item.material_name}
                      onChange={(e) => handleMaterialNameChange(idx, e.target.value)}
                      placeholder="Pilih / ketik nama bahan baku..."
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
                      type="text"
                      inputMode="decimal"
                      value={item.quantity_required ? String(item.quantity_required) : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                        if (val === '') {
                          onUpdateItem(idx, 'quantity_required', 0);
                          return;
                        }
                        const parts = val.split('.');
                        const cleaned = parts.length > 2 
                          ? `${parts[0]}.${parts.slice(1).join('')}` 
                          : val;
                        const sanitized = cleaned.replace(/^0+(?=\d)/, '');
                        onUpdateItem(idx, 'quantity_required', parseFloat(sanitized) || 0);
                      }}
                      placeholder="1"
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
                      <option value="Pack">Pack</option>
                      <option value="Lembar">Lembar</option>
                      <option value="Porsi">Porsi</option>
                    </select>
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.cost_per_unit ? String(item.cost_per_unit) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        if (raw === '') {
                          onUpdateItem(idx, 'cost_per_unit', 0);
                          return;
                        }
                        const cleaned = raw.replace(/^0+(?=\d)/, '');
                        onUpdateItem(idx, 'cost_per_unit', cleaned === '' ? 0 : parseInt(cleaned, 10));
                      }}
                      placeholder="0"
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

      {availableMaterials && availableMaterials.length > 0 && (
        <datalist id="recipe-available-materials">
          {availableMaterials.map((mat) => (
            <option
              key={mat.id}
              value={mat.name}
            >
              {mat.name} ({mat.unit || 'Kg'} - {formatCurrency(mat.cogs || 0)})
            </option>
          ))}
        </datalist>
      )}
    </div>
  );
};
