import React from 'react';
import { Sparkles, Trash2, Plus } from 'lucide-react';
import type { FixedAssetPayload } from '../../services/types';
import { formatCurrency } from '../../utils';

interface SetupWizardStep3AssetsProps {
  fixedAssets: FixedAssetPayload[];
  updateFixedAsset: (index: number, field: keyof FixedAssetPayload, val: any) => void;
  removeFixedAsset: (index: number) => void;
  addFixedAsset: () => void;
  addPresetAsset: (type: 'pos' | 'operasional') => void;
  totalFixedAssets: number;
}

export const SetupWizardStep3Assets: React.FC<SetupWizardStep3AssetsProps> = ({
  fixedAssets,
  updateFixedAsset,
  removeFixedAsset,
  addFixedAsset,
  addPresetAsset,
  totalFixedAssets
}) => {
  return (
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
  );
};
