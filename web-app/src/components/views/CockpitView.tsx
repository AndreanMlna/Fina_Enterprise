import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coins, 
  ShoppingCart, 
  Receipt, 
  Calendar, 
  ArrowUpRight, 
  Search, 
  MoreHorizontal, 
  Bot, 
  Share2
} from 'lucide-react';
import type { KPIStats, NavigationTab, Tenant, StaffMember } from '../../types';
import type { LedgerEntry } from '../../services/types';
import { api } from '../../services/api';
import { formatCurrency, maskPhone } from '../../utils';

interface CockpitViewProps {
  kpi: KPIStats;
  onNavigate: (tab: NavigationTab) => void;
  tenant?: Tenant | null;
}

interface TelemetryEvent {
  id: string;
  category: 'ALL' | 'SWEEPING' | 'DUNNING' | 'AUDIT';
  title: string;
  subtitle: string;
  source: string;
  timeRange: string;
  status: 'ACTIVE' | 'NORMAL';
  avatars: string[];
  actionTab?: NavigationTab;
  actionLabel: string;
}

interface TransactionRow {
  id: string;
  refId: string;
  name: string;
  accountRole: string;
  nominal: number;
  status: 'Active' | 'Pending' | 'Audited';
  date: string;
  department: string;
  avatarSeed: string;
}

