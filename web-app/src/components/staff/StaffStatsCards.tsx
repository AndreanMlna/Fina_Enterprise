import React from 'react';
import { Users, UserPlus, Building2, Clock } from 'lucide-react';

interface StaffStatsCardsProps {
  totalStaff: number;
  activeStaff: number;
  departmentsCount: number;
  attendanceRate: number;
}

export const StaffStatsCards: React.FC<StaffStatsCardsProps> = ({
  totalStaff,
  activeStaff,
  departmentsCount,
  attendanceRate
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px'
    }}>
      {/* Stat 1: Total Employees (Emerald) */}
      <div 
        className="homies-card" 
        style={{ 
          padding: '16px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--emerald-400)',
          flexShrink: 0
        }}>
          <Users size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {totalStaff}
            </span>
            <span style={{ fontSize: '0.66rem', color: 'var(--emerald-400)', background: 'rgba(16, 185, 129, 0.12)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Database
            </span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px' }}>
            Total Karyawan
          </div>
        </div>
      </div>

      {/* Stat 2: Active Staff (Sky Blue) */}
      <div 
        className="homies-card" 
        style={{ 
          padding: '16px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.45)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.22) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--cyan-400)',
          flexShrink: 0
        }}>
          <UserPlus size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {activeStaff}
            </span>
            <span style={{ fontSize: '0.66rem', color: 'var(--cyan-400)', background: 'rgba(6, 182, 212, 0.12)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
              {totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 100}% Aktif
            </span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px' }}>
            Staf Siap Bertugas
          </div>
        </div>
      </div>

      {/* Stat 3: Departments (Indigo / Violet) */}
      <div 
        className="homies-card" 
        style={{ 
          padding: '16px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.45)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.22) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#c084fc',
          flexShrink: 0
        }}>
          <Building2 size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {departmentsCount}
            </span>
            <span style={{ fontSize: '0.66rem', color: '#c084fc', background: 'rgba(139, 92, 246, 0.12)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Struktur
            </span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px' }}>
            Divisi & Departemen
          </div>
        </div>
      </div>

      {/* Stat 4: Attendance Rate (Mint / Emerald) */}
      <div 
        className="homies-card" 
        style={{ 
          padding: '16px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '14px',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.45)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(52, 211, 153, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.22) 0%, rgba(52, 211, 153, 0.08) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#34d399',
          flexShrink: 0
        }}>
          <Clock size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {attendanceRate}%
            </span>
            <span style={{ fontSize: '0.66rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Optimal
            </span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px' }}>
            Tingkat Kehadiran
          </div>
        </div>
      </div>
    </div>
  );
};
