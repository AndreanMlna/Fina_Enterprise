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

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const data = await api.getStaffList();
        if (Array.isArray(data)) setStaffList(data);
      } catch (err) {
        console.warn("[CockpitView] Gagal mengambil daftar staf:", err);
      }
    };
    loadStaff();
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

  // Event telemetry agen otonom FINA-ENTERPRISE
  const telemetryEvents: TelemetryEvent[] = useMemo(() => {
    const hasCashSurplus = kpi.liquidCash > kpi.safetyBuffer && kpi.safetyBuffer > 0;
    const surplusAmount = hasCashSurplus ? kpi.liquidCash - kpi.safetyBuffer : 0;

    return [
      {
        id: 'tel-1',
        category: 'SWEEPING',
        title: hasCashSurplus ? 'Idle Cash Sweeping & Deposito Otomatis' : 'Optimasi Cadangan Kas Operasional',
        subtitle: hasCashSurplus 
          ? `Surplus ${formatCurrency(surplusAmount)} dialokasikan ke instrumen pasar uang aman 5.9% p.a.`
          : 'Penyangga likuiditas dipertahankan disiplin untuk ketahanan operasional usaha.',
        source: 'FinOrchestrator FSM',
        timeRange: '13:00 - 13:30',
        status: 'ACTIVE',
        avatars: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60'],
        actionTab: 'montecarlo'
      },
      {
        id: 'tel-2',
        category: 'AUDIT',
        title: 'Verifikasi Kriptografis SHA-256 Merkle Chaining',
        subtitle: 'Audit integritas buku besar double-entry ACID & standar SAK EMKM Ikatan Akuntan Indonesia.',
        source: 'PostgreSQL ACID Engine',
        timeRange: '15:00 - 16:00',
        status: 'NORMAL',
        avatars: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60'],
        actionTab: 'ledger'
      },
      {
        id: 'tel-3',
        category: 'DUNNING',
        title: 'WhatsApp Dunning Penagihan Piutang Otomatis',
        subtitle: kpi.activeAccountsReceivable > 0 
          ? `Piutang jatuh tempo ${formatCurrency(kpi.activeAccountsReceivable)} siap dikirim penagihan sopan berlink QRIS SNAP.`
          : 'Arus piutang terpantau lancar tanpa tagihan yang tertunggak hari ini.',
        source: 'AR Dunning Agent',
        timeRange: '16:30 - 17:00',
        status: 'NORMAL',
        avatars: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60'],
        actionTab: 'ar_dunning'
      }
    ];
  }, [kpi]);

  const filteredTelemetry = useMemo(() => {
    if (activeTelemetryFilter === 'ALL') return telemetryEvents;
    return telemetryEvents.filter(e => e.category === activeTelemetryFilter);
  }, [telemetryEvents, activeTelemetryFilter]);

  // Data transaksi buku besar & POS terkini untuk tabel bawah (List Employee / Transaksi)
  const transactions: TransactionRow[] = useMemo(() => [
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
  ], []);

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
              Good Morning, {tenant?.name || 'Homies'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.90rem', margin: 0 }}>
              It's {formattedToday}.
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
                  {kpi.liquidCash > 0 ? (kpi.liquidCash >= 1000000 ? `${(kpi.liquidCash / 1000000).toFixed(1)}M` : `${(kpi.liquidCash / 1000).toFixed(0)}K`) : '99.8M'}
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
                  184.5M
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
                  {kpi.activeAccountsReceivable > 0 ? `${(kpi.activeAccountsReceivable / 1000000).toFixed(1)}M` : '8.9M'}
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
                  3 Staf
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Karyawan Aktif
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Semicircular Radial Gauge Meter (80% Health Score SAK EMKM) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ width: '200px', height: '170px', position: 'relative' }}>
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
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

              {/* Dial Numbers di luar lingkaran sesuai referensi */}
              <text x="35" y="152" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">00</text>
              <text x="56" y="44" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">40</text>
              <text x="134" y="44" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">60</text>
              <text x="160" y="112" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">80</text>
              <text x="144" y="152" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="var(--font-mono)">100</text>

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
              top: '52%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              width: '140px',
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
                fontWeight: 600
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1.45fr) minmax(0, 0.95fr)',
        gap: '16px',
        alignItems: 'stretch'
      }}>
        {/* ==================== CARD 1: SCHEDULE & TELEMETRI ==================== */}
        <div className="homies-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          {/* Header Card 1 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                className="homies-pill-btn" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  fontSize: '0.76rem',
                  padding: '4px 12px'
                }}
              >
                11 Nov 2024 ▾
              </button>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                Schedule
              </h3>
            </div>
            <button className="homies-icon-btn" style={{ width: '28px', height: '28px' }}>
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Pill Tab Filters: Meetings, Tasks, Events */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button 
              className={`homies-pill-btn ${activeTelemetryFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTelemetryFilter('ALL')}
            >
              Meetings
            </button>
            <button 
              className={`homies-pill-btn ${activeTelemetryFilter === 'SWEEPING' ? 'active' : ''}`}
              onClick={() => setActiveTelemetryFilter('SWEEPING')}
            >
              Tasks
            </button>
            <button 
              className={`homies-pill-btn ${activeTelemetryFilter === 'AUDIT' ? 'active' : ''}`}
              onClick={() => setActiveTelemetryFilter('AUDIT')}
            >
              Events
            </button>
          </div>

          {/* Event Items Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {filteredTelemetry.map((item, idx) => {
              const isHighlight = idx === 0;
              return (
                <div 
                  key={item.id}
                  onClick={() => item.actionTab && onNavigate(item.actionTab)}
                  className={isHighlight ? 'homies-card-highlight' : 'homies-card-inner'}
                  style={{
                    padding: '14px 16px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{ 
                      fontSize: '0.86rem', 
                      fontWeight: 600, 
                      color: '#FFFFFF', 
                      margin: 0,
                      lineHeight: 1.3
                    }}>
                      {item.title}
                    </h4>
                    <span style={{ 
                      color: 'var(--mint-neon)', 
                      fontSize: '1.05rem', 
                      lineHeight: 1, 
                      marginLeft: '6px' 
                    }}>
                      ∞
                    </span>
                  </div>

                  <p style={{ 
                    fontSize: '0.74rem', 
                    color: isHighlight ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8', 
                    margin: '0 0 12px 0',
                    lineHeight: 1.4
                  }}>
                    {item.subtitle}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.70rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                        fontWeight: 500
                      }}>
                        Google Meet
                      </span>
                      <span style={{
                        fontSize: '0.70rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: '#94a3b8'
                      }}>
                        {item.timeRange}
                      </span>
                    </div>

                    {/* Avatar Stack */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <img 
                        src={item.avatars[0]} 
                        alt="Assignee" 
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '2px solid #111A24',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================== CARD 2: AVERAGE TEAM KPI (BEZIER AREA CHART) ==================== */}
        <div className="homies-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Header: 70,32% Average Team KPI + Action Arrow */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
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
                    fontSize: '1.65rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em'
                  }}>
                    70,32%
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Average Team KPI
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
            <div style={{ width: '100%', height: '145px', position: 'relative', marginTop: '6px' }}>
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
                fontSize: '0.72rem',
                color: '#64748B',
                fontFamily: 'var(--font-mono)'
              }}>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </div>
          </div>

          {/* 5 Micro-Metric Cards Horisontal di Bawah Chart */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            marginTop: '16px'
          }}>
            {/* Micro Card 1: Cadangan Kas */}
            <div className="homies-card-inner" style={{ padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <Coins size={11} color="var(--mint-neon)" />
                <span style={{ fontSize: '0.64rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Cadangan Kas</span>
              </div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                {kpi.safetyBuffer > 0 ? (kpi.safetyBuffer >= 1000000 ? `${(kpi.safetyBuffer / 1000000).toFixed(0)}M` : `${(kpi.safetyBuffer / 1000).toFixed(0)}K`) : '50M'}
              </div>
              <div 
                onClick={() => onNavigate('ledger')}
                style={{ fontSize: '0.64rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <span>Buku Besar</span>
                <span>↗</span>
              </div>
            </div>

            {/* Micro Card 2: Cash Runway */}
            <div className="homies-card-inner" style={{ padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <Calendar size={11} color="var(--mint-neon)" />
                <span style={{ fontSize: '0.64rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Cash Runway</span>
              </div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                {kpi.cashRunwayDays > 0 ? `${(kpi.cashRunwayDays / 30).toFixed(1)} bln` : '14.2 bln'}
              </div>
              <div 
                onClick={() => onNavigate('montecarlo')}
                style={{ fontSize: '0.64rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <span>Simulasi</span>
                <span>↗</span>
              </div>
            </div>

            {/* Micro Card 3: Rasio Lancar */}
            <div className="homies-card-inner" style={{ padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <ArrowUpRight size={11} color="var(--mint-neon)" />
                <span style={{ fontSize: '0.64rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Rasio Lancar</span>
              </div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                1.85x
              </div>
              <div 
                onClick={() => onNavigate('cockpit')}
                style={{ fontSize: '0.64rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <span>Audit Rasio</span>
                <span>↗</span>
              </div>
            </div>

            {/* Micro Card 4: Margin Bersih */}
            <div className="homies-card-inner" style={{ padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <Receipt size={11} color="var(--mint-neon)" />
                <span style={{ fontSize: '0.64rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>Margin Bersih</span>
              </div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                6.5%
              </div>
              <div 
                onClick={() => onNavigate('b2b_benchmark')}
                style={{ fontSize: '0.64rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <span>Margin B2B</span>
                <span>↗</span>
              </div>
            </div>

            {/* Micro Card 5: PPh Final PP55 */}
            <div className="homies-card-inner" style={{ padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <Receipt size={11} color="var(--mint-neon)" />
                <span style={{ fontSize: '0.64rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>PPh Final (0,5%)</span>
              </div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                {formatCurrency(kpi.estimatedTaxPP55 > 0 ? kpi.estimatedTaxPP55 : 922500)}
              </div>
              <div 
                onClick={() => onNavigate('ledger')}
                style={{ fontSize: '0.64rem', color: 'var(--mint-neon)', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <span>Pajak UMKM</span>
                <span>↗</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== CARD 3: EMPLOYMENT STATUS (VERTICAL BARS) ==================== */}
        <div className="homies-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          {/* Header Card 3 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
              Status Karyawan
            </h3>
            <button className="homies-icon-btn" style={{ width: '28px', height: '28px' }} onClick={() => onNavigate('staff')}>
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Metric Top: 3 Active Employee */}
          <div style={{ textAlign: 'right', marginBottom: '14px' }}>
            <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
              3
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Staf Karyawan Aktif
            </div>
          </div>

          {/* 3 Rounded Vertical Bar Charts */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            flex: 1,
            minHeight: '190px',
            paddingBottom: '6px'
          }}>
            {/* Bar 1: Permanent (Tallest, Radiant Mint) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '30%' }}>
              <div style={{
                width: '100%',
                height: '145px',
                background: 'var(--mint-neon)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '10px',
                boxShadow: '0 0 16px var(--mint-glow)'
              }}>
                <span className="mono" style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0B1118' }}>
                  3
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--mint-neon)', fontWeight: 600 }}>
                Tetap
              </span>
            </div>

            {/* Bar 2: Contract (Medium, Dark Slate) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '30%' }}>
              <span className="mono" style={{ fontSize: '0.80rem', fontWeight: 600, color: '#94a3b8' }}>
                0
              </span>
              <div style={{
                width: '100%',
                height: '35px',
                background: '#1A2433',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }} />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Kontrak
              </span>
            </div>

            {/* Bar 3: Probation (Shorter, Dark Slate) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '30%' }}>
              <span className="mono" style={{ fontSize: '0.80rem', fontWeight: 600, color: '#94a3b8' }}>
                0
              </span>
              <div style={{
                width: '100%',
                height: '35px',
                background: '#1A2433',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }} />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Probation
              </span>
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 2px 0' }}>
                {tableMode === 'STAFF' ? 'List Employee' : 'Transaksi & Jurnal SAK EMKM'}
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0 }}>
                {tableMode === 'STAFF' 
                  ? `Daftar akun tim & karyawan aktif PT Abadi Nan Jaya (${staffList.length} personel terdaftar).`
                  : 'Daftar entri pembukuan SAK EMKM & transaksi kasir terverifikasi ACID.'}
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
                Karyawan ({staffList.length})
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
                Transaksi ({transactions.length})
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
                placeholder="Search..."
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

        {/* Data Table */}
        <div className="table-scroll-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <th style={{ padding: '10px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>NAME</th>
                <th style={{ padding: '10px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                  {tableMode === 'STAFF' ? 'EMPLOYEE ID' : 'REF / JURNAL'}
                </th>
                <th style={{ padding: '10px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                  {tableMode === 'STAFF' ? 'ROLE' : 'AKUN BUKU BESAR'}
                </th>
                <th style={{ padding: '10px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                  {tableMode === 'STAFF' ? 'EMAIL / KONTAK' : 'NOMINAL'}
                </th>
                <th style={{ padding: '10px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>STATUS</th>
                <th style={{ padding: '10px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>DATE</th>
                <th style={{ padding: '10px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>DEPARTMENT</th>
                <th style={{ padding: '10px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {tableMode === 'STAFF' ? (
                filteredStaffList.map((staff, idx) => {
                  const empId = `EMP-${(idx + 1).toString().padStart(4, '0')}`;
                  const dept = staff.role === 'OWNER' ? 'Direksi & Manajemen' : staff.role === 'MANAGER' ? 'Operasional Toko' : 'Kasir & Front Office';
                  const emailOrPhone = maskPhone(staff.phone_number);
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
                            alt={staff.full_name}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                          <div>
                            <div style={{ fontSize: '0.80rem', fontWeight: 600, color: '#FFFFFF' }}>
                              {staff.full_name}
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
                          ● Active
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

                    {/* Status: Active (Green text/badge) */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        color: 'var(--mint-neon)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ● {trx.status}
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
      <div className="homies-card-inner" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} color="var(--mint-neon)" />
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#FFFFFF' }}>
            Aksi Cepat Modul Otonom:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className="homies-pill-btn" 
            onClick={() => onNavigate('forensics')}
            style={{ fontSize: '0.74rem' }}
          >
            <span>Scan Nota & Uji ELA ↗</span>
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
            <span>Uji Anti-Pinjol ↗</span>
          </button>
          <button 
            className="homies-pill-btn" 
            onClick={() => onNavigate('voice_dialect')}
            style={{ fontSize: '0.74rem' }}
          >
            <span>Voice Dialek Daerah ↗</span>
          </button>
        </div>
      </div>

    </div>
  );
};