export const CockpitView: React.FC<CockpitViewProps> = ({ kpi, onNavigate, tenant }) => {
  // Filter kategori pada panel Jadwal & Telemetri
  const [activeTelemetryFilter, setActiveTelemetryFilter] = useState<'ALL' | 'SWEEPING' | 'DUNNING' | 'AUDIT'>('ALL');
  
  // State pencarian pada tabel bawah (List Transaksi & Jurnal)
  const [searchQuery, setSearchQuery] = useState('');
  const [tableMode, setTableMode] = useState<'TRANSACTIONS' | 'STAFF'>('TRANSACTIONS');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [liveEntries, setLiveEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [staffData, vouchersData] = await Promise.allSettled([
          api.getStaffList(),
          api.getLedgerEntries()
        ]);
        if (staffData.status === 'fulfilled' && Array.isArray(staffData.value)) {
          setStaffList(staffData.value);
        }
        if (vouchersData.status === 'fulfilled' && Array.isArray(vouchersData.value)) {
          setLiveEntries(vouchersData.value);
        }
      } catch (err) {
        console.warn("[CockpitView] Gagal mengambil data live dashboard:", err);
      }
    };
    loadDashboardData();
  }, [tenant?.id]);

  // Tanggal terformat dinamis sesuai standar visual referensi
  const formattedToday = useMemo(() => {
    const d = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  // Event otomasi & jadwal operasional sistem
  const telemetryEvents: TelemetryEvent[] = useMemo(() => {
    const hasCashSurplus = kpi.liquidCash > kpi.safetyBuffer && kpi.safetyBuffer > 0;
    const surplusAmount = hasCashSurplus ? kpi.liquidCash - kpi.safetyBuffer : 0;

    return [
      {
        id: 'tel-1',
        category: 'SWEEPING',
        title: hasCashSurplus ? 'Sweeping Kas & Deposito' : 'Penyangga Likuiditas Kas',
        subtitle: hasCashSurplus 
          ? `Alokasi surplus ${formatCurrency(surplusAmount)} ke pasar uang (yield 5.9% p.a.).`
          : 'Penyangga likuiditas operasional terjaga sesuai target aman.',
        source: 'FinOrchestrator AI',
        timeRange: '13:00 - 13:30',
        status: 'ACTIVE',
        avatars: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60'],
        actionTab: 'montecarlo',
        actionLabel: 'Buka Simulasi'
      },
      {
        id: 'tel-2',
        category: 'AUDIT',
        title: 'Audit Konsistensi Buku Besar',
        subtitle: 'Validasi integritas jurnal berpasangan dan konsistensi saldo SAK EMKM.',
        source: 'PostgreSQL ACID Engine',
        timeRange: '15:00 - 16:00',
        status: 'NORMAL',
        avatars: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60'],
        actionTab: 'ledger',
        actionLabel: 'Buka Buku Besar'
      },
      {
        id: 'tel-3',
        category: 'DUNNING',
        title: 'Penagihan Piutang WhatsApp',
        subtitle: kpi.activeAccountsReceivable > 0 
          ? `Piutang ${formatCurrency(kpi.activeAccountsReceivable)} siap dikirim reminder berlink QRIS SNAP.`
          : 'Seluruh piutang usaha terpantau lancar tanpa tunggakan.',
        source: 'AR Dunning Bot',
        timeRange: '16:30 - 17:00',
        status: 'NORMAL',
        avatars: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60'],
        actionTab: 'ar_dunning',
        actionLabel: 'Buka Penagihan'
      }
    ];
  }, [kpi]);

  const filteredTelemetry = useMemo(() => {
    if (activeTelemetryFilter === 'ALL') return telemetryEvents;
    return telemetryEvents.filter(e => e.category === activeTelemetryFilter);
  }, [telemetryEvents, activeTelemetryFilter]);

  // Data transaksi buku besar & POS riil dari PostgreSQL (sinkron dengan Ledger / Database)
  const transactions: TransactionRow[] = useMemo(() => {
    if (liveEntries.length > 0) {
      const avatars = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=60'
      ];
      return liveEntries.map((e, idx) => {
        const debitLine = e.lines?.find(l => l.debit > 0);
        const creditLine = e.lines?.find(l => l.credit > 0);
        const nominal = debitLine?.debit || creditLine?.credit || 0;
        return {
          id: e.id,
          refId: e.entry_number || e.id.slice(0, 8),
          name: e.description,
          accountRole: debitLine ? `${debitLine.account_name} (${debitLine.account_code})` : 'Buku Besar',
          nominal: nominal,
          status: 'Active' as const,
          date: e.entry_date ? new Date(e.entry_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Hari ini',
          department: (creditLine && creditLine.account_name) ? creditLine.account_name : 'Kas & Bank',
          avatarSeed: avatars[idx % avatars.length]
        };
      });
    }

    return [
      {
        id: 'trx-1',
        name: 'Penjualan Kasir POS #00129',
        refId: '3644765346',
        accountRole: 'Pendapatan Usaha (4-101)',
        nominal: 450000,
        status: 'Active',
        date: '28 Sep 2026',
        department: 'Kasir Toko (Tunai)',
        avatarSeed: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60'
      },
      {
        id: 'trx-2',
        name: 'Pembelian Grosir Bahan Baku #00128',
        refId: '365467354',
        accountRole: 'Beban Pokok Penjualan (5-101)',
        nominal: 1250000,
        status: 'Active',
        date: '28 Sep 2026',
        department: 'Transfer Bank BCA',
        avatarSeed: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60'
      },
      {
        id: 'trx-3',
        name: 'Pelunasan Piutang Toko Sinar #00127',
        refId: '368940122',
        accountRole: 'Piutang Usaha (1-103)',
        nominal: 850000,
        status: 'Active',
        date: '27 Sep 2026',
        department: 'QRIS SNAP Dynamic',
        avatarSeed: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60'
      },
      {
        id: 'trx-4',
        name: 'Sweeping Kas Idle ke Deposito #00126',
        refId: '371209844',
        accountRole: 'Instrumen Likuid (1-102)',
        nominal: 5000000,
        status: 'Active',
        date: '27 Sep 2026',
        department: 'FinOrchestrator RPC',
        avatarSeed: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=60'
      },
      {
        id: 'trx-5',
        name: 'Setoran PPh Final PP 55/2022 #00125',
        refId: '374550190',
        accountRole: 'Utang Pajak PPh (2-104)',
        nominal: 225000,
        status: 'Active',
        date: '26 Sep 2026',
        department: 'e-Billing DJP Online',
        avatarSeed: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=60'
      }
    ];
  }, [liveEntries]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.refId.toLowerCase().includes(q) || 
      t.accountRole.toLowerCase().includes(q) || 
      t.department.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  const filteredStaffList = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const q = searchQuery.toLowerCase();
    return staffList.filter(s => 
      s.full_name.toLowerCase().includes(q) || 
      s.phone_number.includes(q) || 
      s.role.toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  // Perhitungan Geometri Semicircular Radial Gauge Meter
  // Busur 270° dari 135° (kiri-bawah) ke 405° (kanan-bawah)
  const healthScore = Math.max(0, Math.min(100, kpi.financialHealthIndex > 0 ? kpi.financialHealthIndex : 80));
  const radius = 72;
  const strokeCircumference = 2 * Math.PI * radius * 0.75; // ~339.29
  const strokeOffset = strokeCircumference * (1 - healthScore / 100);

  // Sudut knob pada busur derajat
  const knobAngleDeg = 135 + (healthScore / 100) * 270;
  const knobAngleRad = (knobAngleDeg * Math.PI) / 180;
  const knobX = 100 + radius * Math.cos(knobAngleRad);
  const knobY = 100 + radius * Math.sin(knobAngleRad);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* =========================================================================
          1. TOP BREADCRUMB & ACTION BUTTONS
          ========================================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
          <span style={{ color: 'var(--mint-neon)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNavigate('cockpit')}>
            Home
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>/</span>
          <span style={{ color: '#94a3b8' }}>Dashboard</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="homies-icon-btn" 
            title="Kalender Pembukuan & Jadwal Pajak"
            onClick={() => onNavigate('ledger')}
          >
            <Calendar size={16} />
          </button>
          <button 
            className="homies-icon-btn" 
            title="Ekspor Laporan Keuangan SAK EMKM"
            onClick={() => onNavigate('ledger')}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. HERO GREETING + STAT PILLS + RADIAL GAUGE METER (Top Section)
          ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 260px',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Kolom Kiri: Greeting + 4 Quick Stat Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h1 style={{ 
              fontSize: '2.1rem', 
              fontWeight: 700, 
              color: '#FFFFFF', 
              letterSpacing: '-0.025em',
              margin: '0 0 4px 0',
              fontFamily: 'var(--font-display)'
            }}>
              Selamat Datang, {tenant?.name || 'PT Abadi Nan Jaya'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.90rem', margin: 0 }}>
              {formattedToday}
            </p>
          </div>

          {/* 4 Quick Stat Pills Sejajar Horizontal */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            {/* Stat 1: Kas Likuid */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 223, 143, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mint-neon)',
                flexShrink: 0
              }}>
                <Coins size={16} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  {kpi.liquidCash > 0 ? (kpi.liquidCash >= 1000000 ? `${(kpi.liquidCash / 1000000).toFixed(1)}M` : `${(kpi.liquidCash / 1000).toFixed(0)}K`) : '75.6M'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Kas Likuid
                </div>
              </div>
            </div>

            {/* Stat 2: Omzet Usaha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 223, 143, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mint-neon)',
                flexShrink: 0
              }}>
                <ShoppingCart size={16} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  {kpi.totalRevenue && kpi.totalRevenue > 0 
                    ? (kpi.totalRevenue >= 1000000 ? `${(kpi.totalRevenue / 1000000).toFixed(1)}M` : `${(kpi.totalRevenue / 1000).toFixed(0)}K`)
                    : '184.5M'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Omzet Usaha
                </div>
              </div>
            </div>

            {/* Stat 3: Piutang Usaha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FBBF24',
                flexShrink: 0
              }}>
                <Receipt size={16} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  {kpi.activeAccountsReceivable > 0 ? (kpi.activeAccountsReceivable >= 1000000 ? `${(kpi.activeAccountsReceivable / 1000000).toFixed(1)}M` : `${(kpi.activeAccountsReceivable / 1000).toFixed(0)}K`) : '8.9M'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Piutang Aktif
                </div>
              </div>
            </div>

            {/* Stat 4: Staf Karyawan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 223, 143, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--mint-neon)',
                flexShrink: 0
              }}>
                <Calendar size={16} />
              </div>
              <div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                  {staffList.length > 0 ? `${staffList.length} Staf` : '3 Staf'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Staf Aktif
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Semicircular Radial Gauge Meter (Health Score SAK EMKM) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ width: '210px', height: '180px', position: 'relative' }}>
            <svg width="210" height="190" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
              <defs>
                {/* Neon Mint Glow Filter */}
                <filter id="mintGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Gradient Progress Arc */}
                <linearGradient id="gaugeGradient" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00DF8F" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>

              {/* Dial Numbers di luar lingkaran agar tidak bertubrukan dengan knob */}
              <text x="24" y="160" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">00</text>
              <text x="46" y="38" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">40</text>
              <text x="144" y="38" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">60</text>
              <text x="174" y="112" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">80</text>
              <text x="156" y="162" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">100</text>

              {/* Background Arc Track (270 derajat dari 135° sampai 405°) */}
              <path
                d="M 49.09 150.91 A 72 72 0 1 1 150.91 150.91"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="7"
                strokeLinecap="round"
              />

              {/* Active Progress Arc dengan Neon Mint Glow */}
              <path
                d="M 49.09 150.91 A 72 72 0 1 1 150.91 150.91"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={strokeOffset}
                filter="url(#mintGlow)"
              />

              {/* Glowing Endpoint Knob */}
              <circle
                cx={knobX}
                cy={knobY}
                r="7"
                fill="#FFFFFF"
                stroke="var(--mint-neon)"
                strokeWidth="3.5"
                filter="drop-shadow(0 0 6px rgba(0, 223, 143, 0.8))"
              />
            </svg>

            {/* Centered Percentage & Label */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              width: '160px',
              pointerEvents: 'none'
            }}>
              <div style={{ 
                fontSize: '1.9rem', 
                fontWeight: 700, 
                color: '#FFFFFF', 
                fontFamily: 'var(--font-display)',
                lineHeight: 1
              }}>
                {healthScore}%
              </div>
              <div style={{ 
                fontSize: '0.68rem', 
                color: 'var(--mint-neon)', 
                marginTop: '4px',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                Financial Health (ACID)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MIDDLE BENTO GRID (3 KARTU SEJAJAR)
             - Kiri: Schedule & Telemetri
             - Tengah: Average Team KPI (Line Bezier Chart + 5 Micro Metric Cards)
             - Kanan: Employment Status (Vertical Rounded Bar Visualizer)
          ========================================================================= */}
      {/* =========================================================================
          3. MIDDLE BENTO GRID (3 KARTU SEJAJAR)
             - Kiri: Jadwal & Aksi AI Otonom (Schedule & Telemetry)
             - Tengah: Average Team KPI (Line Bezier Chart + 5 Micro Metric Cards)
             - Kanan: Status Karyawan & Personel Shift (Compact Visualizer + Live Roster)
          ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(310px, 1.15fr) minmax(350px, 1.45fr) minmax(280px, 1fr)',
        gap: '16px',
        alignItems: 'stretch'
      }}>
        {/* ==================== CARD 1: OTOMASI & JADWAL OPERASIONAL ==================== */}
        <div className="homies-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
          {/* Header Card 1 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                className="homies-pill-btn" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  fontSize: '0.74rem',
                  padding: '3px 10px'
                }}
              >
                1 Okt 2026 ▾
              </button>
              <h3 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                Otomasi & Jadwal
              </h3>
            </div>
            <button className="homies-icon-btn" style={{ width: '28px', height: '28px' }}>
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Pill Tab Filters */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button 
              className={`homies-pill-btn ${activeTelemetryFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTelemetryFilter('ALL')}
            >
              Semua ({telemetryEvents.length})
            </button>
            <button 
              className={`homies-pill-btn ${activeTelemetryFilter === 'SWEEPING' ? 'active' : ''}`}
              onClick={() => setActiveTelemetryFilter('SWEEPING')}
            >
              Likuiditas
            </button>
            <button 
              className={`homies-pill-btn ${activeTelemetryFilter === 'AUDIT' ? 'active' : ''}`}
              onClick={() => setActiveTelemetryFilter('AUDIT')}
            >
              Audit SAK EMKM
            </button>
            <button 
              className={`homies-pill-btn ${activeTelemetryFilter === 'DUNNING' ? 'active' : ''}`}
              onClick={() => setActiveTelemetryFilter('DUNNING')}
            >
              Penagihan AR
            </button>
          </div>

          {/* Event Items Stack (Ringkas, Padat, Bebas AI Slop) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {filteredTelemetry.map((item, idx) => {
              const isHighlight = idx === 0;
              const badgeColors: Record<string, { bg: string; color: string; label: string }> = {
                SWEEPING: { bg: 'rgba(0, 223, 143, 0.12)', color: 'var(--mint-neon)', label: 'FinOrchestrator AI' },
                AUDIT: { bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', label: 'ACID SAK EMKM' },
                DUNNING: { bg: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', label: 'WhatsApp Dunning' }
              };
              const badge = badgeColors[item.category] || { bg: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0', label: item.source };

              return (
                <div 
                  key={item.id}
                  onClick={() => item.actionTab && onNavigate(item.actionTab)}
                  className={isHighlight ? 'homies-card-highlight' : 'homies-card-inner'}
                  style={{
                    padding: '11px 14px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                    <h4 style={{ 
                      fontSize: '0.84rem', 
                      fontWeight: 600, 
                      color: '#FFFFFF', 
                      margin: 0,
                      lineHeight: 1.3
                    }}>
                      {item.title}
                    </h4>
                  </div>

                  <p style={{ 
                    fontSize: '0.72rem', 
                    color: isHighlight ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8', 
                    margin: '0 0 8px 0',
                    lineHeight: 1.35
                  }}>
                    {item.subtitle}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.66rem',
                        padding: '2px 7px',
                        borderRadius: '5px',
                        background: badge.bg,
                        color: badge.color,
                        fontWeight: 600
                      }}>
                        {badge.label}
                      </span>
                      <span style={{
                        fontSize: '0.66rem',
                        padding: '2px 7px',
                        borderRadius: '5px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: '#94a3b8'
                      }}>
                        {item.timeRange}
                      </span>
                    </div>

                    {/* Explicit Action CTA Button */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '0.70rem',
                      color: 'var(--mint-neon)',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      <span>{item.actionLabel}</span>
                      <ArrowUpRight size={11} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================== CARD 2: KINERJA LIKUIDITAS & EFISIENSI ARUS KAS ==================== */}
        <div className="homies-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Header: +70,3% Efisiensi Arus Kas + Action Arrow */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--mint-neon)',
                    boxShadow: '0 0 8px var(--mint-neon)'
                  }} />
                  <span style={{
                    fontSize: '1.60rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em'
                  }}>
                    +70,3%
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  Efisiensi Arus Kas & Likuiditas
                </div>
              </div>

              <button 
                className="homies-icon-btn" 
                title="Buka Simulasi Likuiditas & Monte Carlo"
                onClick={() => onNavigate('montecarlo')}
              >
                <ArrowUpRight size={17} color="#FFFFFF" />
              </button>
            </div>

            {/* Smooth Glowing Neon Mint Bezier Line Chart */}
            <div style={{ width: '100%', height: '140px', position: 'relative', marginTop: '4px' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 160" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="mintAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00DF8F" stopOpacity="0.32" />
                    <stop offset="85%" stopColor="#00DF8F" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="#00DF8F" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Dotted Mid-line Threshold */}
                <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="4 4" />

                {/* Filled Gradient Area */}
                <path
                  d="M 0 130 
                     C 60 145, 90 90, 150 115 
                     C 210 140, 250 55, 310 75 
                     C 370 95, 410 35, 470 45 
                     C 530 55, 570 25, 600 35 
                     L 600 160 L 0 160 Z"
                  fill="url(#mintAreaGradient)"
                />

                {/* Smooth Glowing Neon Mint Curve */}
                <path
                  d="M 0 130 
                     C 60 145, 90 90, 150 115 
                     C 210 140, 250 55, 310 75 
                     C 370 95, 410 35, 470 45 
                     C 530 55, 570 25, 600 35"
                  fill="none"
                  stroke="var(--mint-neon)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 8px rgba(0, 223, 143, 0.45))"
                />
              </svg>

              {/* Month Markers on X-Axis */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '6px',
                fontSize: '0.70rem',
                color: '#64748B',
                fontFamily: 'var(--font-mono)'
              }}>
                <span>Jul</span>
                <span>Agu</span>
                <span>Sep</span>
                <span>Okt</span>
                <span>Nov</span>
                <span>Des</span>
              </div>
            </div>
          </div>

          {/* 5 Micro-Metric Cards Horisontal di Bawah Chart (Anti-Truncate & Responsive) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: '8px',
            marginTop: '14px'
          }}>
            {/* Micro Card 1: Cadangan Kas */}
            <div className="homies-card-inner" style={{ padding: '8px 8px', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
                <Coins size={11} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Cadangan</span>
              </div>
              <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                {kpi.safetyBuffer > 0 ? (kpi.safetyBuffer >= 1000000 ? `${(kpi.safetyBuffer / 1000000).toFixed(0)}M` : `${(kpi.safetyBuffer / 1000).toFixed(0)}K`) : '50M'}
              </div>
              <div 
                onClick={() => onNavigate('ledger')}
                style={{ fontSize: '0.62rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
              >
                <span>Buku Besar</span>
                <span>↗</span>
              </div>
            </div>

            {/* Micro Card 2: Cash Runway */}
            <div className="homies-card-inner" style={{ padding: '8px 8px', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
                <Calendar size={11} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Runway</span>
              </div>
              <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                {kpi.cashRunwayDays > 0 ? `${(kpi.cashRunwayDays / 30).toFixed(1)} bln` : '14.2 bln'}
              </div>
              <div 
                onClick={() => onNavigate('montecarlo')}
                style={{ fontSize: '0.62rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
              >
                <span>Simulasi</span>
                <span>↗</span>
              </div>
            </div>

            {/* Micro Card 3: Rasio Lancar */}
            <div className="homies-card-inner" style={{ padding: '8px 8px', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
                <ArrowUpRight size={11} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rasio</span>
              </div>
              <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                1.85x
              </div>
              <div 
                onClick={() => onNavigate('cockpit')}
                style={{ fontSize: '0.62rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
              >
                <span>Audit</span>
                <span>↗</span>
              </div>
            </div>

            {/* Micro Card 4: Margin Bersih */}
            <div className="homies-card-inner" style={{ padding: '8px 8px', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
                <Receipt size={11} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Margin</span>
              </div>
              <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                6.5%
              </div>
              <div 
                onClick={() => onNavigate('b2b_benchmark')}
                style={{ fontSize: '0.62rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
              >
                <span>B2B</span>
                <span>↗</span>
              </div>
            </div>

            {/* Micro Card 5: PPh Final PP55 */}
            <div className="homies-card-inner" style={{ padding: '8px 8px', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
                <Receipt size={11} color="var(--mint-neon)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>PPh 0.5%</span>
              </div>
              <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                {kpi.estimatedTaxPP55 > 0 
                  ? (kpi.estimatedTaxPP55 >= 1000000 ? `Rp ${(kpi.estimatedTaxPP55 / 1000000).toFixed(1)}Jt` : `Rp ${(kpi.estimatedTaxPP55 / 1000).toFixed(0)}Rb`)
                  : 'Rp 923Rb'}
              </div>
              <div 
                onClick={() => onNavigate('ledger')}
                style={{ fontSize: '0.62rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
              >
                <span>Pajak</span>
                <span>↗</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== CARD 3: STATUS KARYAWAN & SHIFT ==================== */}
        <div className="homies-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
          {/* Header Card 3 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <h3 style={{ fontSize: '0.94rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                Status Karyawan
              </h3>
              <p style={{ fontSize: '0.70rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Distribusi tim & shift kerja
              </p>
            </div>
            <button 
              className="homies-icon-btn" 
              style={{ width: '28px', height: '28px' }} 
              onClick={() => onNavigate('staff')}
              title="Buka Manajemen Staf"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Metric Top: Active Count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
              Total Personel
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span className="mono" style={{ fontSize: '1.40rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
                {staffList.length > 0 ? staffList.length : 3}
              </span>
              <span style={{ fontSize: '0.70rem', color: 'var(--mint-neon)', fontWeight: 600 }}>
                Staf Aktif
              </span>
            </div>
          </div>

          {/* 3 Rounded Vertical Bar Charts (Compact & Balanced) */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: '75px',
            padding: '4px 8px 6px 8px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '12px'
          }}>
            {/* Bar 1: Permanent */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '30%' }}>
              <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--mint-neon)' }}>
                {staffList.length > 0 ? staffList.length : 3}
              </span>
              <div style={{
                width: '100%',
                height: '40px',
                background: 'var(--mint-neon)',
                borderRadius: '6px',
                boxShadow: '0 0 10px var(--mint-glow)'
              }} />
              <span style={{ fontSize: '0.66rem', color: 'var(--mint-neon)', fontWeight: 600 }}>
                Tetap
              </span>
            </div>

            {/* Bar 2: Contract */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '30%' }}>
              <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>
                0
              </span>
              <div style={{
                width: '100%',
                height: '12px',
                background: '#1A2433',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }} />
              <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                Kontrak
              </span>
            </div>

            {/* Bar 3: Probation */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '30%' }}>
              <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>
                0
              </span>
              <div style={{
                width: '100%',
                height: '12px',
                background: '#1A2433',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }} />
              <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                Probation
              </span>
            </div>
          </div>

          {/* Live Roster: Personel Bertugas Hari Ini (Scrollable jika data banyak) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.70rem', color: '#94a3b8', fontWeight: 600 }}>
                Personel Bertugas Hari Ini
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.64rem',
                color: 'var(--mint-neon)',
                fontWeight: 600
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--mint-neon)', boxShadow: '0 0 6px var(--mint-neon)' }} />
                Hadir Lengkap
              </span>
            </div>

            {/* Scrollable Roster Container */}
            <div 
              className="table-scroll-container"
              style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '135px', overflowY: 'auto' }}
            >
              {(staffList.length > 0 ? staffList : [
                { id: 'st-1', full_name: 'Andrean Maulana', role: 'OWNER' as const, is_active: true, phone_number: '081234567890', tenant_id: '' },
                { id: 'st-2', full_name: 'Budi Santoso', role: 'MANAGER' as const, is_active: true, phone_number: '081298765432', tenant_id: '' },
                { id: 'st-3', full_name: 'Siti Rahma', role: 'CASHIER' as const, is_active: true, phone_number: '081377889900', tenant_id: '' }
              ]).map((member, idx) => {
                const cleanName = member.full_name ? member.full_name.replace(/\s*\(.*?\)/g, '') : 'Staf';
                const initials = cleanName
                  ? cleanName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  : 'ST';
                const roleColors: Record<string, { bg: string; color: string }> = {
                  OWNER: { bg: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' },
                  MANAGER: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' },
                  CASHIER: { bg: 'rgba(0, 223, 143, 0.15)', color: 'var(--mint-neon)' },
                  AUDITOR: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }
                };
                const roleStyle = roleColors[member.role] || { bg: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' };

                return (
                  <div
                    key={member.id || idx}
                    onClick={() => setTableMode('STAFF')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 9px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '7px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: roleStyle.bg,
                        color: roleStyle.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {initials}
                      </div>
                      <span style={{ 
                        fontSize: '0.76rem', 
                        color: '#FFFFFF', 
                        fontWeight: 500, 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {cleanName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        padding: '2px 5px',
                        borderRadius: '4px',
                        background: roleStyle.bg,
                        color: roleStyle.color
                      }}>
                        {member.role}
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        color: 'var(--mint-neon)',
                        fontWeight: 500
                      }}>
                        On Duty
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Card Footer Link */}
            <div 
              onClick={() => onNavigate('staff')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '0.68rem',
                color: 'var(--mint-neon)',
                cursor: 'pointer',
                paddingTop: '6px',
                marginTop: 'auto'
              }}
            >
              <span>Kelola Staf & Presensi</span>
              <ArrowUpRight size={11} />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. BOTTOM BENTO CARD (LIST EMPLOYEE / TRANSAKSI & JURNAL SAK EMKM)
          ========================================================================= */}
      <div className="homies-card" style={{ padding: '22px' }}>
        {/* Table Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 2px 0' }}>
                {tableMode === 'STAFF' ? 'Daftar Karyawan' : 'Jurnal Transaksi Kasir'}
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0 }}>
                {tableMode === 'STAFF' 
                  ? `Akun personel tim dan hak akses aktif (${staffList.length} terdaftar).`
                  : 'Catatan mutasi kasir POS dan pelunasan piutang usaha.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '3px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                type="button"
                onClick={() => setTableMode('STAFF')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: tableMode === 'STAFF' ? 'var(--mint-neon)' : 'transparent',
                  color: tableMode === 'STAFF' ? '#000000' : '#94a3b8'
                }}
              >
                Karyawan ({staffList.length > 0 ? staffList.length : 3})
              </button>
              <button
                type="button"
                onClick={() => setTableMode('TRANSACTIONS')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: tableMode === 'TRANSACTIONS' ? 'var(--mint-neon)' : 'transparent',
                  color: tableMode === 'TRANSACTIONS' ? '#000000' : '#94a3b8'
                }}
              >
                Transaksi ({liveEntries.length > 0 ? liveEntries.length : transactions.length})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              padding: '6px 14px',
              width: '210px'
            }}>
              <Search size={14} color="#64748B" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari..."
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

            <button 
              className="homies-icon-btn" 
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              onClick={() => onNavigate(tableMode === 'STAFF' ? 'staff' : 'ledger')}
              title={tableMode === 'STAFF' ? 'Buka Manajemen Staf Lengkap' : 'Buka Buku Besar Lengkap'}
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Data Table with Internal Scroll & Sticky Header */}
        <div 
          className="table-scroll-container"
          style={{ 
            maxHeight: '360px', 
            overflowY: 'auto',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead className="sticky-table-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#111A24' }}>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: '#111A24' }}>
                <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                  {tableMode === 'STAFF' ? 'NAMA PERSONEL' : 'DESKRIPSI TRANSAKSI'}
                </th>
                <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                  {tableMode === 'STAFF' ? 'ID STAF' : 'REFERENSI'}
                </th>
                <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                  {tableMode === 'STAFF' ? 'PERAN' : 'AKUN BUKU BESAR'}
                </th>
                <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                  {tableMode === 'STAFF' ? 'KONTAK' : 'NOMINAL'}
                </th>
                <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>STATUS</th>
                <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>TANGGAL</th>
                <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>DEPARTEMEN</th>
                <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {tableMode === 'STAFF' ? (
                filteredStaffList.map((staff, idx) => {
                  const empId = `EMP-${(idx + 1).toString().padStart(4, '0')}`;
                  const dept = staff.role === 'OWNER' ? 'Direksi & Manajemen' : staff.role === 'MANAGER' ? 'Operasional Toko' : 'Kasir & Front Office';
                  const emailOrPhone = maskPhone(staff.phone_number);
                  const cleanName = staff.full_name ? staff.full_name.replace(/\s*\(.*?\)/g, '') : 'Staf';
                  const avatar = staff.role === 'OWNER'
                    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60'
                    : staff.role === 'MANAGER'
                    ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60'
                    : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60';
                  
                  return (
                    <tr key={staff.id} className="homies-table-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img 
                            src={avatar} 
                            alt={cleanName}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                          <div>
                            <div style={{ fontSize: '0.80rem', fontWeight: 600, color: '#FFFFFF' }}>
                              {cleanName}
                            </div>
                            <div style={{ fontSize: '0.70rem', color: '#64748B' }}>
                              @{staff.role.toLowerCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="mono" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                          {empId}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: staff.role === 'OWNER' ? 'rgba(0, 223, 143, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                          color: staff.role === 'OWNER' ? 'var(--mint-neon)' : '#FFFFFF'
                        }}>
                          {staff.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="mono" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                          {emailOrPhone}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          color: 'var(--mint-neon)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ● Aktif
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                          {staff.created_at ? new Date(staff.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Aktif'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                          {dept}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button 
                          className="homies-icon-btn" 
                          style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                          onClick={() => onNavigate('staff')}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="homies-table-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    {/* Name + Avatar */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={trx.avatarSeed} 
                          alt={trx.name}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                        <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#FFFFFF' }}>
                          {trx.name}
                        </span>
                      </div>
                    </td>

                    {/* Employee ID / Ref */}
                    <td style={{ padding: '12px 14px' }}>
                      <span className="mono" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {trx.refId}
                      </span>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                        {trx.accountRole}
                      </span>
                    </td>

                    {/* Nominal */}
                    <td style={{ padding: '12px 14px' }}>
                      <span className="mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {formatCurrency(trx.nominal)}
                      </span>
                    </td>

                    {/* Status: Sukses */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        color: 'var(--mint-neon)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ● {trx.status === 'Active' ? 'Sukses' : trx.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {trx.date}
                      </span>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                        {trx.department}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button 
                        className="homies-icon-btn" 
                        style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                        onClick={() => onNavigate('ledger')}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          5. ENTERPRISE QUICK LAUNCHPAD (FinOrchestrator Deep-Link Navigation)
             Memastikan SEMUA fitur FINA-ENTERPRISE tetap dapat diakses dengan cepat!
          ========================================================================= */}
      <div className="homies-card-inner" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} color="var(--mint-neon)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>
            Pintasan Modul:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className="homies-pill-btn" 
            onClick={() => onNavigate('forensics')}
            style={{ fontSize: '0.74rem' }}
          >
            <span>Scan Nota & ELA ↗</span>
          </button>
          <button 
            className="homies-pill-btn" 
            onClick={() => onNavigate('b2b_benchmark')}
            style={{ fontSize: '0.74rem' }}
          >
            <span>Audit Harga B2B ↗</span>
          </button>
          <button 
            className="homies-pill-btn" 
            onClick={() => onNavigate('ar_dunning')}
            style={{ fontSize: '0.74rem' }}
          >
            <span>Penagihan WhatsApp ↗</span>
          </button>
          <button 
            className="homies-pill-btn" 
            onClick={() => onNavigate('loan_deobfuscator')}
            style={{ fontSize: '0.74rem' }}
          >
            <span>Anti-Pinjol ↗</span>
          </button>
          <button 
            className="homies-pill-btn" 
            onClick={() => onNavigate('voice_dialect')}
            style={{ fontSize: '0.74rem' }}
          >
            <span>Voice Kasir ↗</span>
          </button>
        </div>
      </div>

    </div>
  );
};
