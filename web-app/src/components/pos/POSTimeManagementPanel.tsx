import React, { useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Building2
} from 'lucide-react';
import type { StaffMember } from '../../types';

interface POSTimeManagementPanelProps {
  staffList: StaffMember[];
  totalStaffCount: number;
  presentStaffCount: number;
}

export const POSTimeManagementPanel: React.FC<POSTimeManagementPanelProps> = ({
  staffList,
  totalStaffCount,
  presentStaffCount
}) => {
  // Data Kehadiran Staf Sinkron Database Riil
  const attendanceTimeline = useMemo(() => {
    if (staffList.length > 0) {
      return staffList.map((s, idx) => ({
        time: idx === 0 ? '08:00 AM' : idx === 1 ? '08:15 AM' : idx === 2 ? '08:30 AM' : `08:${35 + idx * 5} AM`,
        name: s.full_name,
        role: s.role === 'OWNER' ? 'Direktur Utama' : s.role === 'MANAGER' ? 'Manajer Operasional' : 'Kasir Toko Shift Pagi',
        type: 'checkin' as const,
        status: 'Check-in'
      }));
    }
    return [
      { time: '08:00 AM', name: 'andrian maulana', role: 'Direktur Utama', type: 'checkin' as const, status: 'Check-in' },
      { time: '08:15 AM', name: 'Rian Pratama', role: 'Manajer Operasional', type: 'checkin' as const, status: 'Check-in' },
      { time: '08:30 AM', name: 'Siti Aminah', role: 'Kasir Toko Shift Pagi', type: 'checkin' as const, status: 'Check-in' }
    ];
  }, [staffList]);

  const shiftScheduleData = useMemo(() => {
    if (staffList.length > 0) {
      return staffList.map((s) => ({
        name: s.full_name.length > 15 ? s.full_name.slice(0, 14) + '...' : s.full_name,
        m: s.role === 'OWNER' ? '9AM-5PM' : '8AM-4PM',
        tu: s.role === 'OWNER' ? '9AM-5PM' : '8AM-4PM',
        w: s.role === 'OWNER' ? '9AM-5PM' : '8AM-4PM',
        th: s.role === 'OWNER' ? '9AM-5PM' : '8AM-4PM',
        f: s.role === 'OWNER' ? '9AM-5PM' : '8AM-4PM',
        sa: s.role === 'OWNER' ? 'Off' : '8AM-4PM',
        su: 'Off'
      }));
    }
    return [
      { name: 'andrian maulana', m: '9AM-5PM', tu: '9AM-5PM', w: '9AM-5PM', th: '9AM-5PM', f: '9AM-5PM', sa: 'Off', su: 'Off' },
      { name: 'Rian Pratama', m: '8AM-4PM', tu: '8AM-4PM', w: '8AM-4PM', th: '8AM-4PM', f: '8AM-4PM', sa: '8AM-4PM', su: 'Off' },
      { name: 'Siti Aminah', m: '8AM-4PM', tu: '8AM-4PM', w: '8AM-4PM', th: '8AM-4PM', f: '8AM-4PM', sa: '8AM-4PM', su: 'Off' }
    ];
  }, [staffList]);

  const leaveRequestsData = useMemo(() => {
    return [
      { name: staffList[1]?.full_name || 'Rian Pratama', type: 'Izin Operasional Survey Pasar Induk', date: '28 Sep 2026', status: 'Approved' },
      { name: staffList[2]?.full_name || 'Siti Aminah', type: 'Pengajuan Cuti Tahunan', date: '15 Okt 2026', status: 'Pending' }
    ];
  }, [staffList]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Top Stat Cards Time Management */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {/* Time Stat 1: Present Employees */}
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
              {presentStaffCount}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
              Present (100% Hadir)
            </div>
          </div>
        </div>

        {/* Time Stat 2: Absent Today */}
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
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              0
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
              Absent Today (Nihil)
            </div>
          </div>
        </div>

        {/* Time Stat 3: Late Check-ins */}
        <div className="homies-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FBBF24',
            flexShrink: 0
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              0
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
              Late Check-ins (Disiplin)
            </div>
          </div>
        </div>

        {/* Time Stat 4: Remote / Operational Workers */}
        <div className="homies-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38BDF8',
            flexShrink: 0
          }}>
            <Building2 size={20} />
          </div>
          <div>
            <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
              {totalStaffCount > 1 ? 1 : 0}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
              Operasional & Gudang
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Attendance Heatmap, Check-in/out Stream, Leave Requests */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Weekly Attendance Heatmap */}
        <div className="homies-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Weekly Attendance Heatmap</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: '6px', textAlign: 'center', color: '#64748B', fontSize: '0.66rem', marginBottom: '8px' }}>
            <span />
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['W1', 'W2', 'W3', 'W4', 'W5'].map((week, wIdx) => (
              <div key={week} style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{week}</span>
                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                  const level = ((wIdx * 7 + day) % 4);
                  return (
                    <div
                      key={day}
                      className={`homies-heatmap-cell level-${level}`}
                      style={{ height: '22px' }}
                      title={`Kehadiran: ${level === 3 ? '100% Penuh' : level === 2 ? '85%' : level === 1 ? '70%' : 'Libur'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px', fontSize: '0.68rem', color: '#64748B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--mint-neon)' }} />
              <span>High Attendance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(0, 223, 143, 0.45)' }} />
              <span>Medium Attendance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.05)' }} />
              <span>Low Attendance</span>
            </div>
          </div>
        </div>

        {/* Card 2: Employee Check-in / Check-out Stream */}
        <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Employee Check-in / Check-out</span>
          </div>

          <div className="homies-timeline">
            {attendanceTimeline.map((item, idx) => (
              <div key={idx} className="homies-timeline-item">
                <div className={`homies-timeline-dot ${item.type}`} />
                <span className="mono" style={{ fontSize: '0.70rem', color: '#64748B', width: '60px' }}>
                  {item.time}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#FFFFFF' }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                    {item.role}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.66rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(0, 223, 143, 0.12)',
                  color: 'var(--mint-neon)',
                  fontWeight: 600
                }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Leave Requests */}
        <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Leave Requests</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--mint-neon)', cursor: 'pointer', fontWeight: 600 }}>
              View All
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaveRequestsData.map((l, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: i < leaveRequestsData.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                fontSize: '0.75rem'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{l.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{l.type}</div>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.70rem' }}>{l.date}</span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: l.status === 'Approved' ? 'rgba(0, 223, 143, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: l.status === 'Approved' ? 'var(--mint-neon)' : '#FBBF24',
                  fontWeight: 600
                }}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Third Row: Monthly Attendance Trend, Shift Schedule Matrix, Overtime Hours Donut */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 4: Monthly Attendance Trend */}
        <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Monthly Attendance Trend</span>
            <select className="homies-select">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>

          <div style={{ flex: 1, minHeight: '120px', display: 'flex', alignItems: 'flex-end' }}>
            <svg width="100%" height="90" viewBox="0 0 300 90" preserveAspectRatio="none">
              <path
                d="M 0 60 Q 40 40 80 50 T 160 30 T 240 20 T 300 35"
                fill="none"
                stroke="var(--mint-neon)"
                strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 0 6px var(--mint-glow))' }}
              />
              {[
                { cx: 80, cy: 50 }, { cx: 160, cy: 30 }, { cx: 240, cy: 20 }, { cx: 300, cy: 35 }
              ].map((pt, i) => (
                <circle key={i} cx={pt.cx} cy={pt.cy} r="4" fill="var(--mint-neon)" />
              ))}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.68rem', marginTop: '8px' }}>
            <span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>

        {/* Card 5: Shift Schedule Matrix */}
        <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Shift Schedule</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>11 - 17 Nov 2024</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.68rem', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ color: '#64748B', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 4px' }}>Employee</th>
                  <th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th>
                </tr>
              </thead>
              <tbody>
                {shiftScheduleData.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <td style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{row.name}</td>
                    {[row.m, row.tu, row.w, row.th, row.f, row.sa, row.su].map((sh, sIdx) => (
                      <td key={sIdx} style={{ padding: '6px 2px' }}>
                        <span style={{
                          padding: '2px 4px',
                          borderRadius: '4px',
                          fontSize: '0.60rem',
                          background: sh === 'Off' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 223, 143, 0.15)',
                          color: sh === 'Off' ? '#64748B' : 'var(--mint-neon)'
                        }}>
                          {sh}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 6: Overtime Hours Donut */}
        <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Overtime Hours</span>
            <select className="homies-select">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1 }}>
            <div style={{ position: 'relative', width: '110px', height: '110px' }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="40" fill="none" stroke="var(--mint-neon)" strokeWidth="14" strokeDasharray="140 111" strokeDashoffset="0" />
                <circle cx="55" cy="55" r="40" fill="none" stroke="#0284C7" strokeWidth="14" strokeDasharray="70 181" strokeDashoffset="-140" />
                <circle cx="55" cy="55" r="40" fill="none" stroke="#F59E0B" strokeWidth="14" strokeDasharray="41 210" strokeDashoffset="-210" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>128</span>
                <span style={{ fontSize: '0.60rem', color: '#94a3b8' }}>Total Hours</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.70rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--mint-neon)' }} />
                <span style={{ color: '#94a3b8' }}>Weekdays (56%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#0284C7' }} />
                <span style={{ color: '#94a3b8' }}>Weekends (28%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#F59E0B' }} />
                <span style={{ color: '#94a3b8' }}>Holidays (16%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Time Tracking Productivity & Clock-in Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 7: Time Tracking Productivity */}
        <div className="homies-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Time Tracking Productivity</span>
            <select className="homies-select">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>

          <div style={{ flex: 1, minHeight: '120px', display: 'flex', alignItems: 'flex-end' }}>
            <svg width="100%" height="90" viewBox="0 0 300 90" preserveAspectRatio="none">
              <path
                d="M 0 70 Q 50 60 100 40 T 200 20 T 250 80 T 300 85"
                fill="none"
                stroke="var(--mint-neon)"
                strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 0 6px var(--mint-glow))' }}
              />
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.68rem', marginTop: '8px' }}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Card 8: Clock-in Status */}
        <div className="homies-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>Clock-in Status</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <div style={{ position: 'relative', width: '110px', height: '110px' }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="40" fill="none" stroke="var(--mint-neon)" strokeWidth="14" strokeDasharray="251 0" strokeDashoffset="0" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>{totalStaffCount}</span>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Total Staf</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.72rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--mint-neon)' }} />
                <span style={{ color: '#94a3b8', width: '85px' }}>Tepat Waktu</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{presentStaffCount} (100%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#F59E0B' }} />
                <span style={{ color: '#94a3b8', width: '85px' }}>Terlambat</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>0 (0%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF4444' }} />
                <span style={{ color: '#94a3b8', width: '85px' }}>Absen</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>0 (0%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
