import React from 'react';
import { Scan, X, Upload, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { ARDunningInvoice, VerifyTransferProofResponse } from '../../types';
import { formatCurrency, maskCustomerName } from '../../utils';

interface DunningVerifyTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetInvoice: ARDunningInvoice | null;
  selectedProofFile: File | null;
  proofPreviewUrl: string | null;
  onProofFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVerify: () => void;
  isVerifying: boolean;
  verificationResult: VerifyTransferProofResponse | null;
  isPiiMasked: boolean;
}

export const DunningVerifyTransferModal: React.FC<DunningVerifyTransferModalProps> = ({
  isOpen,
  onClose,
  targetInvoice,
  selectedProofFile,
  proofPreviewUrl,
  onProofFileChange,
  onVerify,
  isVerifying,
  verificationResult,
  isPiiMasked
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scan size={20} color="var(--mint-neon)" />
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>
                Verifikasi Bukti Transfer AI (Anti-Struk Palsu)
              </h3>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                Opsi 3: Forensik Piksel ELA + Gemini Vision Mutasi Bank
              </span>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={onClose}
            style={{ padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Target Invoice Card */}
        {targetInvoice && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '0.78rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>No Invoice:</span>
              <strong style={{ color: '#ffffff' }}>{targetInvoice.invoiceNumber}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Pelanggan:</span>
              <strong style={{ color: '#ffffff' }}>{maskCustomerName(targetInvoice.customerName, isPiiMasked)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Total Tagihan:</span>
              <strong className="mono" style={{ color: 'var(--emerald-400)', fontSize: '0.92rem' }}>
                {formatCurrency(targetInvoice.amount)}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Akun Tujuan SAK EMKM:</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>1102 (Bank Giro/QRIS)</span>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
            Unggah Screenshot Bukti Transfer m-Banking (BCA / Mandiri / BRI / E-Wallet):
          </label>
          
          <div style={{
            border: '2px dashed var(--border-medium)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <input 
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onProofFileChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%'
              }}
            />
            {proofPreviewUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <img 
                  src={proofPreviewUrl} 
                  alt="Preview Bukti Transfer" 
                  style={{ maxHeight: '180px', borderRadius: '6px', objectFit: 'contain', border: '1px solid rgba(255,255,255,0.1)' }} 
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--mint-neon)' }}>
                  {selectedProofFile?.name} (Klik untuk ganti file)
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Upload size={32} color="var(--mint-neon)" />
                <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600 }}>
                  Pilih atau Seret Gambar Bukti Transfer ke Sini
                </span>
                <span style={{ fontSize: '0.70rem' }}>
                  Mendukung JPEG, PNG, WebP (Tangkapan Layar HP Asli)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tombol Eksekusi AI Scan */}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selectedProofFile || isVerifying}
          onClick={onVerify}
          style={{
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, var(--mint-neon), var(--cyan-600))',
            color: '#000000',
            fontWeight: 800,
            fontSize: '0.88rem'
          }}
        >
          {isVerifying ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>AI ELA Matrix & Gemini Vision Sedang Memindai...</span>
            </>
          ) : (
            <>
              <Scan size={16} />
              <span>Jalankan Verifikasi Keaslian & Selesaikan Invoice</span>
            </>
          )}
        </button>

        {/* Hasil Analisis Forensik AI */}
        {verificationResult && (
          <div style={{
            background: verificationResult.is_authentic 
              ? 'rgba(16, 185, 129, 0.1)' 
              : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${verificationResult.is_authentic ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {verificationResult.is_authentic ? (
                  <CheckCircle2 size={18} color="var(--emerald-400)" />
                ) : (
                  <ShieldAlert size={18} color="var(--rose-400)" />
                )}
                <strong style={{ fontSize: '0.88rem', color: verificationResult.is_authentic ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
                  {verificationResult.is_authentic ? 'BUKTI TRANSFER TERVERIFIKASI SAH' : 'PERINGATAN: STRUK PALSU / MANIPULASI DITOLAK'}
                </strong>
              </div>
              <span className={`badge ${verificationResult.is_authentic ? 'badge-emerald' : 'badge-rose'}`}>
                ELA: {verificationResult.ela_integrity_score} / 100
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.4 }}>
              {verificationResult.message}
            </p>

            {verificationResult.tamper_details && (
              <div style={{ fontSize: '0.74rem', color: 'var(--rose-400)', background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px' }}>
                Detail Anomali: {verificationResult.tamper_details}
              </div>
            )}

            {/* Rincian Entitas Terdeteksi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '0.74rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Bank Terdeteksi: </span>
                <strong style={{ color: '#ffffff' }}>{verificationResult.bank_detected}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Pengirim: </span>
                <strong style={{ color: '#ffffff' }}>{verificationResult.sender_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Nominal Valid: </span>
                <strong className="mono" style={{ color: 'var(--emerald-400)' }}>{formatCurrency(verificationResult.amount_verified)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Ref Transaksi: </span>
                <span className="mono" style={{ color: '#94a3b8' }}>{verificationResult.reference_number}</span>
              </div>
            </div>

            {verificationResult.journal_entry_number && (
              <div style={{ fontSize: '0.72rem', color: 'var(--mint-neon)', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                <span>Voucher Jurnal: {verificationResult.journal_entry_number}</span>
                <span className="mono">Merkle Hash: {verificationResult.audit_merkle_hash?.slice(0, 16)}...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
