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
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px'
    }}>
      {/* Stat 1: Total Employees */}
      <div className="homies-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'rgba(0, 223, 143, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mint-neon)',
          flexShrink: 0
        }}>
          <Users size={20} />
        </div>
        <div>
          <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
            {totalStaff}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
            Total Employees
          </div>
        </div>
      </div>

      {/* Stat 2: New Hires / Active Staff */}
      <div className="homies-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'rgba(0, 223, 143, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mint-neon)',
          flexShrink: 0
        }}>
          <UserPlus size={20} />
        </div>
        <div>
          <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
            {activeStaff}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
            Active Staff
          </div>
        </div>
      </div>

      {/* Stat 3: Departments */}
      <div className="homies-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'rgba(0, 223, 143, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mint-neon)',
          flexShrink: 0
        }}>
          <Building2 size={20} />
        </div>
        <div>
          <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
            {departmentsCount}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
            Departments
          </div>
        </div>
      </div>

      {/* Stat 4: Attendance Rate */}
      <div className="homies-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'rgba(0, 223, 143, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mint-neon)',
          flexShrink: 0
        }}>
          <Clock size={20} />
        </div>
        <div>
          <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
            {attendanceRate}%
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
            Attendance Rate
          </div>
        </div>
      </div>
    </div>
  );
};
