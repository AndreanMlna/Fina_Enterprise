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
  Bell,
  CheckCircle2,
  CircleDot,
  Clock,
  Coins,
  Star
} from 'lucide-react';
import type { NavigationTab, Tenant, UserRole } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  userRole: UserRole;
  tenant?: Tenant | null;
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
    label: 'Time Manage',
    sublabel: 'Kasir POS & Shift',
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
    label: 'Payroll',
    sublabel: 'Likuiditas & Kas',
    icon: Coins,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  },
  {
    id: 'forensics',
    label: 'Reviews',
    sublabel: 'Forensik & Audit',
    icon: Star,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  }
] as const;

// Kategori Modul Favorit & Lanjutan
const FAVORITE_ITEMS: readonly NavSubItem[] = [
  {
    id: 'b2b_benchmark',
    label: 'Opportunity Stages (B2B Grosir)',
    icon: Scale,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  },
  {
    id: 'loan_deobfuscator',
    label: 'Key Metrics (Anti-Renternir)',
    icon: ShieldAlert,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  },
  {
    id: 'ar_dunning',
    label: 'Product Plan (Penagihan AR)',
    icon: MessageSquareShare,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  }
] as const;

const OTHER_ITEMS: readonly NavSubItem[] = [
  {
    id: 'voice_dialect',
    label: 'Dialek Suara AI',
    icon: Mic2,
    allowedRoles: new Set(['OWNER', 'MANAGER'])
  }
] as const;

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, userRole, tenant }) => {
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

  const visibleOthers = OTHER_ITEMS.filter(o => 
    o.allowedRoles.has(userRole) && 
    (!navSearch.trim() || o.label.toLowerCase().includes(navSearch.toLowerCase()))
  );

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '0 0 20px 20px',
      flexShrink: 0
    }}>
      {/* Container Sidebar Homies Card */}
      <div className="homies-card" style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Logo Brand: Homies Lab -> FINA Enterprise */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 4px' }}>
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

        {/* Search Input: Q Search here.. */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '10px',
          padding: '7px 12px'
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

        {/* 2-Column Squircle Navigation Grid Tiles (6 Modul Utama) */}
        <div className="homies-nav-grid">
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
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
                    textAlign: 'left'
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
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
                    textAlign: 'left'
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

        {/* User Mini Profile di Bawah Sidebar (Sesuai Referensi) */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
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

          <button className="homies-icon-btn" style={{ width: '28px', height: '28px' }} title="Notifikasi Sistem">
            <Bell size={13} />
          </button>
        </div>

      </div>

      {/* Box Kepatuhan Hukum & Standar SAK EMKM */}
      <div className="homies-card-inner" style={{ padding: '12px 14px', border: '1px solid rgba(0, 223, 143, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <CheckCircle2 size={14} color="var(--mint-neon)" />
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#FFFFFF' }}>
            UU PDP & SAK EMKM
          </span>
        </div>
        <p style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>
          Enkripsi AES-256 GCM, SHA-256 Merkle Ledger & Isolasi Multi-Tenant Aktif.
        </p>
      </div>

    </aside>
  );
};
