import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpenCheck,
  ShieldAlert,
  Scale,
  MessageSquareShare,
  Mic2,
  Users,
  Search,
  ChevronDown,
  CheckCircle2,
  CircleDot,
  Clock,
  Coins,
  Star,
  Rocket,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import type { NavigationTab, Tenant, UserRole } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  userRole: UserRole;
  tenant?: Tenant | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavTile {
  id: NavigationTab;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  allowedRoles: ReadonlySet<UserRole>;
}

interface NavSubItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  allowedRoles: ReadonlySet<UserRole>;
}

// 6 Squircle Grid Tiles Utama (Sesuai 2-kolom grid pada referensi Homies Lab: Dashboard, Employees, Time Manage, Finance, Payroll, Reviews)
const PRIMARY_TILES: readonly NavTile[] = [
  {
    id: 'cockpit',
    label: 'Dashboard',
    sublabel: 'Cockpit Bisnis',
    icon: LayoutDashboard,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  },
  {
    id: 'staff',
    label: 'Employees',
    sublabel: 'Staf & Kasir',
    icon: Users,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  },
  {
    id: 'pos',
    label: 'POS',
    sublabel: 'Kasir & Transaksi',
    icon: Clock,
    allowedRoles: new Set(['OWNER', 'MANAGER', 'CASHIER'])
  },
  {
    id: 'ledger',
    label: 'Finance',
    sublabel: 'Buku SAK EMKM',
    icon: BookOpenCheck,
    allowedRoles: new Set(['OWNER', 'MANAGER', 'AUDITOR'])
  },
  {
    id: 'montecarlo',
    label: 'Simulasi',
    sublabel: 'Likuiditas & Kas',
    icon: Coins,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  },
  {
    id: 'forensics',
    label: 'Forensik',
    sublabel: 'Audit & Integritas',
    icon: Star,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  }
] as const;

// Kategori Modul Favorit & Lanjutan
const FAVORITE_ITEMS: readonly NavSubItem[] = [
  {
    id: 'b2b_benchmark',
    label: 'B2B Grosir',
    icon: Scale,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  },
  {
    id: 'loan_deobfuscator',
    label: 'Anti-Renternir',
    icon: ShieldAlert,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  },
  {
    id: 'ar_dunning',
    label: 'Penagihan AR',
    icon: MessageSquareShare,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  }
] as const;

