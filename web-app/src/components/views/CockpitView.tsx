import React from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Coins, 
  ArrowUpRight, 
  Calendar,
  Activity,
  ArrowRight,
  Bot
} from 'lucide-react';
import type { KPIStats, NavigationTab, Tenant } from '../../types';

interface CockpitViewProps {
  kpi: KPIStats;
  onNavigate: (tab: NavigationTab) => void;
  tenant?: Tenant | null;
}

export const CockpitView: React.FC<CockpitViewProps> = ({ kpi, onNavigate, tenant }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const agentLogs = [
    {
      time: '10:14:22',
      agent: 'FinOrchestrator',
      action: 'Idle Cash Sweeping Evaluator',
      detail: 'Kas operasional Rp 48.650.000 berada di atas Safety Buffer (Rp 18.5jt). Merekomendasikan sweeping Rp 15jt ke Reksadana Pasar Uang (Imbal hasil 5.9% p.a).',
      status: 'SUCCESS'
    },
    {
      time: '09:48:10',
      agent: 'Anti-Predatory Guard',
      action: 'Contract Deobfuscator',
      detail: 'Penawaran pinjol "Dana Kilat 30 Hari" dibongkar: Bunga flat 0.35%/hari terbukti memiliki Real APR 182.5%! Status: Ditolak & Dicegah.',
      status: 'WARNING'
    },
    {
      time: '08:32:05',
      agent: 'Vision Document Parser',
      action: 'Receipt ELA Forensics',
      detail: 'Nota Grosir Jaya Abadi Rp 1.544.000 diverifikasi ASLI (Integritas 98.6%). Jurnal akuntansi berpasangan otomatis dibukukan ke Buku Besar.',
      status: 'SUCCESS'
    },
    {
      time: 'Kemarin',
      agent: 'AR Dunning Agent',
      action: 'WhatsApp Auto-Collection',
      detail: 'Pesan pengingat santun dikirim ke Kantin PT Megah Sentosa (+62812xxx) via WhatsApp Cloud API dengan link QRIS SNAP.',
      status: 'INFO'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Executive Financial Cockpit</h2>
            <span className="badge badge-emerald">Real-time SAK EMKM</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {tenant ? <strong style={{ color: '#e2e8f0' }}>{tenant.name} ({tenant.branchCode}) • </strong> : ''}Pengawasan likuiditas, kepatuhan pajak PP 55/2022, dan koordinasi multi-agent FINA-ENTERPRISE.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate('montecarlo')}
          >
            <Activity size={16} />
            <span>Simulasi Stress Test Monte Carlo</span>
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate('loan_deobfuscator')}
          >
            <ShieldCheck size={16} />
            <span>Uji Kontrak Pinjol</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Enterprise KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Kas Likuid */}
        <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Kas Likuid Tersedia (BCA + Kasir)
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald-400)' }}>
              <Coins size={18} />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            {formatCurrency(kpi.liquidCash)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
            <span className="badge badge-emerald" style={{ padding: '2px 6px' }}>
              <ArrowUpRight size={12} /> +Rp 3.6jt hari ini
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Di atas buffer aman Rp 18.5jt</span>
          </div>
        </div>

        {/* Card 2: Cash Runway */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Estimasi Cash Runway
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--cyan-500)' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
              {kpi.cashRunwayDays}
            </span>
            <span style={{ color: 'var(--cyan-500)', fontWeight: 600, fontSize: '0.9rem' }}>Hari Bertahan</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
            <span className="badge badge-cyan" style={{ padding: '2px 6px' }}>
              P50 Median Sehat
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Berdasarkan 10.000 iterasi</span>
          </div>
        </div>

        {/* Card 3: Financial Health Index (SAK EMKM) */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Skor Kesehatan (SAK EMKM)
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span className="mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
              {kpi.financialHealthIndex}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ 100</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
            <span className="badge badge-indigo" style={{ padding: '2px 6px' }}>
              GRADE A • BANKABLE KUR
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Laporan siap diaudit</span>
          </div>
        </div>

        {/* Card 4: Margin Leakage Alert */}
        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Kebocoran Margin Terdeteksi
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber-500)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--amber-500)', marginBottom: '8px' }}>
            {formatCurrency(kpi.marginLeakageMonthly)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
            <span className="badge badge-amber" style={{ padding: '2px 6px' }}>
              Potongan QRIS & Overprice
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Dapat dihemat bulan ini</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '20px' }}>
        {/* Left: Interactive 30-Day Liquidity Trajectory Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '4px' }}>
                Proyeksi Arus Kas & Garis Ketahanan Likuiditas
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Simulasi stokastik 30 hari ke depan terhadap ambang batas Safety Buffer (Rp 18.5jt)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-emerald">Skenario Optimis</span>
              <span className="badge badge-cyan">Skenario Median</span>
            </div>
          </div>

          {/* SVG Trajectory Chart */}
          <div style={{ width: '100%', height: '240px', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="190" x2="600" y2="190" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

              {/* Safety Buffer Horizontal Threshold Line */}
              <line x1="0" y1="155" x2="600" y2="155" stroke="var(--amber-500)" strokeWidth="2" strokeDasharray="6 6" />
              <text x="10" y="150" fill="var(--amber-500)" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                Safety Buffer: Rp 18.500.000
              </text>

              {/* Gradient Fill */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.35)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0.0)" />
                </linearGradient>
              </defs>

              {/* Area */}
              <polygon 
                points="0,60 50,55 100,70 150,65 200,50 250,58 300,72 350,65 400,60 450,52 500,68 550,55 600,45 600,220 0,220"
                fill="url(#areaGradient)"
              />

              {/* Optimistic Path (Green) */}
              <polyline 
                points="0,60 50,55 100,70 150,65 200,50 250,58 300,72 350,65 400,60 450,52 500,68 550,55 600,45"
                fill="none"
                stroke="var(--emerald-400)"
                strokeWidth="3"
              />

              {/* Median Realistic Path (Cyan) */}
              <polyline 
                points="0,60 50,68 100,82 150,88 200,85 250,95 300,105 350,110 400,108 450,118 500,122 550,120 600,125"
                fill="none"
                stroke="var(--cyan-500)"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            <span>Hari ini (17 Sep)</span>
            <span>Hari ke-10</span>
            <span>Hari ke-20</span>
            <span>Hari ke-30 (17 Okt)</span>
          </div>
        </div>

        {/* Right: Live Autonomous Agent Stream */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={18} color="var(--emerald-400)" />
              <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Live Agent Telemetry</h3>
            </div>
            <span className="badge badge-emerald">FSM Event Loop</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
            {agentLogs.map((log, index) => (
              <div key={index} style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                    {log.agent} • {log.action}
                  </span>
                  <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {log.time}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {log.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Launchpad to 10 Super-Features */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.95rem', color: '#ffffff', marginBottom: '12px' }}>
          Aksi Cepat FinOrchestrator
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate('forensics')}
            style={{ justifyContent: 'space-between' }}
          >
            <span>Scan Nota & Uji ELA</span>
            <ArrowRight size={15} />
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate('b2b_benchmark')}
            style={{ justifyContent: 'space-between' }}
          >
            <span>Audit Harga Bahan Baku</span>
            <ArrowRight size={15} />
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate('ar_dunning')}
            style={{ justifyContent: 'space-between' }}
          >
            <span>Kirim Penagihan WhatsApp</span>
            <ArrowRight size={15} />
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate('voice_dialect')}
            style={{ justifyContent: 'space-between' }}
          >
            <span>Uji Voice Dialek Jawa/Sunda</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
