import React from 'react';
import { MoreHorizontal, ArrowUpRight, ToggleLeft, ToggleRight, Trash2, Users } from 'lucide-react';
import type { StaffMember } from '../../types';
import { maskPhone } from '../../utils';

interface StaffTableProps {
  staffList: StaffMember[];
  isLoading: boolean;
  isPiiMasked: boolean;
  activeMenuStaffId: string | null;
  onToggleMenu: (id: string) => void;
  onToggleStatus: (staff: StaffMember) => void;
  onDeleteStaff: (staff: StaffMember) => void;
  onViewDetail?: (staff: StaffMember) => void;
  avatars: string[];
}

export const StaffTable: React.FC<StaffTableProps> = ({
  staffList,
  isLoading,
  isPiiMasked,
  activeMenuStaffId,
  onToggleMenu,
  onToggleStatus,
  onDeleteStaff,
  onViewDetail,
  avatars
}) => {
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { bg: 'rgba(236, 72, 153, 0.15)', text: '#F472B6', border: 'rgba(236, 72, 153, 0.35)' };
      case 'MANAGER':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.35)' };
      case 'CASHIER':
        return { bg: 'rgba(0, 223, 143, 0.15)', text: 'var(--mint-neon)', border: 'rgba(0, 223, 143, 0.35)' };
      case 'AUDITOR':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.35)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.35)' };
    }
  };

  const getDepartmentName = (role: string) => {
    switch (role) {
      case 'OWNER': return 'Executive Management';
      case 'MANAGER': return 'Operations';
      case 'CASHIER': return 'Front-Desk / POS';
      case 'AUDITOR': return 'Finance & Audit';
      default: return 'General Staff';
    }
  };

  const getPositionLabel = (role: string) => {
    switch (role) {
      case 'OWNER': return 'Executive Owner';
      case 'MANAGER': return 'Store Manager';
      case 'CASHIER': return 'Kasir Shift Pagi';
      case 'AUDITOR': return 'Auditor SAK EMKM';
      default: return 'Staff Member';
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
        <div className="spin-anim" style={{ width: '28px', height: '28px', border: '2px solid rgba(0, 223, 143, 0.2)', borderTopColor: 'var(--mint-neon)', borderRadius: '50%', margin: '0 auto 12px auto' }} />
        <span>Memuat data karyawan dari PostgreSQL...</span>
      </div>
    );
  }

  if (staffList.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
        <Users size={40} style={{ opacity: 0.3, margin: '0 auto 10px auto', display: 'block' }} />
        <p style={{ margin: 0, fontWeight: 600, color: '#FFFFFF' }}>Tidak ada karyawan yang ditemukan</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem' }}>Coba ubah kata kunci pencarian Anda atau tambahkan karyawan baru.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
        <thead>
          <tr style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#64748b',
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            <th style={{ padding: '14px 20px', fontWeight: 600 }}>Employee Name</th>
            <th style={{ padding: '14px 16px', fontWeight: 600 }}>Role & Access</th>
            <th style={{ padding: '14px 16px', fontWeight: 600 }}>Department</th>
            <th style={{ padding: '14px 16px', fontWeight: 600 }}>Position</th>
            <th style={{ padding: '14px 16px', fontWeight: 600 }}>WhatsApp Contact</th>
            <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff, idx) => {
            const avatarUrl = avatars[idx % avatars.length];
            const badgeStyle = getRoleBadgeStyle(staff.role);
            const isMenuOpen = activeMenuStaffId === staff.id;

            return (
              <tr 
                key={staff.id}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  transition: 'background 0.15s ease'
                }}
                className="homies-table-row"
              >
                {/* 1. Name & Avatar */}
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={avatarUrl} 
                      alt={staff.full_name}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1.5px solid rgba(255, 255, 255, 0.15)'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.90rem' }}>
                        {staff.full_name}
                      </div>
                      <div className="mono" style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                        ID: {staff.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. Role */}
                <td style={{ padding: '16px 16px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: badgeStyle.bg,
                    color: badgeStyle.text,
                    border: `1px solid ${badgeStyle.border}`
                  }}>
                    {staff.role}
                  </span>
                </td>

                {/* 3. Department */}
                <td style={{ padding: '16px 16px', color: '#cbd5e1' }}>
                  {getDepartmentName(staff.role)}
                </td>

                {/* 4. Position */}
                <td style={{ padding: '16px 16px', color: '#94a3b8' }}>
                  {getPositionLabel(staff.role)}
                </td>

                {/* 5. Contact */}
                <td style={{ padding: '16px 16px' }}>
                  <span className="mono" style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>
                    {maskPhone(staff.phone_number, isPiiMasked)}
                  </span>
                </td>

                {/* 6. Status */}
                <td style={{ padding: '16px 16px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: staff.is_active ? 'rgba(0, 223, 143, 0.10)' : 'rgba(244, 63, 94, 0.10)',
                    color: staff.is_active ? 'var(--mint-neon)' : '#F87171',
                    border: staff.is_active ? '1px solid rgba(0, 223, 143, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: staff.is_active ? 'var(--mint-neon)' : '#F87171',
                      boxShadow: staff.is_active ? '0 0 8px var(--mint-neon)' : 'none'
                    }} />
                    {staff.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>

                {/* 7. Action Icons (ArrowUpRight + More Horizontal) */}
                <td style={{ padding: '16px 20px', textAlign: 'right', position: 'relative' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      className="homies-action-circle-btn"
                      title="Lihat Detail Profil & Hak Akses"
                      onClick={() => onViewDetail ? onViewDetail(staff) : undefined}
                      style={{ cursor: 'pointer' }}
                    >
                      <ArrowUpRight size={14} />
                    </button>

                    <button 
                      className="homies-action-circle-btn"
                      title="Opsi Lanjutan"
                      onClick={() => onToggleMenu(staff.id)}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  {/* Dropdown Menu Popup */}
                  {isMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      right: '20px',
                      top: '52px',
                      zIndex: 50,
                      background: '#131e29',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '6px',
                      minWidth: '170px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <button
                        onClick={() => onToggleStatus(staff)}
                        disabled={staff.role === 'OWNER'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: staff.role === 'OWNER' ? '#64748b' : '#FFFFFF',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.80rem',
                          cursor: staff.role === 'OWNER' ? 'not-allowed' : 'pointer',
                          textAlign: 'left'
                        }}
                        className="homies-dropdown-item"
                      >
                        {staff.is_active ? <ToggleLeft size={14} color="#F87171" /> : <ToggleRight size={14} color="var(--mint-neon)" />}
                        <span>{staff.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                      </button>

                      <button
                        onClick={() => onDeleteStaff(staff)}
                        disabled={staff.role === 'OWNER'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: staff.role === 'OWNER' ? '#64748b' : '#F87171',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.80rem',
                          cursor: staff.role === 'OWNER' ? 'not-allowed' : 'pointer',
                          textAlign: 'left'
                        }}
                        className="homies-dropdown-item"
                      >
                        <Trash2 size={14} />
                        <span>Hapus Karyawan</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
