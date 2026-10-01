import React from 'react';
import { ShieldCheck, X, Upload, RefreshCw, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ARDunningInvoice, VerifyTransferProofResponse } from '../../types';
import { formatCurrency } from '../../utils';

interface ForensicTransferVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: ARDunningInvoice[];
  selectedInvoiceId: string;
  onSelectInvoiceId: (id: string) => void;
  transferFile: File | null;
  transferPreviewUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVerify: () => void;
  isVerifying: boolean;
  transferResult: VerifyTransferProofResponse | null;
}

export const ForensicTransferVerificationModal: React.FC<ForensicTransferVerificationModalProps> = ({
  isOpen,
  onClose,
  invoices,
  selectedInvoiceId,
  onSelectInvoiceId,
  transferFile,
  transferPreviewUrl,
  onFileChange,
  onVerify,
  isVerifying,
  transferResult
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card, #111827)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--cyan-400)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff' }}>
                Forensik Bukti Transfer m-Banking (AI Vision)
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Deteksi keaslian screenshot BCA Mobile / Livin' Mandiri / BRImo dengan Error Level Analysis (ELA) Matrix. Anti-struk palsu & auto-settle invoice piutang.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Target Invoice Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Pilih Tagihan / Invoice yang Divalidasi:
          </label>
          <select
            value={selectedInvoiceId}
            onChange={(e) => onSelectInvoiceId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-medium, #374151)',
              color: '#ffffff',
              fontSize: '0.86rem'
            }}
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id} style={{ background: '#111827', color: '#fff' }}>
                {inv.invoiceNumber} — {inv.customerName} ({formatCurrency(inv.amount)}) [{inv.status}]
              </option>
            ))}
          </select>
        </div>

        {/* Upload Area */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Unggah Screenshot Bukti Transfer:
          </label>
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            border: '2px dashed rgba(56, 189, 248, 0.4)',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.03)',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}>
            <Upload size={28} color="var(--cyan-400)" style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 500 }}>
              {transferFile ? transferFile.name : 'Klik untuk pilih foto struk / screenshot transfer'}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Format: PNG, JPG, JPEG (Mendukung BCA Mobile, Livin Mandiri, BRImo, Seabank, dll)
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
          </label>
        </div>

        {/* Preview image */}
        {transferPreviewUrl && (
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <img
              src={transferPreviewUrl}
              alt="Screenshot Bukti Transfer"
              style={{
                maxHeight: '160px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            />
          </div>
        )}

        {/* Action Verify Button */}
        <button
          onClick={onVerify}
          disabled={isVerifying || !transferFile || !selectedInvoiceId}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            background: isVerifying ? 'rgba(56, 189, 248, 0.3)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: isVerifying || !transferFile ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          {isVerifying ? (
            <>
              <RefreshCw size={16} className="spin-anim" />
              <span>Memeriksa ELA Matrix & AI Vision...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Verifikasi Keaslian Bukti Transfer</span>
            </>
          )}
        </button>

        {/* Diagnostic Result */}
        {transferResult && (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: transferResult.is_authentic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${transferResult.is_authentic ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {transferResult.is_authentic ? (
                <CheckCircle size={20} color="var(--emerald-400)" />
              ) : (
                <AlertTriangle size={20} color="var(--rose-400)" />
              )}
              <span style={{
                fontWeight: 600,
                fontSize: '0.95rem',
                color: transferResult.is_authentic ? 'var(--emerald-400)' : 'var(--rose-400)'
              }}>
                {transferResult.is_authentic ? 'BUKTI TRANSFER TERVERIFIKASI ASLI' : 'TERDETEKSI ANOMALI / STRUK PALSU'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.8rem', marginTop: '10px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Bank Terdeteksi:</span>
                <strong style={{ color: '#ffffff' }}>{transferResult.bank_detected}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Pengirim / Rekening:</span>
                <strong style={{ color: '#ffffff' }}>{transferResult.sender_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Nominal Valid:</span>
                <strong style={{ color: 'var(--emerald-400)', fontSize: '0.9rem' }}>
                  {formatCurrency(transferResult.amount_verified)}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Integritas ELA Matrix:</span>
                <strong style={{ color: transferResult.ela_integrity_score >= 80 ? 'var(--emerald-400)' : 'var(--amber-400)' }}>
                  {transferResult.ela_integrity_score}%
                </strong>
              </div>
            </div>

            {transferResult.tamper_details && (
              <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--amber-300)', background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '6px' }}>
                <strong>Catatan Forensik:</strong> {transferResult.tamper_details}
              </div>
            )}

            {transferResult.is_authentic && transferResult.journal_entry_number && (
              <div style={{
                marginTop: '12px',
                padding: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.78rem'
              }}>
                <div style={{ color: 'var(--emerald-400)', fontWeight: 600, marginBottom: '4px' }}>
                  Otomatis Dibukukan ke SAK EMKM:
                </div>
                <div style={{ color: '#ffffff' }}>
                  <strong>DEBET:</strong> 1102 (Bank Giro / Rekening Toko) +{formatCurrency(transferResult.amount_verified)}
                </div>
                <div style={{ color: '#ffffff' }}>
                  <strong>KREDIT:</strong> 1103 (Piutang Usaha) +{formatCurrency(transferResult.amount_verified)}
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  No. Voucher: <span style={{ fontFamily: 'monospace', color: 'var(--cyan-400)' }}>{transferResult.journal_entry_number}</span> | Status Tagihan: <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>LUNAS (PAID)</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
