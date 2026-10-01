import React from 'react';
import { UserPlus, X } from 'lucide-react';
import type { CreateStaffPayload } from '../../types';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: CreateStaffPayload;
  setFormData: React.Dispatch<React.SetStateAction<CreateStaffPayload>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  formError: string | null;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  formError
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
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#0d151d',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '460px',
        padding: '26px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 223, 143, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mint-neon)'
            }}>
              <UserPlus size={18} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
              Tambah Karyawan Baru
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#F87171',
            fontSize: '0.80rem',
            marginBottom: '16px'
          }}>
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>
              Nama Lengkap Karyawan *
            </label>
            <input 
              type="text"
              required
              placeholder="Contoh: Rian Pratama"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="homies-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>
              Nomor WhatsApp Karyawan *
            </label>
            <input 
              type="text"
              required
              placeholder="Contoh: 081234567890"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="homies-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>
              Role Jabatan & Otoritas *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="homies-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="CASHIER">CASHIER (Kasir POS, Checkout, Cetak Struk)</option>
              <option value="MANAGER">MANAGER (Operasional Toko, Koreksi Stok, Shift)</option>
              <option value="AUDITOR">AUDITOR (Pemeriksa Laporan SAK EMKM & Forensik ELA)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>
              PIN Keamanan Kasir (6 Digit Angka) *
            </label>
            <input 
              type="password"
              required
              maxLength={6}
              placeholder="••••••"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, '') })}
              className="homies-input"
              style={{ letterSpacing: '4px', fontSize: '1rem', fontFamily: 'monospace' }}
            />
            <span style={{ fontSize: '0.70rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Digunakan staf kasir saat login cepat (PIN quick unlock) pada terminal POS.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: '8px', padding: '10px 16px' }}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary btn-sm"
              style={{ 
                borderRadius: '8px', 
                padding: '10px 20px',
                background: 'var(--mint-neon)',
                color: '#000000',
                fontWeight: 700
              }}
            >
              {isSubmitting ? 'Menyimpan...' : 'Daftarkan Karyawan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
