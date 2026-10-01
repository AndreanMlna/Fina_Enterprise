import React from 'react';
import { MoreHorizontal, ArrowUpRight } from 'lucide-react';
import type { NavigationTab } from '../../types';

export interface TelemetryEvent {
  id: string;
  category: 'ALL' | 'SWEEPING' | 'DUNNING' | 'AUDIT';
  title: string;
  subtitle: string;
  source: string;
  timeRange: string;
  status: 'ACTIVE' | 'NORMAL';
  avatars: string[];
  actionTab?: NavigationTab;
  actionLabel: string;
}

interface CockpitTelemetryCardProps {
  telemetryEvents: TelemetryEvent[];
  activeFilter: 'ALL' | 'SWEEPING' | 'DUNNING' | 'AUDIT';
  onFilterChange: (filter: 'ALL' | 'SWEEPING' | 'DUNNING' | 'AUDIT') => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const CockpitTelemetryCard: React.FC<CockpitTelemetryCardProps> = ({
  telemetryEvents,
  activeFilter,
  onFilterChange,
  onNavigate
}) => {
  const filteredTelemetry = activeFilter === 'ALL'
    ? telemetryEvents
    : telemetryEvents.filter(e => e.category === activeFilter);

  return (
    <div className="homies-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
      {/* Header Card 1 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="homies-pill-btn" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.04)', 
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              fontSize: '0.74rem',
              padding: '3px 10px'
            }}
          >
            1 Okt 2026 ▾
          </button>
          <h3 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
            Otomasi & Jadwal
          </h3>
        </div>
        <button className="homies-icon-btn" style={{ width: '28px', height: '28px' }}>
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Pill Tab Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button 
          className={`homies-pill-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => onFilterChange('ALL')}
        >
          Semua ({telemetryEvents.length})
        </button>
        <button 
          className={`homies-pill-btn ${activeFilter === 'SWEEPING' ? 'active' : ''}`}
          onClick={() => onFilterChange('SWEEPING')}
        >
          Likuiditas
        </button>
        <button 
          className={`homies-pill-btn ${activeFilter === 'AUDIT' ? 'active' : ''}`}
          onClick={() => onFilterChange('AUDIT')}
        >
          Audit SAK EMKM
        </button>
        <button 
          className={`homies-pill-btn ${activeFilter === 'DUNNING' ? 'active' : ''}`}
          onClick={() => onFilterChange('DUNNING')}
        >
          Penagihan AR
        </button>
      </div>

      {/* Event Items Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {filteredTelemetry.map((item, idx) => {
          const isHighlight = idx === 0;
          const badgeColors: Record<string, { bg: string; color: string; label: string }> = {
            SWEEPING: { bg: 'rgba(0, 223, 143, 0.12)', color: 'var(--mint-neon)', label: 'FinOrchestrator AI' },
            AUDIT: { bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', label: 'ACID SAK EMKM' },
            DUNNING: { bg: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', label: 'WhatsApp Dunning' }
          };
          const badge = badgeColors[item.category] || { bg: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0', label: item.source };

          return (
            <div 
              key={item.id}
              onClick={() => item.actionTab && onNavigate(item.actionTab)}
              className={isHighlight ? 'homies-card-highlight' : 'homies-card-inner'}
              style={{
                padding: '11px 14px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                <h4 style={{ 
                  fontSize: '0.84rem', 
                  fontWeight: 600, 
                  color: '#FFFFFF', 
                  margin: 0,
                  lineHeight: 1.3
                }}>
                  {item.title}
                </h4>
              </div>

              <p style={{ 
                fontSize: '0.72rem', 
                color: isHighlight ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8', 
                margin: '0 0 8px 0',
                lineHeight: 1.35
              }}>
                {item.subtitle}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.66rem',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: badge.bg,
                    color: badge.color,
                    fontWeight: 600
                  }}>
                    {badge.label}
                  </span>
                  <span style={{
                    fontSize: '0.66rem',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#94a3b8'
                  }}>
                    {item.timeRange}
                  </span>
                </div>

                {/* Explicit Action CTA Button */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '0.70rem',
                  color: 'var(--mint-neon)',
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  <span>{item.actionLabel}</span>
                  <ArrowUpRight size={11} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
