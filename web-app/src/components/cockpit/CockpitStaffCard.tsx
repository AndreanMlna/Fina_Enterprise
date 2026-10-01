import React from 'react';
import { MoreHorizontal, ArrowUpRight } from 'lucide-react';
import type { StaffMember, NavigationTab } from '../../types';

interface CockpitStaffCardProps {
  staffList: StaffMember[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectStaffMode: () => void;
}

export const CockpitStaffCard: React.FC<CockpitStaffCardProps> = ({
  staffList,
  onNavigate,
  onSelectStaffMode
}) => {
  const displayStaff = staffList.length > 0 ? staffList : [
    { id: 'st-1', full_name: 'Andrean Maulana', role: 'OWNER' as const, is_active: true, phone_number: '081234567890', tenant_id: '' },
    { id: 'st-2', full_name: 'Budi Santoso', role: 'MANAGER' as const, is_active: true, phone_number: '081298765432', tenant_id: '' },
    { id: 'st-3', full_name: 'Siti Rahma', role: 'CASHIER' as const, is_active: true, phone_number: '081377889900', tenant_id: '' }
  ];

  return (
    <div className="homies-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
      {/* Header Card 3 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h3 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
            Status Karyawan
          </h3>
          <p style={{ fontSize: '0.70rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
            Distribusi tim & shift kerja
          </p>
        </div>
        <button 
          className="homies-icon-btn" 
          style={{ width: '28px', height: '28px' }} 
          onClick={() => onNavigate('staff')}
          title="Buka Manajemen Staf"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Metric Top: Active Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
          Total Personel
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span className="mono" style={{ fontSize: '1.40rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
            {staffList.length > 0 ? staffList.length : 3}
          </span>
          <span style={{ fontSize: '0.70rem', color: 'var(--mint-neon)', fontWeight: 600 }}>
            Staf Aktif
          </span>
        </div>
      </div>

      {/* 3 Rounded Vertical Bar Charts */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '75px',
        padding: '4px 8px 6px 8px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '12px'
      }}>
        {/* Bar 1: Permanent */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '30%' }}>
          <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--mint-neon)' }}>
            {staffList.length > 0 ? staffList.length : 3}
          </span>
          <div style={{
            width: '100%',
            height: '40px',
            background: 'var(--mint-neon)',
            borderRadius: '6px',
            boxShadow: '0 0 10px var(--mint-glow)'
          }} />
          <span style={{ fontSize: '0.66rem', color: 'var(--mint-neon)', fontWeight: 600 }}>
            Tetap
          </span>
        </div>

        {/* Bar 2: Contract */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '30%' }}>
          <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>
            0
          </span>
          <div style={{
            width: '100%',
            height: '12px',
            background: '#1A2433',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }} />
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
            Kontrak
          </span>
        </div>

        {/* Bar 3: Probation */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '30%' }}>
          <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>
            0
          </span>
          <div style={{
            width: '100%',
            height: '12px',
            background: '#1A2433',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }} />
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
            Probation
          </span>
        </div>
      </div>

      {/* Live Roster: Personel Bertugas Hari Ini */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1,
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingTop: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.70rem', color: '#94a3b8', fontWeight: 600 }}>
            Personel Bertugas Hari Ini
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.64rem',
            color: 'var(--mint-neon)',
            fontWeight: 600
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--mint-neon)', boxShadow: '0 0 6px var(--mint-neon)' }} />
            Hadir Lengkap
          </span>
        </div>

        {/* Scrollable Roster Container */}
        <div 
          className="table-scroll-container"
          style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '135px', overflowY: 'auto' }}
        >
          {displayStaff.map((member, idx) => {
            const cleanName = member.full_name ? member.full_name.replace(/\s*\(.*?\)/g, '') : 'Staf';
            const initials = cleanName
              ? cleanName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
              : 'ST';
            const roleColors: Record<string, { bg: string; color: string }> = {
              OWNER: { bg: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' },
              MANAGER: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' },
              CASHIER: { bg: 'rgba(0, 223, 143, 0.15)', color: 'var(--mint-neon)' },
              AUDITOR: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }
            };
            const roleStyle = roleColors[member.role] || { bg: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' };

            return (
              <div
                key={member.id || idx}
                onClick={onSelectStaffMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 9px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '7px',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: roleStyle.bg,
                    color: roleStyle.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {initials}
                  </div>
                  <span style={{ 
                    fontSize: '0.76rem', 
                    color: '#FFFFFF', 
                    fontWeight: 500, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {cleanName}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: roleStyle.bg,
                    color: roleStyle.color
                  }}>
                    {member.role}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    color: 'var(--mint-neon)',
                    fontWeight: 500
                  }}>
                    On Duty
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Card Footer Link */}
        <div 
          onClick={() => onNavigate('staff')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '0.68rem',
            color: 'var(--mint-neon)',
            cursor: 'pointer',
            paddingTop: '6px',
            marginTop: 'auto'
          }}
        >
          <span>Kelola Staf & Presensi</span>
          <ArrowUpRight size={11} />
        </div>
      </div>
    </div>
  );
};
