import React from 'react';
import { Phone, CheckCheck, Send, Scan, CreditCard } from 'lucide-react';
import type { ARDunningInvoice } from '../../types';
import { maskCustomerName, maskPhone } from '../../utils';

interface DunningWhatsAppPreviewProps {
  selectedInvoice: ARDunningInvoice | null;
  selectedTone: 'FRIENDLY' | 'REMINDER' | 'FORMAL_URGENT';
  onSelectTone: (tone: 'FRIENDLY' | 'REMINDER' | 'FORMAL_URGENT') => void;
  dunningMessage: string;
  isSending: boolean;
  sendSuccessMsg: string | null;
  onSendWhatsApp: () => void;
  onOpenVerifyModal: (inv: ARDunningInvoice) => void;
  onPayInvoice: () => void;
  isPaying: boolean;
  isPiiMasked: boolean;
}

export const DunningWhatsAppPreview: React.FC<DunningWhatsAppPreviewProps> = ({
  selectedInvoice,
  selectedTone,
  onSelectTone,
  dunningMessage,
  isSending,
  sendSuccessMsg,
  onSendWhatsApp,
  onOpenVerifyModal,
  onPayInvoice,
  isPaying,
  isPiiMasked
}) => {
  const maskCustomer = (name: string) => maskCustomerName(name, isPiiMasked);
  const maskPhoneNumber = (phone: string) => maskPhone(phone, isPiiMasked);

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px', alignSelf: 'start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
          Simulator Pesan Tagihan WhatsApp
        </h3>

        {/* Tombol Pelunasan Cepat jika belum lunas */}
        {selectedInvoice && selectedInvoice.status !== 'PAID' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => onOpenVerifyModal(selectedInvoice)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'linear-gradient(135deg, var(--mint-neon), var(--cyan-600))',
                color: '#000000',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '6px 10px'
              }}
              title="Opsi 3: Verifikasi bukti transfer m-Banking menggunakan AI Vision & ELA"
            >
              <Scan size={13} />
              <span>Verifikasi Transfer AI</span>
            </button>

            <button 
              className="btn btn-sm btn-outline"
              onClick={onPayInvoice}
              disabled={isPaying}
              title="Tandai invoice lunas manual dan bukukan otomatis ke SAK EMKM"
              style={{ borderColor: 'var(--emerald-500)', color: 'var(--emerald-400)', fontSize: '0.72rem', padding: '6px 8px' }}
            >
              <CreditCard size={13} />
              <span>{isPaying ? '...' : 'Bayar Tunai'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tone Selector */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['FRIENDLY', 'REMINDER', 'FORMAL_URGENT'] as const).map((tone) => (
          <button
            key={tone}
            onClick={() => onSelectTone(tone)}
            className={`btn btn-sm ${selectedTone === tone ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '0.72rem', padding: '6px 4px' }}
          >
            {tone === 'FRIENDLY' ? 'Santun (H-3)' : tone === 'REMINDER' ? 'Mengingatkan' : 'Somasi Formal'}
          </button>
        ))}
      </div>

      {/* WhatsApp Interface Mockup */}
      <div style={{
        background: '#0b141a',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Top Bar WhatsApp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.82rem' }}>
            WA
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
              {selectedInvoice ? maskCustomer(selectedInvoice.customerName) : 'Tidak ada invoice terpilih'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--emerald-400)' }}>
              Online • WhatsApp Business Official
            </div>
          </div>
          <Phone size={16} color="var(--text-muted)" />
        </div>

        {/* Chat Bubble */}
        <div style={{
          background: '#005c4b',
          color: '#e9edef',
          padding: '12px 14px',
          borderRadius: '8px 8px 0px 8px',
          maxWidth: '92%',
          alignSelf: 'flex-end',
          margin: '16px 0',
          fontSize: '0.82rem',
          lineHeight: 1.45,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          {dunningMessage || 'Pilih invoice di tabel sebelah kiri untuk mempratinjau draft penagihan otomatis.'}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>
            <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            <CheckCheck size={14} color="#53bdeb" />
          </div>
        </div>

        {sendSuccessMsg && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '4px',
            fontSize: '0.74rem',
            color: 'var(--emerald-400)',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            ✓ {sendSuccessMsg}
          </div>
        )}

        {/* Send Trigger */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Target: {selectedInvoice ? maskPhoneNumber(selectedInvoice.customerPhone) : '-'}
          </span>
          <button 
            className="btn btn-primary"
            onClick={onSendWhatsApp}
            disabled={isSending || !selectedInvoice || selectedInvoice.status === 'PAID'}
          >
            <Send size={15} />
            <span>{isSending ? 'Mengirim...' : selectedInvoice?.status === 'PAID' ? 'Tagihan Telah Lunas' : 'Kirim Pesan WhatsApp Otomatis'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
