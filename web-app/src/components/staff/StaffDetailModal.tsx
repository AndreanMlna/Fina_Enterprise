import React from 'react';
import { 
  X, 
  ShieldCheck, 
  MessageSquare, 
  Building2, 
  Briefcase, 
  KeyRound, 
  CheckCircle2, 
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import type { StaffMember } from '../../types';
import { maskPhone } from '../../utils';

interface StaffDetailModalProps {
  staff: StaffMember | null;
  isOpen: boolean;
  onClose: () => void;
  isPiiMasked?: boolean;
  onToggleStatus?: (staff: StaffMember) => void;
}

export const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  staff,
  isOpen,
  onClose,
  isPiiMasked = false,
  onToggleStatus
}) => {
  if (!isOpen || !staff) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return { text: '#F472B6', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.35)' };
      case 'MANAGER': return { text: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)' };
      case 'CASHIER': return { text: 'var(--mint-neon)', bg: 'rgba(0, 223, 143, 0.15)', border: 'rgba(0, 223, 143, 0.35)' };
      case 'AUDITOR': return { text: '#C084FC', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.35)' };
      default: return { text: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.35)' };
    }
  };

  const getPermissions = (role: string) => {
    switch (role) {
      case 'OWNER':
        return [
          'Akses Root Seluruh Modul & Keuangan',
          'Otorisasi Setup Modal & Saldo Awal',
          'Pencabutan & Pendaftaran Akun Staf',
          'Akses Simulator Risiko Likuiditas Monte Carlo'
        ];
      case 'MANAGER':
        return [
          'Pengelolaan Katalog Produk & Stok Toko',
          'Pemberian Otoritas Shift & Diskon POS',
          'Pemantauan Margin Leakage & HPP',
          'Akses Cockpit Performa Penjualan Harian'
        ];
      case 'CASHIER':
        return [
          'Pencatatan Transaksi Kasir POS Real-Time',
          'Penerbitan Struk & QRIS Meja Statis/Dinamis',
          'Input Pembayaran Tunai & Validasi Kembalian',
          'Pencatatan Operator pada Buku SAK EMKM'
        ];
      case 'AUDITOR':
        return [
          'Inspeksi Jurnal Umum & Neraca Saldo SAK EMKM',
          'Audit Verifikasi Integritas SHA-256 Merkle Hash',
          'Forensik Dokumen Nota & Pemeriksaan Mutasi Bank',
          'Akses Read-Only Data Keuangan Perusahaan'
        ];
      default:
        return ['Akses Operasional Standar'];
    }
  };

  const roleStyle = getRoleColor(staff.role);
  const permissions = getPermissions(staff.role);
  const waCleanPhone = staff.phone_number.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${waCleanPhone.startsWith('0') ? '62' + waCleanPhone.slice(1) : waCleanPhone}`;

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
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }} className="custom-scrollbar">

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=60"
              alt={staff.full_name}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                objectFit: 'cover',
                border: '2px solid rgba(16, 185, 129, 0.3)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#FFFFFF', margin: 0, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {staff.full_name}
                </h3>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: roleStyle.bg,
                  color: roleStyle.text,
                  border: `1px solid ${roleStyle.border}`
                }}>
                  {staff.role}
                </span>
              </div>
              <p className="mono" style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                ID Karyawan: {staff.id}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Contact & Status Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '2px' }}>WhatsApp Terhubung</div>
            <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0' }}>
              {maskPhone(staff.phone_number, isPiiMasked)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(37, 211, 102, 0.15)',
                border: '1px solid rgba(37, 211, 102, 0.35)',
                color: '#25D366',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.15s ease'
              }}
            >
              <MessageSquare size={14} />
              <span>Chat WA</span>
            </a>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: staff.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${staff.is_active ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
              color: staff.is_active ? 'var(--emerald-400)' : '#f87171',
              fontSize: '0.78rem',
              fontWeight: 600
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: staff.is_active ? 'var(--emerald-400)' : '#f87171' }} />
              <span>{staff.is_active ? 'Aktif' : 'Nonaktif'}</span>
            </div>
          </div>
        </div>

        {/* Department & Operational Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.74rem', marginBottom: '4px' }}>
              <Building2 size={13} color="var(--cyan-400)" />
              <span>Departemen</span>
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>
              {staff.role === 'OWNER' ? 'Executive Management' : staff.role === 'MANAGER' ? 'Operasional Toko' : staff.role === 'CASHIER' ? 'Front-Desk Kasir' : 'Audit Keuangan'}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.74rem', marginBottom: '4px' }}>
              <Briefcase size={13} color="var(--emerald-400)" />
              <span>Posisi Jabatan</span>
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>
              {staff.role === 'OWNER' ? 'Owner / Pemilik' : staff.role === 'MANAGER' ? 'Store Manager' : staff.role === 'CASHIER' ? 'Kasir Operasional' : 'Auditor SAK EMKM'}
            </div>
          </div>
        </div>

        {/* Permissions & Security Compliance */}
        <div>
          <div style={{ fontSize: '0.80rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <KeyRound size={14} color="var(--mint-neon)" />
            <span>Hak Akses & Otoritas Sistem (Zero-Trust RBAC)</span>
          </div>
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {permissions.map((perm, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={13} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
                <span>{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic Compliance Tag */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldCheck size={16} color="var(--emerald-400)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Dilindungi enkripsi <strong style={{ color: '#ffffff' }}>PBKDF2 SHA-256</strong> untuk PIN kasir & kepatuhan standar <strong style={{ color: 'var(--emerald-400)' }}>SAK EMKM + UU PDP No. 27/2022</strong>.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          {onToggleStatus && staff.role !== 'OWNER' ? (
            <button
              onClick={() => onToggleStatus(staff)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: staff.is_active ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1px solid ${staff.is_active ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                color: staff.is_active ? '#f87171' : 'var(--emerald-400)',
                cursor: 'pointer',
                fontSize: '0.80rem',
                fontWeight: 600
              }}
            >
              {staff.is_active ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
              <span>{staff.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
