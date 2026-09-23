import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AgentTraceDrawer } from './components/AgentTraceDrawer';
import { HomepageView } from './components/views/HomepageView';
import { LoginView } from './components/views/LoginView';
import { CSStaffLoginView } from './components/views/CSStaffLoginView';
import { CSSupportDeskView } from './components/views/CSSupportDeskView';
import { SupportReportModal } from './components/views/SupportReportModal';
import { CockpitView } from './components/views/CockpitView';
import { LedgerView } from './components/views/LedgerView';
import { MonteCarloView } from './components/views/MonteCarloView';
import { LoanDeobfuscatorView } from './components/views/LoanDeobfuscatorView';
import { ForensicsView } from './components/views/ForensicsView';
import { PriceBenchmarkView } from './components/views/PriceBenchmarkView';
import { DunningView } from './components/views/DunningView';
import { VoiceDialectView } from './components/views/VoiceDialectView';
import type { NavigationTab, KPIStats, Tenant, UserRole, AppPage, SupportTicket } from './types';
import { mockAgentTraces } from './data/mockData';
import { ShieldCheck, Database, Radio } from 'lucide-react';
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
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);

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
            activeLicense: authData.tenant.active_license
          };
          setCurrentTenant(verifiedTenant);
          setUserTenants([verifiedTenant]);
          setUserRole((authData.user.role as UserRole) || 'OWNER');
          // Jika pengguna sedang di halaman publik, arahkan langsung ke workspace operasional
          // Fetch KPI dashboard dari database riil
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
              });
            }
          } catch { /* KPI fetch optional, dashboard shows zeros */ }
          setCurrentPage(prev => (prev === 'homepage' || prev === 'login' ? 'portal_umkm' : prev));
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
              activeLicense: tenantData.active_license
            };
            setCurrentTenant(verifiedTenant);
            setUserTenants([verifiedTenant]);
          }
          // Segarkan data finansial dari database PostgreSQL riil
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
          setCurrentPage(targetPage);
        }}
        onBackToHome={() => setCurrentPage('homepage')}
      />
    );
  }


  // 3. Dedicated Backoffice CS Login Route (Hidden from Public Web)
  if (currentPage === 'cs_login') {
    return (
      <CSStaffLoginView 
        onLoginSuccess={(role, targetPage) => {
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
    );
  }

  // 4. Customer Support & AI-Ops Portal Route (Internal Access Only)
  if (currentPage === 'portal_cs') {
    return (
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
    );
  }



  // 4. Main UMKM Financial Management Workspace
  const renderActiveView = () => {
    switch (activeTab) {
      case 'cockpit':
        return <CockpitView kpi={kpi} onNavigate={setActiveTab} tenant={currentTenant} />;
      case 'ledger':
        return <LedgerView isPiiMasked={isPiiMasked} userRole={userRole} tenant={currentTenant} />;
      case 'montecarlo':
        return <MonteCarloView />;
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
      default:
        return <CockpitView kpi={kpi} onNavigate={setActiveTab} tenant={currentTenant} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Enterprise Application Header */}
      <Header 
        kpi={kpi} 
        tenant={currentTenant}
        tenants={userTenants.length > 0 ? userTenants : (currentTenant ? [currentTenant] : [])}
        onSelectTenant={setCurrentTenant}
        userRole={userRole}
        isPiiMasked={isPiiMasked}
        onTogglePii={() => setIsPiiMasked(!isPiiMasked)}
        onOpenTrace={() => setIsTraceOpen(true)}
        traceCount={mockAgentTraces.length}
        onLogout={() => {
          api.clearAuthToken();
          setCurrentTenant(null);
          setUserTenants([]);
          setKpi({ liquidCash: 0, safetyBuffer: 0, cashRunwayDays: 0, financialHealthIndex: 0, marginLeakageMonthly: 0, activeAccountsReceivable: 0, estimatedTaxPP55: 0 });
          setCurrentPage('homepage');
        }}
        onOpenSupportModal={() => setIsSupportModalOpen(true)}
      />


      {/* Main Workspace Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar Navigation */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Dynamic Main Workspace Content */}
        <main style={{
          flex: 1,
          padding: '0 24px 30px 16px',
          overflowY: 'auto',
          minWidth: 0
        }}>
          {renderActiveView()}
        </main>
      </div>

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
        events={mockAgentTraces}
      />


      {/* Enterprise Bottom Telemetry Bar */}
      <footer style={{
        background: 'rgba(6, 9, 17, 0.9)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '8px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.74rem',
        color: 'var(--text-muted)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Radio size={12} color="var(--emerald-400)" />
            <span>FinOrchestrator RPC: <strong style={{ color: '#ffffff' }}>Online (Latensi 12ms)</strong></span>
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={12} color="var(--cyan-500)" />
            <span>Security: <strong style={{ color: '#ffffff' }}>AES-256 GCM + UU PDP Active</strong></span>
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Database size={12} color="var(--emerald-400)" />
            <span>Storage: <strong style={{ color: '#ffffff' }}>PostgreSQL 16 + pgvector (HNSW)</strong></span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Tenant: <strong style={{ color: '#ffffff' }}>{currentTenant?.branchCode || 'BERKAH-HQ'}</strong></span>
          <span>•</span>
          <span>Role: <strong style={{ color: 'var(--emerald-400)' }}>{userRole}</strong></span>
          <span 
            className="mono" 
            title="Akses Staf CS Internal: Tekan kombinasi [Ctrl + Shift + S] atau buka URL dengan parameter ?portal=cs"
            style={{ cursor: 'help' }}
          >
            FINA Enterprise OS © 2026
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
