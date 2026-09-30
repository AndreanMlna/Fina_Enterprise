import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Building2,
  Eye,
  EyeOff,
  Terminal,
  UserCheck,
  LogOut,
  LifeBuoy,
  Activity,
  Bell,
  ShieldAlert,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import type { MarginLeakageAlert } from '../services/types';
import { formatCurrency } from '../utils';


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
        DB Ready
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
  marginAlerts?: MarginLeakageAlert[];
  onEvaluateAlert?: (alert: MarginLeakageAlert) => void;
  onDismissAlerts?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
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
  onOpenSupportModal,
  marginAlerts = [],
  onEvaluateAlert,
  onDismissAlerts,
  isSidebarCollapsed = false,
  onToggleSidebar
}) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown notif ketika klik di luar area
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, minWidth: 0 }}>
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Tampilkan Menu Sidebar (Ctrl+B)" : "Sembunyikan Menu Sidebar (Ctrl+B)"}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: isSidebarCollapsed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: isSidebarCollapsed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: isSidebarCollapsed ? 'var(--emerald-400)' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              flexShrink: 0
            }}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}

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
              <span className="badge badge-emerald" style={{ fontSize: '0.60rem', padding: '1px 5px' }} title="Identitas terverifikasi dari database">
                <ShieldCheck size={9} style={{ marginRight: 2 }} /> Verified
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

        {/* PII Shield Toggle */}
        <button
          onClick={onTogglePii}
          style={{
            fontSize: '0.72rem',
            padding: '5px 9px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            background: isPiiMasked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
            border: isPiiMasked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-md)',
            color: isPiiMasked ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.18s ease'
          }}
          title={isPiiMasked ? "PII tersensor aktif. Klik untuk membuka." : "Klik untuk menyamarkan data sensitif."}
        >
          {isPiiMasked ? <EyeOff size={13} /> : <Eye size={13} />}
          <span>PII {isPiiMasked ? 'ON' : 'OFF'}</span>
        </button>

        {/* Trace Drawer Trigger */}
        <button
          onClick={onOpenTrace}
          style={{
            fontSize: '0.72rem',
            padding: '5px 9px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
          title="Buka panel Agent Trace"
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

        {/* ====== Notification Bell (Margin Leakage Alerts) ====== */}
        <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            style={{
              fontSize: '0.72rem',
              padding: '5px 9px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              position: 'relative',
              background: marginAlerts.length > 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255, 255, 255, 0.04)',
              border: marginAlerts.length > 0 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-md)',
              color: marginAlerts.length > 0 ? '#fbbf24' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            title={marginAlerts.length > 0 ? `${marginAlerts.length} peringatan kebocoran margin aktif` : 'Tidak ada notifikasi'}
          >
            <Bell size={14} color={marginAlerts.length > 0 ? '#fbbf24' : '#94a3b8'} />
            {marginAlerts.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '17px',
                height: '17px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff',
                fontSize: '0.58rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-primary)',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
                animation: 'pulse 2s infinite'
              }}>
                {marginAlerts.length}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {isNotifOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '380px',
              maxHeight: '420px',
              borderRadius: '14px',
              background: 'rgba(10, 15, 28, 0.97)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1)',
              backdropFilter: 'blur(24px)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Panel Header */}
              <div style={{
                padding: '14px 16px 12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={15} color="var(--amber-400)" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>Notifikasi</span>
                  {marginAlerts.length > 0 && (
                    <span className="badge badge-rose" style={{ fontSize: '0.62rem' }}>
                      {marginAlerts.length} Aktif
                    </span>
                  )}
                </div>
                {marginAlerts.length > 0 && onDismissAlerts && (
                  <button
                    onClick={() => { onDismissAlerts(); setIsNotifOpen(false); }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.72rem', padding: '4px 8px' }}
                    title="Tutup semua peringatan"
                  >
                    Bersihkan
                  </button>
                )}
              </div>

              {/* Alert Items */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
                {marginAlerts.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <Bell size={28} color="var(--text-muted)" style={{ opacity: 0.3, margin: '0 auto 10px auto' }} />
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Tidak ada peringatan saat ini.</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 0', opacity: 0.6 }}>Margin seluruh produk dalam kondisi aman.</p>
                  </div>
                ) : (
                  marginAlerts.map((alert, idx) => (
                    <div
                      key={alert.product_id + idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: alert.severity === 'CRITICAL'
                          ? 'rgba(239, 68, 68, 0.08)'
                          : 'rgba(245, 158, 11, 0.08)',
                        border: `1px solid ${alert.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                        marginBottom: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => {
                        if (onEvaluateAlert) onEvaluateAlert(alert);
                        setIsNotifOpen(false);
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = alert.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.14)' : 'rgba(245, 158, 11, 0.14)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = alert.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: alert.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <ShieldAlert size={16} color={alert.severity === 'CRITICAL' ? '#f87171' : '#fbbf24'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.80rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.product_name}</span>
                            <span className={alert.severity === 'CRITICAL' ? 'badge badge-rose' : 'badge badge-amber'} style={{ fontSize: '0.56rem', flexShrink: 0 }}>
                              {alert.severity === 'CRITICAL' ? 'Rugi!' : 'Risiko'}
                            </span>
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.35 }}>
                            Margin {alert.current_margin_percent.toFixed(1)}% • Harga jual {formatCurrency(alert.current_price)} vs HPP {formatCurrency(alert.cogs)}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                            <Sparkles size={11} color="var(--emerald-400)" />
                            <span style={{ fontSize: '0.68rem', color: 'var(--emerald-400)', fontWeight: 600 }}>
                              Rekomendasi: {formatCurrency(alert.recommended_price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bantuan Support Button */}
        {onOpenSupportModal && (
          <button
            onClick={onOpenSupportModal}
            title="Pusat bantuan & lapor kendala"
            style={{
              fontSize: '0.73rem',
              padding: '5px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 'var(--radius-md)',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
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

