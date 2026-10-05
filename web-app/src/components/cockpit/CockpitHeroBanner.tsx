import React from 'react';
import { Coins, ShoppingCart, Receipt, Calendar, Share2 } from 'lucide-react';
import type { KPIStats, NavigationTab, Tenant, StaffMember } from '../../types';

interface CockpitHeroBannerProps {
  tenant?: Tenant | null;
  formattedToday: string;
  kpi: KPIStats;
  staffList: StaffMember[];
  onNavigate: (tab: NavigationTab) => void;
}

export const CockpitHeroBanner: React.FC<CockpitHeroBannerProps> = ({
  tenant,
  formattedToday,
  kpi,
  staffList,
  onNavigate
}) => {
  // Semicircular Radial Gauge Meter Calculation (270° Arc from 135° to 405°)
  const healthScore = Math.max(0, Math.min(100, kpi.financialHealthIndex || 0));
  const radius = 72;
  const strokeCircumference = 2 * Math.PI * radius * 0.75; // ~339.29
  const strokeOffset = strokeCircumference * (1 - healthScore / 100);

  const knobAngleDeg = 135 + (healthScore / 100) * 270;
  const knobAngleRad = (knobAngleDeg * Math.PI) / 180;
  const knobX = 100 + radius * Math.cos(knobAngleRad);
  const knobY = 100 + radius * Math.sin(knobAngleRad);

  return (
    <>
      {/* 1. TOP BREADCRUMB & ACTION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
          <span style={{ color: 'var(--mint-neon)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNavigate('cockpit')}>
            Home
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>/</span>
          <span style={{ color: '#94a3b8' }}>Dashboard</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="homies-icon-btn" 
            title="Kalender Pembukuan & Jadwal Pajak"
            onClick={() => onNavigate('ledger')}
          >
            <Calendar size={16} />
          </button>
          <button 
            className="homies-icon-btn" 
            title="Ekspor Laporan Keuangan SAK EMKM"
            onClick={() => onNavigate('ledger')}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* 2. HERO GREETING + STAT PILLS + RADIAL GAUGE METER */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 260px',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Kolom Kiri: Greeting + 4 Quick Stat Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h1 style={{ 
              fontSize: '2.1rem', 
              fontWeight: 700, 
              color: '#FFFFFF', 
              letterSpacing: '-0.025em',
              margin: '0 0 4px 0',
              fontFamily: 'var(--font-display)'
            }}>
              Selamat Datang, {tenant?.name || 'PT Abadi Nan Jaya'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.90rem', margin: 0 }}>
              {formattedToday}
            </p>
          </div>

          {/* 4 Quick Stat Pills Sejajar Horizontal */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            {/* Stat 1: Kas Likuid */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 223, 143, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mint-neon)',
                flexShrink: 0
              }}>
                <Coins size={16} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  {kpi.liquidCash > 0 ? (kpi.liquidCash >= 1000000 ? `${(kpi.liquidCash / 1000000).toFixed(1)}M` : `${(kpi.liquidCash / 1000).toFixed(0)}K`) : 'Rp 0'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Kas Likuid
                </div>
              </div>
            </div>

            {/* Stat 2: Omzet Usaha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 223, 143, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mint-neon)',
                flexShrink: 0
              }}>
                <ShoppingCart size={16} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  {kpi.totalRevenue && kpi.totalRevenue > 0 
                    ? (kpi.totalRevenue >= 1000000 ? `${(kpi.totalRevenue / 1000000).toFixed(1)}M` : `${(kpi.totalRevenue / 1000).toFixed(0)}K`)
                    : 'Rp 0'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Omzet Usaha
                </div>
              </div>
            </div>

            {/* Stat 3: Piutang Usaha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FBBF24',
                flexShrink: 0
              }}>
                <Receipt size={16} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  {kpi.activeAccountsReceivable > 0 ? (kpi.activeAccountsReceivable >= 1000000 ? `${(kpi.activeAccountsReceivable / 1000000).toFixed(1)}M` : `${(kpi.activeAccountsReceivable / 1000).toFixed(0)}K`) : 'Rp 0'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Piutang Aktif
                </div>
              </div>
            </div>

            {/* Stat 4: Staf Karyawan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 223, 143, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mint-neon)',
                flexShrink: 0
              }}>
                <Calendar size={16} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  {`${staffList.length} Staf`}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Staf Aktif
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Semicircular Radial Gauge Meter (Health Score SAK EMKM) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ width: '210px', height: '180px', position: 'relative' }}>
            <svg width="210" height="190" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
              <defs>
                <filter id="mintGlowHero" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="gaugeGradientHero" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00DF8F" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>

              {/* Dial Numbers */}
              <text x="24" y="160" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">00</text>
              <text x="46" y="38" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">40</text>
              <text x="144" y="38" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">60</text>
              <text x="174" y="112" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">80</text>
              <text x="156" y="162" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">100</text>

              {/* Background Arc Track */}
              <path
                d="M 49.09 150.91 A 72 72 0 1 1 150.91 150.91"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="7"
                strokeLinecap="round"
              />

              {/* Active Progress Arc */}
              <path
                d="M 49.09 150.91 A 72 72 0 1 1 150.91 150.91"
                fill="none"
                stroke="url(#gaugeGradientHero)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={strokeOffset}
                filter="url(#mintGlowHero)"
              />

              {/* Glowing Endpoint Knob */}
              <circle
                cx={knobX}
                cy={knobY}
                r="7"
                fill="#FFFFFF"
                stroke="var(--mint-neon)"
                strokeWidth="3.5"
                filter="drop-shadow(0 0 6px rgba(0, 223, 143, 0.8))"
              />
            </svg>

            {/* Centered Percentage & Label */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              width: '160px',
              pointerEvents: 'none'
            }}>
              <div style={{ 
                fontSize: '1.9rem', 
                fontWeight: 700, 
                color: '#FFFFFF', 
                fontFamily: 'var(--font-display)',
                lineHeight: 1
              }}>
                {healthScore}%
              </div>
              <div style={{ 
                fontSize: '0.68rem', 
                color: 'var(--mint-neon)', 
                marginTop: '4px',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                Financial Health (ACID)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
