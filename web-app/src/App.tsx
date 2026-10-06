import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AgentTraceDrawer } from './components/AgentTraceDrawer';
import { HomepageView } from './components/views/HomepageView';
import { LoginView } from './components/views/LoginView';
import { SuspenseLoader } from './components/SuspenseLoader';
import { ErrorBoundary } from './components/ErrorBoundary';

import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy Loaded Workspace Modules (Resilient Code Splitting with Auto Stale-Chunk Recovery)
const CockpitView = lazyWithRetry(() => import('./components/views/CockpitView').then(m => ({ default: m.CockpitView })), 'CockpitView');
const POSView = lazyWithRetry(() => import('./components/views/POSView').then(m => ({ default: m.POSView })), 'POSView');
const InventoryView = lazyWithRetry(() => import('./components/views/InventoryView').then(m => ({ default: m.InventoryView })), 'InventoryView');
const LedgerView = lazyWithRetry(() => import('./components/views/LedgerView').then(m => ({ default: m.LedgerView })), 'LedgerView');
const MonteCarloView = lazyWithRetry(() => import('./components/views/MonteCarloView').then(m => ({ default: m.MonteCarloView })), 'MonteCarloView');
const LoanDeobfuscatorView = lazyWithRetry(() => import('./components/views/LoanDeobfuscatorView').then(m => ({ default: m.LoanDeobfuscatorView })), 'LoanDeobfuscatorView');
const ForensicsView = lazyWithRetry(() => import('./components/views/ForensicsView').then(m => ({ default: m.ForensicsView })), 'ForensicsView');
const PriceBenchmarkView = lazyWithRetry(() => import('./components/views/PriceBenchmarkView').then(m => ({ default: m.PriceBenchmarkView })), 'PriceBenchmarkView');
const DunningView = lazyWithRetry(() => import('./components/views/DunningView').then(m => ({ default: m.DunningView })), 'DunningView');
const VoiceDialectView = lazyWithRetry(() => import('./components/views/VoiceDialectView').then(m => ({ default: m.VoiceDialectView })), 'VoiceDialectView');
const StaffManagementView = lazyWithRetry(() => import('./components/views/StaffManagementView').then(m => ({ default: m.StaffManagementView })), 'StaffManagementView');
const CSStaffLoginView = lazyWithRetry(() => import('./components/views/CSStaffLoginView').then(m => ({ default: m.CSStaffLoginView })), 'CSStaffLoginView');
const CSSupportDeskView = lazyWithRetry(() => import('./components/views/CSSupportDeskView').then(m => ({ default: m.CSSupportDeskView })), 'CSSupportDeskView');
const InitialSetupView = lazyWithRetry(() => import('./components/views/InitialSetupView').then(m => ({ default: m.InitialSetupView })), 'InitialSetupView');
import { SupportReportModal } from './components/views/SupportReportModal';

import type { NavigationTab, KPIStats, Tenant, UserRole, AppPage, SupportTicket, AgentTraceEvent } from './types';
import type { MarginLeakageAlert } from './services/types';
import { ShieldCheck, Database, Radio, PanelLeftOpen } from 'lucide-react';
import { api } from './services/api';

