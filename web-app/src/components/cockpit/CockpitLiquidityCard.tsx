import React from 'react';
import { ArrowUpRight, Coins, Calendar, Receipt } from 'lucide-react';
import type { KPIStats, NavigationTab } from '../../types';

interface CockpitLiquidityCardProps {
  kpi: KPIStats;
  onNavigate: (tab: NavigationTab) => void;
}

export const CockpitLiquidityCard: React.FC<CockpitLiquidityCardProps> = ({ kpi, onNavigate }) => {
  return (
    <div className="homies-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Header: +70,3% Efisiensi Arus Kas + Action Arrow */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--mint-neon)',
                boxShadow: '0 0 8px var(--mint-neon)'
              }} />
              <span style={{
                fontSize: '1.60rem',
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em'
              }}>
                {kpi.liquidCash > 0 ? '+70,3%' : '0,0%'}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              {kpi.liquidCash > 0 ? 'Efisiensi Arus Kas & Likuiditas' : 'Belum Ada Arus Kas Berjalan'}
            </div>
          </div>

          <button 
            className="homies-icon-btn" 
            title="Buka Simulasi Likuiditas & Monte Carlo"
            onClick={() => onNavigate('montecarlo')}
          >
            <ArrowUpRight size={17} color="#FFFFFF" />
          </button>
        </div>

        {/* Smooth Glowing Neon Mint Bezier Line Chart */}
        <div style={{ width: '100%', height: '140px', position: 'relative', marginTop: '4px' }}>
          <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="mintAreaGradientLiq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00DF8F" stopOpacity="0.32" />
                <stop offset="85%" stopColor="#00DF8F" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#00DF8F" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Dotted Mid-line Threshold */}
            <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="4 4" />

            {/* Filled Gradient Area */}
            <path
              d="M 0 130 
                 C 60 145, 90 90, 150 115 
                 C 210 140, 250 55, 310 75 
                 C 370 95, 410 35, 470 45 
                 C 530 55, 570 25, 600 35 
                 L 600 160 L 0 160 Z"
              fill="url(#mintAreaGradientLiq)"
            />

            {/* Smooth Glowing Neon Mint Curve */}
            <path
              d="M 0 130 
                 C 60 145, 90 90, 150 115 
                 C 210 140, 250 55, 310 75 
                 C 370 95, 410 35, 470 45 
                 C 530 55, 570 25, 600 35"
              fill="none"
              stroke="var(--mint-neon)"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px rgba(0, 223, 143, 0.45))"
            />
          </svg>

          {/* Month Markers on X-Axis */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '6px',
            fontSize: '0.70rem',
            color: '#64748B',
            fontFamily: 'var(--font-mono)'
          }}>
            <span>Jul</span>
            <span>Agu</span>
            <span>Sep</span>
            <span>Okt</span>
            <span>Nov</span>
            <span>Des</span>
          </div>
        </div>
      </div>

      {/* 5 Micro-Metric Cards Horisontal di Bawah Chart */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: '8px',
        marginTop: '14px'
      }}>
        {/* Micro Card 1: Cadangan Kas */}
        <div className="homies-card-inner" style={{ padding: '8px 8px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
            <Coins size={11} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Cadangan</span>
          </div>
          <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
            {kpi.safetyBuffer > 0 ? (kpi.safetyBuffer >= 1000000 ? `${(kpi.safetyBuffer / 1000000).toFixed(0)}M` : `${(kpi.safetyBuffer / 1000).toFixed(0)}K`) : 'Rp 0'}
          </div>
          <div 
            onClick={() => onNavigate('ledger')}
            style={{ fontSize: '0.62rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
          >
            <span>Buku Besar</span>
            <span>↗</span>
          </div>
        </div>

        {/* Micro Card 2: Cash Runway */}
        <div className="homies-card-inner" style={{ padding: '8px 8px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
            <Calendar size={11} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Runway</span>
          </div>
          <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
            {kpi.cashRunwayDays > 0 ? `${(kpi.cashRunwayDays / 30).toFixed(1)} bln` : '0 bln'}
          </div>
          <div 
            onClick={() => onNavigate('montecarlo')}
            style={{ fontSize: '0.62rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
          >
            <span>Simulasi</span>
            <span>↗</span>
          </div>
        </div>

        {/* Micro Card 3: Rasio Lancar */}
        <div className="homies-card-inner" style={{ padding: '8px 8px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
            <ArrowUpRight size={11} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rasio</span>
          </div>
          <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
            {kpi.liquidCash > 0 ? '1.85x' : '0.0x'}
          </div>
          <div 
            onClick={() => onNavigate('cockpit')}
            style={{ fontSize: '0.62rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
          >
            <span>Audit</span>
            <span>↗</span>
          </div>
        </div>

        {/* Micro Card 4: Margin Bersih */}
        <div className="homies-card-inner" style={{ padding: '8px 8px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
            <Receipt size={11} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Margin</span>
          </div>
          <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
            {kpi.totalRevenue && kpi.totalRevenue > 0 ? '6.5%' : '0.0%'}
          </div>
          <div 
            onClick={() => onNavigate('b2b_benchmark')}
            style={{ fontSize: '0.62rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
          >
            <span>B2B</span>
            <span>↗</span>
          </div>
        </div>

        {/* Micro Card 5: PPh Final PP55 */}
        <div className="homies-card-inner" style={{ padding: '8px 8px', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
            <Receipt size={11} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>PPh 0.5%</span>
          </div>
          <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
            {kpi.estimatedTaxPP55 > 0 
              ? (kpi.estimatedTaxPP55 >= 1000000 ? `Rp ${(kpi.estimatedTaxPP55 / 1000000).toFixed(1)}Jt` : `Rp ${(kpi.estimatedTaxPP55 / 1000).toFixed(0)}Rb`)
              : 'Rp 0'}
          </div>
          <div 
            onClick={() => onNavigate('ledger')}
            style={{ fontSize: '0.62rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
          >
            <span>Pajak</span>
            <span>↗</span>
          </div>
        </div>
      </div>
    </div>
  );
};
