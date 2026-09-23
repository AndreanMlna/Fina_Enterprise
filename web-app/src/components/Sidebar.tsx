import React from 'react';
import {
  LayoutDashboard,
  BookOpenCheck,
  TrendingUp,
  ShieldAlert,
  ScanEye,
  Scale,
  MessageSquareShare,
  Mic2,
  Zap,
  CheckCircle2
} from 'lucide-react';
import type { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const navItems = [
    {
      id: 'cockpit' as NavigationTab,
      label: 'Executive Cockpit',
      description: 'Ringkasan KPI & FHI SAK EMKM',
      icon: LayoutDashboard,
      badge: 'LIVE',
      badgeColor: 'badge-emerald'
    },
    {
      id: 'ledger' as NavigationTab,
      label: 'Semantic Ledger',
      description: 'Buku Besar Double-Entry ACID',
      icon: BookOpenCheck,
      badge: 'PP 55/2022',
      badgeColor: 'badge-cyan'
    },
    {
      id: 'montecarlo' as NavigationTab,
      label: 'Liquidity Runway Engine',
      description: '10.000 Iterasi Monte Carlo',
      icon: TrendingUp,
      badge: 'Stokastik',
      badgeColor: 'badge-indigo'
    },
    {
      id: 'loan_deobfuscator' as NavigationTab,
      label: 'Anti-Predatory Loan',
      description: 'Deobfuscator & APR Riil OJK',
      icon: ShieldAlert,
      badge: 'Shield',
      badgeColor: 'badge-rose'
    },
    {
      id: 'forensics' as NavigationTab,
      label: 'Receipt Forensics Studio',
      description: 'Deteksi Manipulasi Nota & ELA',
      icon: ScanEye,
      badge: 'Vision AI',
      badgeColor: 'badge-amber'
    },
    {
      id: 'b2b_benchmark' as NavigationTab,
      label: 'B2B Price Intelligence',
      description: 'Benchmark Harga Bahan Baku',
      icon: Scale,
      badge: 'Ramp-Style',
      badgeColor: 'badge-cyan'
    },
    {
      id: 'ar_dunning' as NavigationTab,
      label: 'AR Dunning & Collection',
      description: 'Penagihan WhatsApp & QRIS',
      icon: MessageSquareShare,
      badge: 'Otonom',
      badgeColor: 'badge-emerald'
    },
    {
      id: 'voice_dialect' as NavigationTab,
      label: 'Voice Dialect Console',
      description: 'Whisper Jawa, Sunda & Indo',
      icon: Mic2,
      badge: 'Multi-Lingual',
      badgeColor: 'badge-indigo'
    }
  ];

  return (
    <aside style={{
      width: '280px',
      minWidth: '280px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '0 0 20px 20px'
    }}>
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Zap size={13} color="var(--emerald-400)" />
          <span>Autonomous Modules</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`nav-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <div className={`nav-sidebar-icon ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '4px'
                }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#ffffff' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.label}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.description}
                </div>
              </div>

              <span className={`badge ${item.badgeColor}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Trust & Audit Box */}
      <div className="glass-panel" style={{ padding: '14px', background: 'rgba(99, 102, 241, 0.06)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <CheckCircle2 size={16} color="#818cf8" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e0e7ff' }}>
            UU PDP No. 27/2022
          </span>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Data finansial diproteksi enkripsi AES-256 GCM & PII Masking lokal. Tidak ada data pribadi bocor ke model LLM.
        </p>
      </div>
    </aside>
  );
};
