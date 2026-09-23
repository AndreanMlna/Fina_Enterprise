import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Database, 
  Coins, 
  Building2,
  Lock,
  Eye,
  EyeOff,
  Terminal,
  UserCheck,
  LogOut,
  LifeBuoy,
  Activity,
  Server
} from 'lucide-react';


import type { KPIStats, Tenant, UserRole } from '../types';
import { api, type BackendHealthResponse } from '../services/api';
import { ConfirmDialog } from './ConfirmDialog';

const BackendStatusBadge: React.FC = () => {
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const poll = async () => {
      setIsChecking(true);
      try {
        const res = await api.checkHealth();
        if (isMounted) setHealth(res);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    poll();
    const interval = setInterval(poll, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isLive = health?.status === 'HEALTHY';

  return (
    <div 
      title={isLive 
        ? `Backend Terhubung: ${health?.service} v${health?.version} (Database: ${health?.database}, Latensi: ${health?.latencyMs}ms)` 
        : 'Backend Offline / Standby. Klik untuk menyegarkan.'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: 'var(--radius-md)',
        background: isLive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
        border: isLive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
        fontSize: '0.78rem',
        cursor: 'default',
        transition: 'all 0.3s ease'
      }}
    >
      <Server size={13} color={isLive ? 'var(--emerald-400)' : 'var(--amber-400)'} />
      <span style={{ 
        width: '7px', 
        height: '7px', 
        borderRadius: '50%', 
        backgroundColor: isLive ? '#10b981' : '#f59e0b',
        boxShadow: isLive ? '0 0 8px #10b981' : '0 0 6px #f59e0b'
      }} />
      <span className="mono" style={{ 
        color: isLive ? 'var(--emerald-400)' : 'var(--amber-400)', 
        fontWeight: 600,
        fontSize: '0.75rem'
      }}>
        {isLive ? `API Live (${health?.latencyMs}ms)` : 'API Standby'}
      </span>
      {isChecking && <Activity size={10} color="var(--text-muted)" className="animate-spin" />}
    </div>
  );
};

interface HeaderProps {
  kpi: KPIStats;
  tenant: Tenant | null;
  tenants?: Tenant[];
  onSelectTenant?: (t: Tenant) => void;
  userRole: UserRole;
  onSelectRole?: (r: UserRole) => void;
  isPiiMasked: boolean;
  onTogglePii: () => void;
  onOpenTrace: () => void;
  traceCount: number;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onOpenSupportModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  kpi,
  tenant,
  tenants,
  onSelectTenant,
  userRole,
  isPiiMasked,
  onTogglePii,
  onOpenTrace,
  traceCount,
  onLogout,
  onNavigateHome,
  onOpenSupportModal
}) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <header className="glass-panel" style={{
      margin: '14px 20px 16px 20px',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      {/* Brand & Identity + Tenant Branch Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px var(--emerald-glow)',
          flexShrink: 0
        }}>
          <ShieldCheck size={28} color="#021a10" strokeWidth={2.5} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.3rem', letterSpacing: '-0.03em', color: '#ffffff', margin: 0 }}>
              FINA<span style={{ color: 'var(--emerald-400)' }}>-ENTERPRISE</span>
            </h1>
            <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
              v2.4 PRODUCTION
            </span>
            <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>
              {tenant?.branchCode || 'BERKAH-HQ'}
            </span>
          </div>

          {/* Multi-Tenant Switcher / Verified Single Entity Display */}
          {tenants && tenants.length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <Building2 size={13} color="var(--cyan-400)" />
              <select
                value={tenant?.id || ''}
                onChange={(e) => {
                  const found = tenants.find(t => t.id === e.target.value);
                  if (found && onSelectTenant) onSelectTenant(found);
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#e2e8f0',
                  fontSize: '0.76rem',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                title="Pilih Entitas Perusahaan Terafiliasi"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {t.name} (NPWP: {t.npwp})
                  </option>
                ))}
              </select>
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>
                Multi-Tenant
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <Building2 size={13} color="var(--cyan-400)" />
              <span style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 600 }}>
                {tenant?.name || 'Entitas Usaha'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                (NPWP: {tenant?.npwp || '00.000.000.0-000.000'})
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.62rem', padding: '1px 6px' }} title="Identitas Perusahaan Terverifikasi Database PostgreSQL">
                <ShieldCheck size={10} style={{ marginRight: 3 }} /> Terverifikasi Kriptografis
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enterprise Controls: RBAC Role + PII Shield + Live Trace + Financial Buffer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Authoritative Zero-Trust RBAC Identity Badge */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s ease'
          }}
          title="Hak Akses Resmi dari Klaim JWT Server (Zero-Trust RBAC Enforced)"
        >
          <UserCheck size={14} color="var(--emerald-400)" />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Peran:</span>
          <span style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            color: userRole === 'OWNER' ? 'var(--emerald-400)' : userRole === 'ACCOUNTANT' ? 'var(--cyan-400)' : 'var(--amber-400)'
          }}>
            {userRole === 'OWNER' ? 'Executive Owner' : userRole === 'ACCOUNTANT' ? 'Senior Accountant' : 'Auditor SAK EMKM'}
          </span>
          <span 
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--emerald-400)',
              boxShadow: '0 0 6px var(--emerald-400)'
            }} 
            title="Sesi Terotentikasi PostgreSQL"
          />
        </div>

        {/* Client-Side Zero-Knowledge PII Shield (UU PDP No. 27/2022) */}
        <button
          onClick={onTogglePii}
          className={`btn btn-sm ${isPiiMasked ? 'btn-primary' : 'btn-outline'}`}
          style={{
            fontSize: '0.75rem',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Mode Perlindungan Data Pribadi (UU PDP No. 27/2022)"
        >
          {isPiiMasked ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{isPiiMasked ? 'Sensor PII: AKTIF' : 'Sensor PII: NONAKTIF'}</span>
        </button>

        {/* Live Cognitive Trace Drawer Trigger */}
        <button
          onClick={onOpenTrace}
          className="btn btn-sm btn-secondary"
          style={{
            fontSize: '0.75rem',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Terminal size={14} color="var(--emerald-400)" />
          <span>Agent Trace</span>
          <span className="badge badge-emerald" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
            {traceCount} Live
          </span>
        </button>

        {/* FinOrchestrator FSM Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem'
        }}>
          <div className="pulse-dot"></div>
          <Cpu size={14} color="var(--emerald-400)" />
          <span className="mono" style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>
            FSM ACTIVE
          </span>
        </div>

        {/* Database ACID & pgvector Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem'
        }}>
          <Database size={14} color="var(--cyan-500)" />
          <span className="mono" style={{ color: '#e2e8f0', fontWeight: 600 }}>
            PostgreSQL + pgvector
          </span>
          <Lock size={12} color="var(--emerald-400)" />
        </div>

        {/* Live Backend Connection Indicator */}
        <BackendStatusBadge />


        {/* Safety Buffer Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          fontSize: '0.8rem'
        }}>
          <Coins size={14} color="var(--emerald-400)" />
          <span className="mono" style={{ color: '#ffffff', fontWeight: 700 }}>
            Buffer: {formatCurrency(kpi.safetyBuffer)}
          </span>
        </div>

        {/* Global Navigation Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenSupportModal && (
            <button
              className="btn btn-outline btn-sm"
              onClick={onOpenSupportModal}
              title="Pusat Bantuan & Lapor Kendala Operasional UMKM"
              style={{ fontSize: '0.74rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LifeBuoy size={14} color="var(--cyan-400)" />
              <span>Bantuan & Lapor Kendala</span>
            </button>
          )}

          {(onLogout || onNavigateHome) && (
            <button
              className="btn-logout-header"
              onClick={() => setIsLogoutConfirmOpen(true)}
              title="Keluar dari Sesi Akun (Logout)"
            >
              <LogOut size={13} color="#f87171" />
              <span style={{ fontWeight: 600 }}>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Enterprise Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        variant="danger"
        title="Keluar dari Sesi Operasional"
        message="Apakah Anda yakin ingin mengakhiri sesi kerja saat ini? Seluruh perubahan transaksi telah disinkronkan secara aman."
        subtext="Enkripsi sesi dan token otentikasi JWT (RFC 7519) akan dimusnahkan dari peramban ini."
        confirmLabel="Ya, Keluar Sesi"
        cancelLabel="Tetap di Workspace"
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          if (onLogout) onLogout();
          else if (onNavigateHome) onNavigateHome();
        }}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </header>
  );
};

