import React from 'react';
import { Layers } from 'lucide-react';
import type { ReceiptScan } from '../../types';
import { formatCurrency } from '../../utils';

interface ExtendedReceiptScan extends ReceiptScan {
  dbRecordId?: string;
  status?: string;
}

interface ForensicReceiptPreviewProps {
  receipt: ExtendedReceiptScan;
  showElaHeatmap: boolean;
  onToggleElaHeatmap: () => void;
}

export const ForensicReceiptPreview: React.FC<ForensicReceiptPreviewProps> = ({
  receipt,
  showElaHeatmap,
  onToggleElaHeatmap
}) => {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
          Visual Dokumen & Heatmap ELA
        </h3>
        <button 
          className={`btn btn-sm ${showElaHeatmap ? 'btn-danger' : 'btn-secondary'}`}
          onClick={onToggleElaHeatmap}
        >
          <Layers size={14} />
          <span>{showElaHeatmap ? 'Tampilkan Kertas Asli' : 'Aktifkan Mode ELA Forensics'}</span>
        </button>
      </div>

      {/* Simulasi Kertas Termal Dokumen */}
      <div style={{
        background: showElaHeatmap ? '#050209' : '#ffffff',
        color: showElaHeatmap ? '#ec4899' : '#0f172a',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.82rem',
        border: showElaHeatmap ? '2px dashed #f43f5e' : '1px solid #cbd5e1',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        position: 'relative',
        transition: 'all 0.3s ease'
      }}>
        {/* Header Struk */}
        <div style={{ textAlign: 'center', borderBottom: `1px dashed ${showElaHeatmap ? '#ec4899' : '#94a3b8'}`, paddingBottom: '12px', marginBottom: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{receipt.merchantName}</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>No: {receipt.id} • Tgl: {receipt.date}</div>
        </div>

        {/* Rincian Barang Belanjaan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {receipt.items.map((it, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{it.name} x{it.qty}</span>
              <span>{formatCurrency(it.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Total Belanja */}
        <div style={{ borderTop: `1px dashed ${showElaHeatmap ? '#ec4899' : '#94a3b8'}`, paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
            <span>TOTAL:</span>
            <span style={{ 
              background: showElaHeatmap && receipt.isTampered ? '#f43f5e' : 'transparent',
              color: showElaHeatmap && receipt.isTampered ? '#ffffff' : 'inherit',
              padding: showElaHeatmap && receipt.isTampered ? '2px 6px' : '0',
              borderRadius: '4px'
            }}>
              {formatCurrency(receipt.total)}
            </span>
          </div>
        </div>

        {showElaHeatmap && receipt.isTampered && (
          <div style={{
            position: 'absolute',
            bottom: '18px',
            right: '18px',
            background: 'rgba(244, 63, 94, 0.9)',
            color: '#ffffff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.68rem',
            fontWeight: 700
          }}>
            HIGH FREQ RESIDUAL NOISE DETECTED
          </div>
        )}
      </div>
    </div>
  );
};
