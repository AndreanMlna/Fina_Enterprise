import React from 'react';
import { FileCheck2, X } from 'lucide-react';

export interface NewReceiptFormData {
  merchant_name: string;
  receipt_number: string;
  item_1_name: string;
  item_1_price: string;
  item_2_name: string;
  item_2_price: string;
  simulate_tamper: boolean;
}

interface ForensicUploadReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: NewReceiptFormData;
  setFormData: React.Dispatch<React.SetStateAction<NewReceiptFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const ForensicUploadReceiptModal: React.FC<ForensicUploadReceiptModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '24px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck2 size={18} color="var(--cyan-400)" />
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>Uji Dokumen Nota Baru</h3>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Nama Toko / Penjual Pasar *
            </label>
            <input 
              type="text"
              required
              value={formData.merchant_name}
              onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-medium)',
                color: '#ffffff',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Nomor Struk / Nota *
            </label>
            <input 
              type="text"
              required
              value={formData.receipt_number}
              onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-medium)',
                color: '#ffffff',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rincian Barang Belanjaan:</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px', marginTop: '6px' }}>
              <input 
                type="text"
                placeholder="Nama Barang 1"
                value={formData.item_1_name}
                onChange={(e) => setFormData({ ...formData, item_1_name: e.target.value })}
                style={{ padding: '6px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-medium)', color: '#ffffff', fontSize: '0.82rem' }}
              />
              <input 
                type="number"
                placeholder="Subtotal (Rp)"
                value={formData.item_1_price}
                onChange={(e) => setFormData({ ...formData, item_1_price: e.target.value })}
                style={{ padding: '6px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-medium)', color: '#ffffff', fontSize: '0.82rem' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px', marginTop: '6px' }}>
              <input 
                type="text"
                placeholder="Nama Barang 2"
                value={formData.item_2_name}
                onChange={(e) => setFormData({ ...formData, item_2_name: e.target.value })}
                style={{ padding: '6px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-medium)', color: '#ffffff', fontSize: '0.82rem' }}
              />
              <input 
                type="number"
                placeholder="Subtotal (Rp)"
                value={formData.item_2_price}
                onChange={(e) => setFormData({ ...formData, item_2_price: e.target.value })}
                style={{ padding: '6px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-medium)', color: '#ffffff', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input 
              type="checkbox"
              id="tamper_check"
              checked={formData.simulate_tamper}
              onChange={(e) => setFormData({ ...formData, simulate_tamper: e.target.checked })}
              style={{ accentColor: 'var(--rose-500)', width: '16px', height: '16px' }}
            />
            <label htmlFor="tamper_check" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Simulasikan anomali piksel kompresi (Modus Uji ELA Fraud Detection)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Menganalisis...' : 'Analisis & Simpan ke DB'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
