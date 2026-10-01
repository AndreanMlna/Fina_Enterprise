import React from 'react';
import { PlusCircle, X } from 'lucide-react';

export interface NewInvoiceFormData {
  customer_name: string;
  customer_phone: string;
  amount: string;
  due_date: string;
  suggested_tone: 'FRIENDLY' | 'REMINDER' | 'FORMAL_URGENT';
}

interface DunningCreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: NewInvoiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<NewInvoiceFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const DunningCreateInvoiceModal: React.FC<DunningCreateInvoiceModalProps> = ({
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
      background: 'rgba(0, 0, 0, 0.75)',
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
        gap: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} color="var(--emerald-400)" />
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>Terbitkan Invoice Baru</h3>
          </div>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={onClose}
            style={{ padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Nama Pelanggan / Entitas Mitra *
            </label>
            <input 
              type="text"
              required
              placeholder="Contoh: PT Katering Mandiri Sejahtera"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
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
              Nomor WhatsApp Pelanggan *
            </label>
            <input 
              type="text"
              required
              placeholder="Contoh: 081298765432"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Nominal Piutang (Rp) *
              </label>
              <input 
                type="number"
                required
                min="1000"
                placeholder="Contoh: 3500000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                Tanggal Jatuh Tempo *
              </label>
              <input 
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menerbitkan...' : 'Terbitkan Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