const OTHER_ITEMS: readonly NavSubItem[] = [
  {
    id: 'initial_setup',
    label: 'Setup Modal & Saldo Awal',
    icon: Rocket,
    allowedRoles: new Set(['OWNER'])
  },
  {
    id: 'voice_dialect',
    label: 'Dialek Suara AI',
    icon: Mic2,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  }
] as const;

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, userRole, tenant, isCollapsed = false, onToggleCollapse }) => {
  const [navSearch, setNavSearch] = useState('');
  const [favOpen, setFavOpen] = useState(true);
  const [otherOpen, setOtherOpen] = useState(true);

  // Filter RBAC PoLP
  const visibleTiles = PRIMARY_TILES.filter(t => 
    t.allowedRoles.has(userRole) && 
    (!navSearch.trim() || t.label.toLowerCase().includes(navSearch.toLowerCase()))
  );

  const visibleFavorites = FAVORITE_ITEMS.filter(f => 
    f.allowedRoles.has(userRole) && 
    (!navSearch.trim() || f.label.toLowerCase().includes(navSearch.toLowerCase()))
  );

  const visibleOthers = OTHER_ITEMS.map(o => {
    if (o.id === 'initial_setup') {
      return {
        ...o,
        label: tenant?.isSetupComplete ? 'Monitoring Modal & Ekuitas' : 'Setup Modal & Saldo Awal',
        icon: tenant?.isSetupComplete ? ShieldCheck : Rocket
      };
    }
    return o;
  }).filter(o => 
    o.allowedRoles.has(userRole) && 
    (!navSearch.trim() || o.label.toLowerCase().includes(navSearch.toLowerCase()))
  );

  /* ======== COLLAPSED MODE: Icon-only rail ======== */
  if (isCollapsed) {
    return (
      <aside style={{
        width: '62px',
        minWidth: '62px',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 0 16px 12px',
        flexShrink: 0,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div className="homies-card" style={{
          padding: '10px 6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Toggle button */}
          <button
            onClick={onToggleCollapse}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '7px',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px',
              flexShrink: 0,
              transition: 'color 0.15s ease'
            }}
            title="Expand sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>

          {/* Scrollable Icon List */}
          <div className="custom-scrollbar" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            width: '100%',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto'
          }}>
            {/* Icon-only nav tiles */}
            {visibleTiles.map((tile) => {
              const Icon = tile.icon;
              const isActive = activeTab === tile.id;
              return (
                <button
                  key={tile.id}
                  onClick={() => onSelectTab(tile.id)}
                  title={tile.label}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    border: isActive ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.15) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? '#34d399' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 10px rgba(16, 185, 129, 0.18)' : 'none'
                  }}
                >
                  <Icon size={17} />
                </button>
              );
            })}

            {/* Divider */}
            <div style={{ width: '24px', height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '4px 0', flexShrink: 0 }} />

            {/* Favorite + Other icons */}
            {[...visibleFavorites, ...visibleOthers].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={item.label}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'rgba(0, 223, 143, 0.15)' : 'transparent',
                    color: isActive ? 'var(--mint-neon)' : '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </div>

          {/* User Mini Profile Avatar (Pinned Bottom) */}
          <div style={{ marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', flexShrink: 0 }}>
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60"
              alt="Owner"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
              title={tenant?.name || 'Owner FINA'}
            />
          </div>
        </div>
      </aside>
    );
  }

  /* ======== EXPANDED MODE: Full sidebar ======== */
  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      height: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '8px 0 12px 20px',
      flexShrink: 0,
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Container Sidebar Homies Card */}
      <div className="homies-card" style={{
        padding: '14px 12px 10px 12px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        
        {/* Zone 1: Logo Brand + Collapse Toggle (Pinned Top) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px', flexShrink: 0, marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '2px solid var(--mint-neon)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px var(--mint-glow)',
              flexShrink: 0
            }}>
              <CircleDot size={16} color="var(--mint-neon)" />
            </div>
            <span style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em'
            }}>
              FINA Enterprise
            </span>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '5px',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              title="Collapse sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          )}
        </div>

        {/* Zone 2: Middle Scrollable Container (with .custom-scrollbar) */}
        <div className="custom-scrollbar" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {/* Search Input: Q Search here.. */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '10px',
            padding: '7px 12px',
            flexShrink: 0
          }}>
            <Search size={14} color="#64748B" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search here.."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                width: '100%'
              }}
            />
          </div>
          
          {/* Banner Navigasi Khusus Owner: Onboarding vs Monitoring Usaha */}
          {userRole === 'OWNER' && (
            <div 
              onClick={() => onSelectTab('initial_setup')}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: activeTab === 'initial_setup'
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.16) 100%)'
                  : tenant?.isSetupComplete
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
                border: activeTab === 'initial_setup'
                  ? '1px solid rgba(0, 223, 143, 0.5)'
                  : tenant?.isSetupComplete
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(16, 185, 129, 0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: activeTab === 'initial_setup' ? '0 2px 10px rgba(0, 223, 143, 0.15)' : 'none',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: tenant?.isSetupComplete ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0, 223, 143, 0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {tenant?.isSetupComplete ? (
                  <ShieldCheck size={16} color="#38BDF8" />
                ) : (
                  <Rocket size={15} color="var(--mint-neon)" />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {tenant?.isSetupComplete ? 'Monitoring Usaha' : 'Setup Saldo Awal'}
                </span>
                <span style={{ fontSize: '0.66rem', color: tenant?.isSetupComplete ? '#38BDF8' : '#94A3B8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {tenant?.isSetupComplete ? 'Evaluasi modal & eksekusi ➔' : 'Input kas, stok & aset awal ➔'}
                </span>
              </div>
            </div>
          )}

          {/* 2-Column Squircle Navigation Grid Tiles (6 Modul Utama) */}
          <div className="homies-nav-grid" style={{ flexShrink: 0 }}>
            {visibleTiles.map((tile) => {
              const Icon = tile.icon;
              const isActive = activeTab === tile.id;
              return (
                <button
                  key={tile.id}
                  onClick={() => onSelectTab(tile.id)}
                  className={`homies-nav-tile ${isActive ? 'active' : ''}`}
                  style={{ border: 'none' }}
                >
                  <Icon size={18} />
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: isActive ? '#0B1118' : '#94A3B8' }}>
                    {tile.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Section: Favorite */}
          {visibleFavorites.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px', flexShrink: 0 }}>
              <div 
                onClick={() => setFavOpen(!favOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                <ChevronDown size={13} style={{ transform: favOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                <span>Favorite</span>
              </div>

              {favOpen && visibleFavorites.map((fav) => {
                const Icon = fav.icon;
                const isActive = activeTab === fav.id;
                return (
                  <button
                    key={fav.id}
                    onClick={() => onSelectTab(fav.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(0, 223, 143, 0.12)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={14} color={isActive ? 'var(--mint-neon)' : '#64748B'} />
                    <span style={{
                      fontSize: '0.76rem',
                      color: isActive ? 'var(--mint-neon)' : '#cbd5e1',
                      fontWeight: isActive ? 600 : 500
                    }}>
                      {fav.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Section: Modul Lainnya / Marketing */}
          {visibleOthers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px', flexShrink: 0 }}>
              <div 
                onClick={() => setOtherOpen(!otherOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                <ChevronDown size={13} style={{ transform: otherOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                <span>Modul Lainnya</span>
              </div>

              {otherOpen && visibleOthers.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(0, 223, 143, 0.12)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={14} color={isActive ? 'var(--mint-neon)' : '#64748B'} />
                    <span style={{
                      fontSize: '0.76rem',
                      color: isActive ? 'var(--mint-neon)' : '#cbd5e1',
                      fontWeight: isActive ? 600 : 500
                    }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Zone 3: Pinned Bottom - User Mini Profile */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60"
              alt="Owner"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
            />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#FFFFFF', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tenant?.name || 'Owner FINA'}>
                {tenant?.name || 'andrian maulana'}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--mint-neon)' }}>
                ● {userRole} • {tenant?.branchCode || 'UMKM'}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Compliance Badge - Pinned at bottom of aside */}
      <div className="homies-card-inner" style={{ padding: '8px 12px', border: '1px solid rgba(0, 223, 143, 0.15)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={13} color="var(--mint-neon)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1' }}>
            SAK EMKM • UU PDP
          </span>
        </div>
      </div>

    </aside>
  );
};
