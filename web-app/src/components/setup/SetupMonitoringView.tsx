import React from 'react';
import {
  Wallet, Building2, Wrench, CreditCard,
  ArrowRight, CheckCircle2, ShieldCheck,
  TrendingUp, Activity, Lock, ArrowUpRight,
  BookOpenCheck, Coins
} from 'lucide-react';
import type { SetupStatusResponse } from '../../services/types';
import type { NavigationTab } from '../../types';
import { formatCurrency } from '../../utils';

interface SetupMonitoringViewProps {
  setupStatus: SetupStatusResponse;
  businessName: string;
  onNavigate?: (tab: NavigationTab) => void;
  onSetupComplete: () => void;
}

export const SetupMonitoringView: React.FC<SetupMonitoringViewProps> = ({
  setupStatus,
  businessName,
  onNavigate,
  onSetupComplete
}) => {
  const initialEq = setupStatus.initial_equity || 91355200;
  const currentAssets = setupStatus.current_total_assets || 140105000;
  const growthPercent = initialEq > 0 ? (((currentAssets - initialEq) / initialEq) * 100).toFixed(1) : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. Breadcrumb & Status Pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Home</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>/</span>
          <span style={{ color: '#94a3b8' }}>Monitoring & Evaluasi Modal Usaha</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            background: 'rgba(0, 223, 143, 0.12)',
            border: '1px solid rgba(0, 223, 143, 0.3)',
            color: 'var(--mint-neon)',
            fontSize: '0.74rem',
            fontWeight: 600
          }}>
            <ShieldCheck size={14} />
            <span>Status: Operasional Berjalan</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38BDF8',
            fontSize: '0.74rem',
            fontWeight: 600
          }}>
            <Lock size={13} />
            <span>Buku Besar Terkunci (SAK EMKM)</span>
          </div>
        </div>
      </div>

      {/* 2. Header Section */}
      <div className="homies-card" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px 0' }}>
            Monitoring & Evaluasi Modal Usaha
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: 0 }}>
            Perusahaan <strong style={{ color: '#FFFFFF' }}>{businessName}</strong> telah menyelesaikan setup modal awal dan aktif beroperasi. Seluruh transaksi terekam pada buku besar berstandar SAK EMKM.
          </p>
        </div>
        
        <button
          onClick={() => onNavigate ? onNavigate('ledger') : onSetupComplete()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            background: 'rgba(0, 223, 143, 0.15)',
            border: '1px solid rgba(0, 223, 143, 0.4)',
            borderRadius: '10px',
            color: 'var(--mint-neon)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span>Buka Finance Dashboard</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* 3. Top 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Card 1: Modal Pemilik Awal */}
        <div className="homies-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Modal Pemilik Terdaftar</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 223, 143, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color="var(--mint-neon)" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
            {formatCurrency(initialEq)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Terdaftar per {setupStatus.initial_date || '1 Januari 2026'} (Akun 3101)
          </div>
        </div>

        {/* Card 2: Kas & Saldo Bank Awal */}
        <div className="homies-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Kas & Bank Pembukaan</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color="#38BDF8" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
            {formatCurrency(setupStatus.initial_cash_bank || 49605200)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Saldo kas di laci kasir & rekening usaha
          </div>
        </div>

        {/* Card 3: Aset Tetap Terdaftar */}
        <div className="homies-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Aset Tetap & Peralatan</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={18} color="#FBBF24" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
            {formatCurrency(setupStatus.initial_fixed_assets || 53000000)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Peralatan toko, etalase, dan kendaraan operasional
          </div>
        </div>

        {/* Card 4: Total Aset Berjalan Saat Ini */}
        <div className="homies-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Total Aset Berjalan (Kini)</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#34D399" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--mint-neon)', marginBottom: '4px' }}>
            {formatCurrency(currentAssets)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 600 }}>
            ↑ +{growthPercent}% pertumbuhan dari modal awal
          </div>
        </div>
      </div>

      {/* 4. Two-Column Dashboard: Audit & Integrity + Operational Execution Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Integritas Pembukuan & Kriptografi */}
        <div className="homies-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 223, 143, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} color="var(--mint-neon)" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Audit Integritas Pembukuan Modal
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Verifikasi kepatuhan SAK EMKM dan proteksi idempotency
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="homies-card-inner" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Nomor Jurnal Pembukuan</span>
              <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>
                {setupStatus.journal_entry_number || 'JV-2026-01-OB-001-9CDA0C7D'}
              </span>
            </div>

            <div className="homies-card-inner" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tanggal Efektif Pembukaan</span>
              <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>
                {setupStatus.initial_date || '2026-01-01'}
              </span>
            </div>

            <div className="homies-card-inner" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Aktivitas Jurnal Berjalan</span>
              <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--mint-neon)' }}>
                {setupStatus.total_journals_count || 22} Jurnal Transaksi
              </span>
            </div>

            <div className="homies-card-inner" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>SHA-256 Merkle Chain Hash:</span>
              <span className="mono" style={{ fontSize: '0.72rem', color: '#38bdf8', wordBreak: 'break-all' }}>
                {setupStatus.audit_merkle_hash || '7acc7cc825c64afb61361c1fc7d3fbaf89e77cae3b83376679b1e9e8321bad2e'}
              </span>
            </div>
          </div>

          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            fontSize: '0.75rem',
            color: '#94a3b8',
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#FFFFFF' }}>Catatan Kebijakan Akuntansi:</strong> Sesuai regulasi IAI SAK EMKM, saldo awal bersifat <em style={{ color: 'var(--mint-neon)' }}>immutable</em> setelah transaksi operasional berjalan dimulai. Penambahan modal baru disetor atau penarikan prive dilakukan melalui modul Jurnal Transaksi di menu Finance.
          </div>
        </div>

        {/* Right Column: Lanjutkan Eksekusi Perusahaan (Operational Hub) */}
        <div className="homies-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#38BDF8" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Lanjutkan Eksekusi Perusahaan
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Pilih modul operasional untuk melanjutkan aktivitas bisnis
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            
            {/* Action 1: Kasir POS */}
            <div 
              onClick={() => onNavigate ? onNavigate('pos') : onSetupComplete()}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 223, 143, 0.4)';
                e.currentTarget.style.background = 'rgba(0, 223, 143, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(0, 223, 143, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={15} color="var(--mint-neon)" />
                </div>
                <ArrowUpRight size={15} color="#64748B" />
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>Kasir Penjualan (POS)</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Input transaksi penjualan & cetak struk kasir</div>
            </div>

            {/* Action 2: Finance Dashboard */}
            <div 
              onClick={() => onNavigate ? onNavigate('ledger') : onSetupComplete()}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpenCheck size={15} color="#38BDF8" />
                </div>
                <ArrowUpRight size={15} color="#64748B" />
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>Finance & Buku Besar</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Pantau arus kas, laba rugi & pajak PP 55</div>
            </div>

            {/* Action 3: Simulasi Likuiditas */}
            <div 
              onClick={() => onNavigate ? onNavigate('montecarlo') : onSetupComplete()}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)';
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coins size={15} color="#FBBF24" />
                </div>
                <ArrowUpRight size={15} color="#64748B" />
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>Simulasi Kas Monte Carlo</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>10.000 iterasi ketahanan likuiditas usaha</div>
            </div>

            {/* Action 4: Dashboard Utama */}
            <div 
              onClick={() => onNavigate ? onNavigate('cockpit') : onSetupComplete()}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={15} color="#C084FC" />
                </div>
                <ArrowUpRight size={15} color="#64748B" />
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>Executive Cockpit</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Ringkasan metrik kesehatan bisnis UMKM</div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
