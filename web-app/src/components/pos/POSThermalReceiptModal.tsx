import React from 'react';
import { 
  Printer, 
  Share2, 
  Layers 
} from 'lucide-react';
import type { POSReceipt } from '../../types';

interface POSThermalReceiptModalProps {
  receipt: POSReceipt | null;
  onClose: () => void;
  onNavigateToLedger?: () => void;
}

export const POSThermalReceiptModal: React.FC<POSThermalReceiptModalProps> = ({
  receipt,
  onClose,
  onNavigateToLedger
}) => {
  if (!receipt) return null;

  const handleShareWhatsApp = () => {
    if (receipt.customer_phone) {
      const text = encodeURIComponent(
        `Halo ${receipt.customer_name}, terima kasih telah berbelanja di ${receipt.tenant_name}. Total belanja: Rp ${receipt.grand_total.toLocaleString('id-ID')}. No. Struk: ${receipt.receipt_number}.`
      );
      window.open(`https://wa.me/${receipt.customer_phone.replace(/\D/g, '')}?text=${text}`, '_blank');
    } else {
      alert("Nomor WhatsApp pembeli belum diisi saat transaksi.");
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        color: '#1e293b',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        fontFamily: 'monospace',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Konten Kertas Termal Struk 80mm */}
        <div style={{ padding: '24px', fontSize: '0.8rem', lineHeight: 1.4 }}>
          {/* Header Toko */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
              {receipt.tenant_name}
            </h2>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              FINA ENTERPRISE POS CASSETTE
            </div>
          </div>

          {/* Info Transaksi */}
          <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '12px' }}>
            <div>No. Struk: <strong>{receipt.receipt_number}</strong></div>
            <div>Tanggal  : {receipt.transaction_date}</div>
            <div>Kasir    : {receipt.cashier_name}</div>
            <div>Pembeli  : {receipt.customer_name}</div>
          </div>

          {/* Daftar Barang */}
          <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '8px 0', marginBottom: '12px' }}>
            {receipt.items.map((it, idx) => (
              <div key={idx} style={{ marginBottom: '6px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.product_name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>{it.quantity} x Rp {it.unit_price.toLocaleString('id-ID')}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Rp {it.subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Rincian Finansial */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>Rp {receipt.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0891b2' }}>
              <span>Est. PPh Final PP 55 (0.5%):</span>
              <span>Rp {receipt.tax_pp55_estimated.toLocaleString('id-ID')}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 900,
              fontSize: '0.95rem',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '6px',
              marginTop: '4px'
            }}>
              <span>TOTAL:</span>
              <span>Rp {receipt.grand_total.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Bayar ({receipt.payment_method}):</span>
              <span>Rp {receipt.cash_tendered.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Kembalian:</span>
              <span>Rp {receipt.change_amount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Jejak Kriptografis SAK EMKM Double-Entry */}
          <div style={{
            marginTop: '14px',
            paddingTop: '10px',
            borderTop: '1px dashed #cbd5e1',
            fontSize: '0.66rem',
            color: '#64748b',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 700, color: '#059669', marginBottom: '2px' }}>
              ✓ AUTO-POSTED SAK EMKM DOUBLE-ENTRY
            </div>
            <div>No. Jurnal: {receipt.journal_entry_number}</div>
            <div>Debet: 1101 (Kasir) | Kredit: 4101 (Penjualan)</div>
            <div style={{ wordBreak: 'break-all', marginTop: '4px', fontSize: '0.58rem' }}>
              Hash: {receipt.audit_merkle_hash.substring(0, 36)}...
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.68rem', color: '#94a3b8' }}>
              Terima kasih atas kunjungan Anda!
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 16px',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              flex: 1,
              padding: '8px',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Printer size={14} />
            <span>Cetak</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            style={{
              flex: 1,
              padding: '8px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Share2 size={14} />
            <span>WhatsApp</span>
          </button>

          {onNavigateToLedger && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToLedger();
              }}
              style={{
                padding: '8px 10px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Layers size={14} />
              <span>Jurnal SAK</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 12px',
              background: '#e2e8f0',
              color: '#475569',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
