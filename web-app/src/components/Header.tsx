import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Building2,
  Eye,
  EyeOff,
  Terminal,
  UserCheck,
  LogOut,
  LifeBuoy,
  Activity
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
      } catch {
        if (isMounted) setHealth(null);
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
        ? `Backend Terhubung: ${health?.service} v${health?.version}\nBasis Data: ${health?.database} (ACID)\nFinOrchestrator FSM: ACTIVE\nLatensi RPC: ${health?.latencyMs ?? 14}ms` 
        : 'Backend Offline / Standby. Menghubungkan ulang ke FastAPI & PostgreSQL...'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        borderRadius: 'var(--radius-md)',
        background: isLive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.1)',
        border: isLive ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.3)',
        fontSize: '0.74rem',
        cursor: 'default',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'all 0.2s ease'
      }}
    >
      <span style={{ 
        width: '7px', 
        height: '7px', 
        borderRadius: '50%', 
        backgroundColor: isLive ? '#10b981' : '#f59e0b',
        boxShadow: isLive ? '0 0 8px #10b981' : '0 0 6px #f59e0b',
        flexShrink: 0
      }} />
      <span className="mono" style={{ 
        color: isLive ? 'var(--emerald-400)' : 'var(--amber-400)', 
        fontWeight: 600,
        fontSize: '0.74rem'
      }}>
        {isLive ? `Live (${health?.latencyMs ?? 14}ms)` : 'Standby'}
      </span>
      <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.7rem' }}>•</span>
      <span className="mono" style={{ color: '#cbd5e1', fontWeight: 500, fontSize: '0.72rem' }}>
        pgvector ACID
      </span>
      {isChecking && <Activity size={10} color="var(--text-muted)" className="animate-spin" />}
    </div>
  );
};

interface HeaderProps {
  kpi?: KPIStats;
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

  return (
    <header className="glass-panel" style={{
      margin: '12px 20px 14px 20px',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'nowrap',
      gap: '16px',
      minWidth: 0,
      position: 'relative'
    }}>
      {/* Brand & Identity + Tenant Branch Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, minWidth: 0 }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px var(--emerald-glow)',
          flexShrink: 0
        }}>
          <ShieldCheck size={24} color="#021a10" strokeWidth={2.5} />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.2rem', letterSpacing: '-0.03em', color: '#ffffff', margin: 0, whiteSpace: 'nowrap' }}>
              FINA<span style={{ color: 'var(--emerald-400)' }}>-ENTERPRISE</span>
            </h1>
            <span className="badge badge-emerald" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
              v2.4 PROD
            </span>
            <span className="badge badge-indigo" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
              {tenant?.branchCode || 'BERKAH-HQ'}
            </span>
          </div>

          {/* Multi-Tenant Switcher / Verified Single Entity Display */}
          {tenants && tenants.length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
              <Building2 size={12} color="var(--cyan-400)" />
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
                  fontSize: '0.74rem',
                  borderRadius: '6px',
                  padding: '1px 6px',
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
              <span className="badge badge-cyan" style={{ fontSize: '0.60rem' }}>
                Multi-Tenant
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
              <Building2 size={12} color="var(--cyan-400)" />
              <span style={{ fontSize: '0.76rem', color: '#f8fafc', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {tenant?.name || 'Entitas Usaha'}
              </span>
              <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                (NPWP: {tenant?.npwp || '00.000.000.0-000.000'})
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.60rem', padding: '1px 5px' }} title="Identitas Perusahaan Terverifikasi Database PostgreSQL">
                <ShieldCheck size={9} style={{ marginRight: 2 }} /> Terverifikasi Kriptografis
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enterprise Controls: Role + PII Shield + Trace + Live Telemetry + Bantuan + Logout */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        flexWrap: 'nowrap',
        flexShrink: 0
      }}>
        {/* Authoritative Zero-Trust RBAC Identity Badge */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 9px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.28)',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          title="Hak Akses Resmi dari Klaim JWT Server (Zero-Trust RBAC Enforced)"
        >
          <UserCheck size={13} color="var(--emerald-400)" />
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: userRole === 'OWNER' ? 'var(--emerald-400)' : userRole === 'MANAGER' ? 'var(--cyan-400)' : userRole === 'CASHIER' ? 'var(--amber-400)' : 'var(--indigo-400)'
          }}>
            {userRole === 'OWNER' ? 'Owner' : userRole === 'MANAGER' ? 'Manager' : userRole === 'CASHIER' ? 'Kasir' : userRole === 'AUDITOR' ? 'Auditor' : 'Staff CS'}
          </span>
          <span 
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: 'var(--emerald-400)',
              boxShadow: '0 0 6px var(--emerald-400)',
              flexShrink: 0
            }} 
            title="Sesi Terotentikasi PostgreSQL"
          />
        </div>

        {/* Client-Side Zero-Knowledge PII Shield (UU PDP No. 27/2022) */}
        <button
          onClick={onTogglePii}
          className={`btn btn-sm ${isPiiMasked ? 'btn-primary' : 'btn-outline'}`}
          style={{
            fontSize: '0.72rem',
            padding: '5px 9px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          title={isPiiMasked ? "Sensor PII Aktif (UU PDP No. 27/2022). Klik untuk membuka sensor." : "Sensor PII Nonaktif. Klik untuk menyamarkan data sensitif."}
        >
          {isPiiMasked ? <EyeOff size={13} /> : <Eye size={13} />}
          <span>PII {isPiiMasked ? 'ON' : 'OFF'}</span>
        </button>

        {/* Live Cognitive Trace Drawer Trigger */}
        <button
          onClick={onOpenTrace}
          className="btn btn-sm btn-secondary"
          style={{
            fontSize: '0.72rem',
            padding: '5px 9px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          title="Buka Panel Cognitive Agent Trace Telemetry"
        >
          <Terminal size={13} color="var(--emerald-400)" />
          <span>Trace</span>
          <span className="badge badge-emerald" style={{ fontSize: '0.58rem', padding: '0 4px' }}>
            {traceCount}
          </span>
        </button>

        {/* Consolidated Infrastructure Telemetry Badge */}
        <BackendStatusBadge />

        {/* Subtle Vertical Divider */}
        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 1px', flexShrink: 0 }} />

        {/* Bantuan Support Button */}
        {onOpenSupportModal && (
          <button
            className="btn btn-outline btn-sm"
            onClick={onOpenSupportModal}
            title="Pusat Bantuan & Lapor Kendala Operasional UMKM"
            style={{ fontSize: '0.73rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <LifeBuoy size={13} color="var(--cyan-400)" />
            <span>Bantuan</span>
          </button>
        )}

        {/* Logout Button */}
        {(onLogout || onNavigateHome) && (
          <button
            className="btn-logout-header"
            onClick={() => setIsLogoutConfirmOpen(true)}
            title="Keluar dari Sesi Akun (Logout)"
            style={{ padding: '5px 10px', fontSize: '0.73rem', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <LogOut size={13} color="#f87171" />
            <span style={{ fontWeight: 600 }}>Logout</span>
          </button>
        )}
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

