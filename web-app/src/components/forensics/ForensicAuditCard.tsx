import React from 'react';
import { Sparkles, ShieldAlert } from 'lucide-react';
import type { ReceiptScan } from '../../types';

interface ExtendedReceiptScan extends ReceiptScan {
  dbRecordId?: string;
  status?: string;
}

interface ForensicAuditCardProps {
  receipt: ExtendedReceiptScan;
  isPosting: boolean;
  onPostToLedger: () => void;
}

export const ForensicAuditCard: React.FC<ForensicAuditCardProps> = ({
  receipt,
  isPosting,
  onPostToLedger
}) => {
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
          Hasil Audit Digital Forensik
        </h3>
        <span className={`badge ${receipt.isTampered ? 'badge-rose' : 'badge-emerald'}`}>
          {receipt.isTampered ? 'DOKUMEN TIDAK VALID / MANIPULASI' : 'DOKUMEN ASLI TERVERIFIKASI'}
        </span>
      </div>

      {/* Skor Integritas ELA */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Skor Integritas Piksel (ELA Score):</div>
          <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: receipt.isTampered ? 'var(--rose-400)' : 'var(--emerald-400)' }}>
            {receipt.elaIntegrityScore} / 100
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className={`badge ${receipt.qrVerified ? 'badge-emerald' : 'badge-rose'}`}>
            {receipt.qrVerified ? '✓ QRIS Merchant Sah' : '✗ QR Anomali'}
          </span>
        </div>
      </div>

      {/* Detail Anomali jika Tampered */}
      {receipt.isTampered && receipt.tamperingDetails && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          fontSize: '0.82rem',
          color: 'var(--rose-400)',
          display: 'flex',
          gap: '10px'
        }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '2px' }}>Peringatan Pemalsuan Dokumen:</strong>
            {receipt.tamperingDetails}
          </div>
        </div>
      )}

      {/* Status SAK EMKM */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        padding: '14px',
        fontSize: '0.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Status Pembukuan:</span>
          <span style={{ fontWeight: 600, color: receipt.status === 'POSTED_TO_LEDGER' ? 'var(--emerald-400)' : '#ffffff' }}>
            {receipt.status === 'POSTED_TO_LEDGER' ? 'Sudah Tercatat di SAK EMKM' : 'Menunggu Verifikasi Buku Besar'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Audit Merkle Hash:</span>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {receipt.id.slice(0, 14)}...
          </span>
        </div>
      </div>

      {/* Tombol Bukukan ke Ledger */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
        <button 
          className="btn btn-primary"
          disabled={receipt.isTampered || receipt.status === 'POSTED_TO_LEDGER' || isPosting}
          onClick={onPostToLedger}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Sparkles size={15} />
          <span>
            {isPosting ? 'Membukukan...' : receipt.isTampered ? 'Ditolak Otomatis oleh Sistem' : receipt.status === 'POSTED_TO_LEDGER' ? 'Sudah Terverifikasi di Buku Besar' : 'Bukukan ke Buku Besar SAK EMKM'}
          </span>
        </button>
      </div>
    </div>
  );
};