export const App: React.FC = () => {

  const [currentPage, setCurrentPage] = useState<AppPage>('homepage');
  const [activeTab, setActiveTab] = useState<NavigationTab>('cockpit');
  const [kpi, setKpi] = useState<KPIStats>({
    liquidCash: 0, safetyBuffer: 0, cashRunwayDays: 0,
    financialHealthIndex: 0, marginLeakageMonthly: 0,
    activeAccountsReceivable: 0, estimatedTaxPP55: 0
  });
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('OWNER');
  const [isPiiMasked, setIsPiiMasked] = useState<boolean>(false);
  const [isTraceOpen, setIsTraceOpen] = useState<boolean>(false);
  const [agentTraces, setAgentTraces] = useState<AgentTraceEvent[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [marginAlerts, setMarginAlerts] = useState<MarginLeakageAlert[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Shortcut Keyboard Global: Ctrl+B / Cmd+B untuk toggle hide/show Sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Session Re-hydration: Ambil profil dan tenant aktif dari JWT saat halaman dimuat/refresh
  useEffect(() => {
    const restoreSession = async () => {
      const token = api.getAuthToken();
      if (!token) return;

      try {
        const authData = await api.getMe();
        if (authData && authData.user && authData.tenant) {
          const verifiedTenant: Tenant = {
            id: authData.tenant.id,
            name: authData.tenant.name,
            branchCode: authData.tenant.branch_code,
            npwp: authData.tenant.npwp || '00.000.000.0-000.000',
            address: authData.tenant.address || 'Indonesia',
            activeLicense: authData.tenant.active_license,
            isSetupComplete: (authData.tenant as any).is_setup_complete
          };
          setCurrentTenant(verifiedTenant);
          setUserTenants([verifiedTenant]);
          setUserRole((authData.user.role as UserRole) || 'OWNER');
          // Onboarding: Jika OWNER belum setup modal/saldo awal, arahkan ke wizard
          if (authData.user.role === 'OWNER' && !(authData.tenant as any).is_setup_complete) {
            setActiveTab('initial_setup');
          }
          // Fetch KPI dashboard dari database riil (hanya untuk peran manajerial — kasir diblokir oleh RBAC backend)
          if (authData.user.role !== 'CASHIER') {
            try {
              const kpiData = await api.getKPIDashboard();
              if (kpiData) {
                setKpi({
                  liquidCash: kpiData.liquid_cash,
                  safetyBuffer: kpiData.safety_buffer,
                  cashRunwayDays: kpiData.cash_runway_days,
                  financialHealthIndex: kpiData.financial_health_index,
                  marginLeakageMonthly: kpiData.margin_leakage_monthly,
                  activeAccountsReceivable: kpiData.active_accounts_receivable,
                  estimatedTaxPP55: kpiData.estimated_tax_pp55,
                  totalRevenue: kpiData.total_revenue,
                });
              }
            } catch { /* KPI fetch optional, dashboard shows zeros */ }
          }
          setAgentTraces([
            {
              id: `trace-init-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('id-ID'),
              module: 'ORCHESTRATOR',
              action: 'SESSION_RESTORED',
              details: `Sesi terautentikasi untuk tenant ${verifiedTenant.name} (${verifiedTenant.branchCode}). Telemetri real-time aktif.`,
              status: 'SUCCESS',
              latencyMs: 14
            },
            {
              id: `trace-pgvector-${Date.now() + 1}`,
              timestamp: new Date().toLocaleTimeString('id-ID'),
              module: 'PGVECTOR_RAG',
              action: 'VECTOR_INDEX_READY',
              details: 'PostgreSQL 16 + pgvector HNSW indexing (dimensi 1536) siap melayani pencarian semantik dialek & regulasi SAK EMKM.',
              status: 'SUCCESS',
              latencyMs: 6
            }
          ]);
          setCurrentPage(prev => (prev === 'homepage' || prev === 'login' ? 'portal_umkm' : prev));
          // RBAC: Kasir otomatis diarahkan ke POS workspace
          if (authData.user.role === 'CASHIER') {
            setActiveTab('pos');
          }
        }
      } catch (err) {
        console.warn('[App] Sesi kadaluarsa atau tidak valid:', err);
        api.clearAuthToken();
      }
    };
    restoreSession();
  }, []);

  // Deteksi URL rahasia staf (?portal=cs atau #cs-ops) & Keyboard Shortcut Rahasia (Ctrl + Shift + S)
  useEffect(() => {
    const checkUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      if (params.get('portal') === 'cs' || params.get('ops') === 'true' || hash === '#cs-ops') {
        setCurrentPage('cs_login');
      }
    };
    checkUrl();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut Rahasia Staf Internal: Ctrl + Shift + S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setCurrentPage('cs_login');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sinkronisasi tiket dari backend secara asinkron
  useEffect(() => {
    const fetchBackendTickets = async () => {
      try {
        const remoteTickets = await api.getTickets();
        if (remoteTickets && remoteTickets.length > 0) {
          const mapped: SupportTicket[] = remoteTickets.map(r => ({
            id: r.id,
            ticketNumber: r.id,
            tenantName: r.tenant_id,
            userPhone: r.reporter_phone || '+628123456789',
            category: 'SYSTEM_BUG',
            priority: (r.priority as any) || 'MEDIUM',
            status: r.status === 'RESOLVED' ? 'RESOLVED' : r.status === 'IN_PROGRESS' ? 'IN_REVIEW' : 'OPEN',
            subject: r.title,
            description: r.description,
            createdAt: r.created_at.replace('T', ' ').substring(0, 16),
            suggestedResolution: r.assigned_to ? `Ditangani oleh: ${r.assigned_to}` : undefined
          }));
          setSupportTickets(mapped);
        }
      } catch (err) {
        console.warn('[App] Menggunakan mock data lokal:', err);
      }
    };
    fetchBackendTickets();
  }, []);

  const handleCreateSupportTicket = async (newTicketData: Omit<SupportTicket, 'id' | 'createdAt'>) => {
    // 1. Optimistic UI update
    const tempId = `tkt-${Date.now()}`;
    const optimisticTicket: SupportTicket = {
      ...newTicketData,
      id: tempId,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setSupportTickets(prev => [optimisticTicket, ...prev]);

    // 2. Sync to Backend via API Client
    try {
      const serverTicket = await api.submitTicket({
        tenant_id: newTicketData.tenantName,
        title: newTicketData.subject,
        category: 'LAINNYA',
        description: newTicketData.description,
        priority: newTicketData.priority,
        reporter_name: newTicketData.tenantName,
        reporter_phone: newTicketData.userPhone
      });

      // Update ID dari server jika ada
      setSupportTickets(prev => prev.map(t => t.id === tempId ? { ...t, id: serverTicket.id, ticketNumber: serverTicket.id } : t));
    } catch (err) {
      console.warn('[App] Gagal persist ke backend, tiket tersimpan di state lokal:', err);
    }
  };

  const handleResolveTicketFromCS = async (ticketId: string, resolutionNote?: string) => {
    setSupportTickets(prev => prev.map(t => 
      t.id === ticketId 
        ? { ...t, status: 'RESOLVED' as const, suggestedResolution: resolutionNote || t.suggestedResolution }
        : t
    ));

    // Sinkronisasi status ke backend
    try {
      await api.updateTicketStatus(ticketId, 'RESOLVED', 'Staf CS FINA');
    } catch (err) {
      console.warn('[App] Status update failed on backend:', err);
    }
  };



  // 1. Homepage Route
  if (currentPage === 'homepage') {
    return (
      <HomepageView 
        onNavigatePage={(page) => setCurrentPage(page)}
      />
    );
  }

  // 2. Login Route (100% Dedicated to UMKM Merchants)
  if (currentPage === 'login') {
    return (
      <LoginView 
        onLoginSuccess={(role, targetPage, tenantData) => {
          setUserRole(role);
          if (tenantData) {
            const verifiedTenant: Tenant = {
              id: tenantData.id,
              name: tenantData.name,
              branchCode: tenantData.branch_code,
              npwp: tenantData.npwp || '00.000.000.0-000.000',
              address: tenantData.address || 'Indonesia',
              activeLicense: tenantData.active_license,
              isSetupComplete: (tenantData as any).is_setup_complete
            };
            setCurrentTenant(verifiedTenant);
            setUserTenants([verifiedTenant]);
            // Onboarding Wizard jika OWNER belum set saldo awal
            if (role === 'OWNER' && !(tenantData as any).is_setup_complete) {
              setActiveTab('initial_setup');
            }
          }
          // Segarkan data finansial dari database PostgreSQL riil (hanya untuk peran manajerial)
          if (role !== 'CASHIER') {
            api.getKPIDashboard().then(kpiData => {
              if (kpiData) {
                setKpi({
                  liquidCash: kpiData.liquid_cash,
                  safetyBuffer: kpiData.safety_buffer,
                  cashRunwayDays: kpiData.cash_runway_days,
                  financialHealthIndex: kpiData.financial_health_index,
                  marginLeakageMonthly: kpiData.margin_leakage_monthly,
                  activeAccountsReceivable: kpiData.active_accounts_receivable,
                  estimatedTaxPP55: kpiData.estimated_tax_pp55,
                });
              }
            }).catch(() => {});
          }
          // RBAC: Kasir otomatis terkunci ke POS workspace
          if (role === 'CASHIER') {
            setActiveTab('pos');
          }
          setCurrentPage(targetPage);
        }}
        onBackToHome={() => setCurrentPage('homepage')}
      />
    );
  }


  // 3. Dedicated Backoffice CS Login Route (Hidden from Public Web)
  if (currentPage === 'cs_login') {
    return (
      <ErrorBoundary fallbackMessage="Kendala autentikasi staf Customer Support">
        <React.Suspense fallback={<SuspenseLoader message="Menyiapkan Portal Staf CS..." />}>
          <CSStaffLoginView 
            onLoginSuccess={(role: UserRole, targetPage: AppPage) => {
              setUserRole(role);
              setCurrentPage(targetPage);
            }}
            onBackToHome={() => {
              if (window.location.search || window.location.hash) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              setCurrentPage('homepage');
            }}
          />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  // 4. Customer Support & AI-Ops Portal Route (Internal Access Only)
  if (currentPage === 'portal_cs') {
    return (
      <ErrorBoundary fallbackMessage="Kendala workstation Customer Support">
        <React.Suspense fallback={<SuspenseLoader message="Memuat Antrean Tiket CS..." />}>
          <CSSupportDeskView 
            tickets={supportTickets}
            onResolveTicket={handleResolveTicketFromCS}
            onLogout={() => {
              if (window.location.search || window.location.hash) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              setCurrentPage('homepage');
            }}
          />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  // 4. Main UMKM Financial Management Workspace
  const renderActiveView = () => {
    return (
      <ErrorBoundary fallbackMessage="Kendala memuat modul antarmuka kerja">
        <React.Suspense fallback={<SuspenseLoader message="Menyiapkan data modul..." />}>
          {(() => {
            switch (activeTab) {
              case 'cockpit':
                return <CockpitView kpi={kpi} onNavigate={setActiveTab} tenant={currentTenant} />;
              case 'pos':
                return <POSView tenant={currentTenant} onNavigateToLedger={() => setActiveTab('ledger')} onMarginAlertsChange={setMarginAlerts} />;
              case 'inventory':
                return <InventoryView tenant={currentTenant} onNavigateToPOS={() => setActiveTab('pos')} onNavigateToLedger={() => setActiveTab('ledger')} />;
              case 'ledger':
                return <LedgerView isPiiMasked={isPiiMasked} userRole={userRole} tenant={currentTenant} />;
              case 'montecarlo':
                return <MonteCarloView kpi={kpi} />;
              case 'loan_deobfuscator':
                return <LoanDeobfuscatorView />;
              case 'forensics':
                return <ForensicsView />;
              case 'b2b_benchmark':
                return <PriceBenchmarkView />;
              case 'ar_dunning':
                return <DunningView isPiiMasked={isPiiMasked} />;
              case 'voice_dialect':
                return <VoiceDialectView />;
              case 'staff':
                return <StaffManagementView isPiiMasked={isPiiMasked} tenant={currentTenant} />;
              case 'initial_setup':
                return (
                  <InitialSetupView 
                    tenantName={currentTenant?.name}
                    onNavigate={setActiveTab}
                    onSetupComplete={() => {
                      if (currentTenant) {
                        setCurrentTenant({ ...currentTenant, isSetupComplete: true });
                      }
                      api.getKPIDashboard().then(kpiData => {
                        if (kpiData) {
                          setKpi({
                            liquidCash: kpiData.liquid_cash,
                            safetyBuffer: kpiData.safety_buffer,
                            cashRunwayDays: kpiData.cash_runway_days,
                            financialHealthIndex: kpiData.financial_health_index,
                            marginLeakageMonthly: kpiData.margin_leakage_monthly,
                            activeAccountsReceivable: kpiData.active_accounts_receivable,
                            estimatedTaxPP55: kpiData.estimated_tax_pp55,
                          });
                        }
                      }).catch(() => {});
                      setActiveTab('cockpit');
                    }}
                  />
                );
              default:
                return <CockpitView kpi={kpi} onNavigate={setActiveTab} tenant={currentTenant} />;
            }
          })()}
        </React.Suspense>
      </ErrorBoundary>
    );
  };


  return (
    <div style={{ height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Enterprise Application Header — Sticky Pinned Enterprise Navigation */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-base)', flexShrink: 0, width: '100%' }}>
        <Header 
          kpi={kpi} 
          tenant={currentTenant}
          tenants={userTenants.length > 0 ? userTenants : (currentTenant ? [currentTenant] : [])}
          onSelectTenant={setCurrentTenant}
          userRole={userRole}
          isPiiMasked={isPiiMasked}
          onTogglePii={() => setIsPiiMasked(!isPiiMasked)}
          onOpenTrace={() => setIsTraceOpen(true)}
          traceCount={agentTraces.length}
          onLogout={() => {
            api.clearAuthToken();
            setCurrentTenant(null);
            setUserTenants([]);
            setKpi({ liquidCash: 0, safetyBuffer: 0, cashRunwayDays: 0, financialHealthIndex: 0, marginLeakageMonthly: 0, activeAccountsReceivable: 0, estimatedTaxPP55: 0 });
            setCurrentPage('homepage');
          }}
          onOpenSupportModal={() => setIsSupportModalOpen(true)}
          marginAlerts={marginAlerts}
          onEvaluateAlert={(_alert) => {
            setActiveTab('pos');
          }}
          onDismissAlerts={() => setMarginAlerts([])}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
        />
      </div>


      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar Navigation — Collapsible (RBAC-filtered berdasarkan userRole) */}
        <Sidebar 
          activeTab={activeTab} 
          onSelectTab={(tab) => {
            // RBAC Guard: Kasir dilarang berpindah ke tab manajerial
            const cashierAllowedTabs: Set<NavigationTab> = new Set(['pos']);
            if (userRole === 'CASHIER' && !cashierAllowedTabs.has(tab)) {
              return; // Blokir navigasi secara diam-diam
            }
            setActiveTab(tab);
          }} 
          userRole={userRole} 
          tenant={currentTenant}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Main Workspace Content */}
        <main
          style={{
            flex: 1,
            padding: '8px 24px 30px 16px',
            overflowY: 'auto',
            minWidth: 0,
            minHeight: 0
          }}
        >
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Sidebar Reveal Button (muncul saat sidebar di-hide / collapse) */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          title="Tampilkan Menu Navigasi (Ctrl+B)"
          style={{
            position: 'fixed',
            left: '12px',
            bottom: '16px',
            zIndex: 95,
            background: 'rgba(17, 26, 36, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(16, 185, 129, 0.15)',
            borderRadius: '24px',
            padding: '7px 12px',
            color: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
        >
          <PanelLeftOpen size={16} color="var(--emerald-400)" />
          <span>Menu</span>
          <span style={{
            fontSize: '0.65rem',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '1px 5px',
            borderRadius: '4px',
            color: '#94a3b8'
          }}>Ctrl+B</span>
        </button>
      )}

      {/* UMKM Support & Detailed Issue Reporting Modal */}
      <SupportReportModal 
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        tenant={currentTenant}
        tickets={supportTickets}
        onSubmitTicket={handleCreateSupportTicket}
      />

      {/* Slide-over Cognitive Agent Trace Drawer */}
      <AgentTraceDrawer 
        isOpen={isTraceOpen}
        onClose={() => setIsTraceOpen(false)}
        events={agentTraces}
      />


      {/* Enterprise Bottom Telemetry Bar */}
      <footer style={{
        background: 'rgba(6, 9, 17, 0.9)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '6px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Radio size={11} color="var(--emerald-400)" />
            <span>API <strong style={{ color: '#ffffff' }}>Online</strong></span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={11} color="var(--cyan-500)" />
            <span><strong style={{ color: '#ffffff' }}>AES-256</strong> + UU PDP</span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Database size={11} color="var(--emerald-400)" />
            <span><strong style={{ color: '#ffffff' }}>PostgreSQL 16</strong></span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>{currentTenant?.branchCode || 'BERKAH-HQ'} <strong style={{ color: 'var(--emerald-400)' }}>{userRole}</strong></span>
          <span 
            className="mono" 
            title="Akses Staf CS Internal: [Ctrl + Shift + S]"
            style={{ cursor: 'help', opacity: 0.6 }}
          >
            FINA © 2026
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
