import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Database, 
  Headphones, 
  Sparkles, 
  TrendingUp, 
  FileCheck2, 
  FileSpreadsheet, 
  Coins, 
  Mic2, 
  Cpu,
  ShoppingCart,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  Play,
  ArrowDown,
  ChevronRight,
  Zap,
  Lock
} from 'lucide-react';
import type { AppPage } from '../../types';

interface HomepageViewProps {
  onNavigatePage: (page: AppPage) => void;
}

export const HomepageView: React.FC<HomepageViewProps> = ({ onNavigatePage }) => {
  // State for Interactive Showcase Workbench
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'pos' | 'ledger' | 'loan' | 'ela'>('pos');

  // Interactive Demo 1: POS Kasir Cart
  const [cart, setCart] = useState<Record<string, number>>({
    'Kopi Susu Gula Aren': 2,
    'Roti Bakar Coklat Keju': 1
  });
  const [isSimulatingPOS, setIsSimulatingPOS] = useState(false);
  const [posSuccessResult, setPosSuccessResult] = useState<boolean>(true);

  const menuItems = [
    { name: 'Kopi Susu Gula Aren', price: 18000, category: 'Minuman' },
    { name: 'Roti Bakar Coklat Keju', price: 15000, category: 'Makanan' },
    { name: 'Ayam Geprek Sambal Bawang', price: 24000, category: 'Makanan' },
    { name: 'Es Teh Manis Melati', price: 6000, category: 'Minuman' }
  ];

  const updateCart = (name: string, delta: number) => {
    setCart(prev => {
      const current = prev[name] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: next };
    });
  };

  const calculateSubtotal = () => {
    return Object.entries(cart).reduce((sum, [name, qty]) => {
      const item = menuItems.find(m => m.name === name);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  };

  const handleSimulateSale = () => {
    setIsSimulatingPOS(true);
    setTimeout(() => {
      setIsSimulatingPOS(false);
      setPosSuccessResult(true);
    }, 400);
  };

  // Interactive Demo 2: SAK EMKM Transactions
  const [activeLedgerScenario, setActiveLedgerScenario] = useState<'penjualan' | 'kulakan' | 'listrik'>('penjualan');

  const ledgerScenarios = {
    penjualan: {
      title: 'Penjualan Kasir POS Harian (Tunai & QRIS)',
      date: 'Hari ini, 14:30 WIB',
      entries: [
        { code: '1-1000', name: 'Kas Kasir Operasional', debit: 450000, credit: 0, type: 'Aset' },
        { code: '1-1010', name: 'Kas Rekening QRIS Bank', debit: 380000, credit: 0, type: 'Aset' },
        { code: '4-1000', name: 'Pendapatan Usaha Penjualan', debit: 0, credit: 830000, type: 'Pendapatan' }
      ],
      hash: 'sha256:7f9b2d89e5a1b3c4f7082937eecba190847291a1',
      balanced: true
    },
    kulakan: {
      title: 'Kulakan Bahan Baku Pasar Tradisional',
      date: 'Hari ini, 06:15 WIB',
      entries: [
        { code: '5-1000', name: 'Beban Pokok Penjualan (HPP)', debit: 520000, credit: 0, type: 'Beban' },
        { code: '1-1000', name: 'Kas Kasir Operasional', debit: 0, credit: 520000, type: 'Aset' }
      ],
      hash: 'sha256:4b19c8f09e827103a890dbce34091fe82910ab31',
      balanced: true
    },
    listrik: {
      title: 'Pembayaran Token Listrik & Wifi Kios',
      date: 'Kemarin, 19:40 WIB',
      entries: [
        { code: '6-1020', name: 'Beban Utilitas & Energi', debit: 175000, credit: 0, type: 'Beban' },
        { code: '1-1000', name: 'Kas Kasir Operasional', debit: 0, credit: 175000, type: 'Aset' }
      ],
      hash: 'sha256:e0921a9c801bfe4839218d098e72ba9c83204981',
      balanced: true
    }
  };

  // Interactive Demo 3: Loan Calculator
  const [loanPrincipal, setLoanPrincipal] = useState<number>(5000000);
  const [loanDays, setLoanDays] = useState<number>(30);
  const [dailyRatePercent, setDailyRatePercent] = useState<number>(0.4);

  const totalLoanInterest = Math.round(loanPrincipal * (dailyRatePercent / 100) * loanDays);
  const effectiveAPR = Math.round(dailyRatePercent * 365 * 10) / 10;

  // Interactive Demo 4: ELA Receipt Forensic
  const [elaSample, setElaSample] = useState<'authentic' | 'tampered'>('tampered');

  const scrollToWorkbench = () => {
    const el = document.getElementById('interactive-workbench');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 10%, #0d1933 0%, #050811 75%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Top Navbar */}
      <nav style={{
        padding: '18px 36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        background: 'rgba(5, 8, 17, 0.75)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
          }}>
            <ShieldCheck size={26} color="#021a10" strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              FINA<span style={{ color: 'var(--emerald-400)' }}>-ENTERPRISE</span>
            </span>
            <span className="badge badge-emerald" style={{ marginLeft: '8px', fontSize: '0.65rem', verticalAlign: 'middle' }}>
              FINTECH AI
            </span>
          </div>
        </div>

        {/* Action Buttons in Navbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => onNavigatePage('login')}
            className="btn btn-primary"
            style={{ 
              fontSize: '0.86rem', 
              padding: '9px 22px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              borderRadius: '999px'
            }}
          >
            <span>Masuk Pengusaha UMKM</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '75px 24px 50px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '22px'
      }}>
        {/* Compliance Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 18px',
          borderRadius: '999px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          fontSize: '0.78rem',
          color: 'var(--emerald-400)',
          fontWeight: 600,
          boxShadow: '0 2px 12px rgba(16, 185, 129, 0.15)'
        }}>
          <Sparkles size={14} />
          <span>FinOrchestrator FSM • Standar Akuntansi SAK EMKM • Terlindungi UU PDP No. 27/2022</span>
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.15,
          maxWidth: '960px',
          margin: 0
        }}>
          Sistem <span style={{
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 45%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Agentic AI Keuangan Otonom</span> untuk Ketahanan Usaha Anda.
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          maxWidth: '800px',
          lineHeight: 1.6,
          margin: 0
        }}>
          Bebaskan usaha Anda dari keruwetan pembukuan. Ubah nota fisik dan pesan suara dialek pasar menjadi pembukuan SAK EMKM seimbang secara instan, bongkar bunga pinjol mencekik, dan kelola kasir POS terintegrasi dengan pendampingan Customer Support 24/7.
        </p>

        {/* Hero CTA Group */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => onNavigatePage('login')}
            style={{ 
              fontSize: '0.96rem', 
              padding: '14px 34px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              borderRadius: '12px'
            }}
          >
            <span>Mulai Kelola Finansial Usaha</span>
            <ArrowRight size={18} />
          </button>

          <button
            className="btn btn-ghost"
            onClick={scrollToWorkbench}
            style={{ 
              fontSize: '0.92rem', 
              padding: '14px 26px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              borderRadius: '12px'
            }}
          >
            <Play size={16} color="var(--cyan-400)" />
            <span>Uji Coba Demo Interaktif</span>
            <ArrowDown size={15} />
          </button>
        </div>

        {/* Micro Telemetry Badges */}
        <div style={{
          display: 'flex',
          gap: '28px',
          marginTop: '32px',
          padding: '14px 28px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--cyan-400)" />
            <span>PostgreSQL 16 + pgvector ACID</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck2 size={16} color="var(--emerald-400)" />
            <span>Format Pajak PP 55/2022 Otomatis</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Headphones size={16} color="var(--indigo-400)" />
            <span>Human-in-the-Loop Support 24/7</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* INTERACTIVE SHOWCASE WORKBENCH (LIVE SIMULATION PLAYGROUND) */}
      {/* ========================================================================= */}
      <section id="interactive-workbench" style={{
        maxWidth: '1200px',
        margin: '20px auto 60px auto',
        padding: '0 24px',
        width: '100%'
      }}>
        <div className="glass-panel" style={{
          padding: '32px 28px',
          background: 'rgba(10, 18, 34, 0.88)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px -5px rgba(16, 185, 129, 0.12)',
          borderRadius: '24px'
        }}>
          {/* Header Showcase */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--cyan-400)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <Zap size={14} />
                <span>Live Interactive Simulation Workbench</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0 0', color: '#ffffff' }}>
                Eksplorasi Fitur Otonom FINA-ENTERPRISE
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                Uji langsung mesin kecerdasan akuntansi otonom kami secara real-time di bawah ini:
              </p>
            </div>

            <button
              onClick={() => onNavigatePage('login')}
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 16px', borderRadius: '8px' }}
            >
              <span>Daftarkan Bisnis Anda</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Tab Selector Segment */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '8px',
            background: 'rgba(5, 10, 20, 0.7)',
            padding: '6px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '28px'
          }}>
            <button
              onClick={() => setActiveShowcaseTab('pos')}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: activeShowcaseTab === 'pos' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent',
                background: activeShowcaseTab === 'pos' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.18) 100%)' : 'transparent',
                color: activeShowcaseTab === 'pos' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeShowcaseTab === 'pos' ? 700 : 500,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <ShoppingCart size={16} color={activeShowcaseTab === 'pos' ? 'var(--emerald-400)' : 'currentColor'} />
              <span>1. POS Kasir & Auto-Ledger</span>
            </button>

            <button
              onClick={() => setActiveShowcaseTab('ledger')}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: activeShowcaseTab === 'ledger' ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid transparent',
                background: activeShowcaseTab === 'ledger' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(99, 102, 241, 0.18) 100%)' : 'transparent',
                color: activeShowcaseTab === 'ledger' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeShowcaseTab === 'ledger' ? 700 : 500,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FileSpreadsheet size={16} color={activeShowcaseTab === 'ledger' ? 'var(--cyan-400)' : 'currentColor'} />
              <span>2. Jurnal SAK EMKM Double-Entry</span>
            </button>

            <button
              onClick={() => setActiveShowcaseTab('loan')}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: activeShowcaseTab === 'loan' ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid transparent',
                background: activeShowcaseTab === 'loan' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(244, 63, 94, 0.18) 100%)' : 'transparent',
                color: activeShowcaseTab === 'loan' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeShowcaseTab === 'loan' ? 700 : 500,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Calculator size={16} color={activeShowcaseTab === 'loan' ? 'var(--amber-400)' : 'currentColor'} />
              <span>3. Anti-Loan (APR vs Flat)</span>
            </button>

            <button
              onClick={() => setActiveShowcaseTab('ela')}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: activeShowcaseTab === 'ela' ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid transparent',
                background: activeShowcaseTab === 'ela' ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(168, 85, 247, 0.18) 100%)' : 'transparent',
                color: activeShowcaseTab === 'ela' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeShowcaseTab === 'ela' ? 700 : 500,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <ScanLine size={16} color={activeShowcaseTab === 'ela' ? 'var(--rose-400)' : 'currentColor'} />
              <span>4. Forensik Struk Thermal ELA</span>
            </button>
          </div>

          {/* TAB 1 CONTENT: POS KASIR */}
          {activeShowcaseTab === 'pos' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px' }}>
                  Katalog Kasir Cepat (Klik untuk menambah/mengurangi):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {menuItems.map(item => {
                    const count = cart[item.name] || 0;
                    return (
                      <div 
                        key={item.name}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          background: count > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                          border: count > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)',
                          borderRadius: '12px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff' }}>{item.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--emerald-400)', fontWeight: 600 }}>
                            Rp {item.price.toLocaleString('id-ID')}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => updateCart(item.name, -1)}
                            disabled={count === 0}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.15)',
                              background: 'rgba(255,255,255,0.05)',
                              color: '#fff',
                              cursor: count === 0 ? 'not-allowed' : 'pointer',
                              fontWeight: 700
                            }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 700, fontSize: '0.88rem' }}>
                            {count}
                          </span>
                          <button
                            onClick={() => updateCart(item.name, 1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: 'var(--emerald-400)',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Live Struk & Auto SAK EMKM Voucher */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>Terminal Kasir #POS-01</div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Siap Transaksi</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                  {Object.entries(cart).map(([name, qty]) => {
                    const item = menuItems.find(m => m.name === name);
                    if (!item) return null;
                    return (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>{qty}x {name}</span>
                        <span>Rp {(item.price * qty).toLocaleString('id-ID')}</span>
                      </div>
                    );
                  })}
                  {Object.keys(cart).length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                      Keranjang kosong. Pilih menu di sebelah kiri.
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>Total Kasir:</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--emerald-400)' }}>
                    Rp {calculateSubtotal().toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={handleSimulateSale}
                  disabled={calculateSubtotal() === 0 || isSimulatingPOS}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '11px', marginTop: '4px', fontSize: '0.88rem' }}
                >
                  {isSimulatingPOS ? (
                    <span>Menyeimbangkan Buku Besar...</span>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Simulasikan Pembayaran & Jurnal Otomatis</span>
                    </>
                  )}
                </button>

                {posSuccessResult && calculateSubtotal() > 0 && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--emerald-400)', fontWeight: 700, marginBottom: '6px' }}>
                      <CheckCircle2 size={14} />
                      <span>Jurnal Double-Entry SAK EMKM Otomatis Seimbang:</span>
                    </div>
                    <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <div>• [D] 1-1000 Kas Kasir: +Rp {calculateSubtotal().toLocaleString('id-ID')}</div>
                      <div>• [K] 4-1000 Pendapatan Usaha: +Rp {calculateSubtotal().toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--cyan-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={11} />
                      <span>Merkle Block Hash Terkunci (Zero Human Intervention)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2 CONTENT: BUKU BESAR */}
          {activeShowcaseTab === 'ledger' && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveLedgerScenario('penjualan')}
                  className={`btn btn-sm ${activeLedgerScenario === 'penjualan' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Kasir Penjualan Harian
                </button>
                <button
                  onClick={() => setActiveLedgerScenario('kulakan')}
                  className={`btn btn-sm ${activeLedgerScenario === 'kulakan' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Kulakan Bahan Baku Pasar
                </button>
                <button
                  onClick={() => setActiveLedgerScenario('listrik')}
                  className={`btn btn-sm ${activeLedgerScenario === 'listrik' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  Operasional Token Listrik
                </button>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '14px 20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                      {ledgerScenarios[activeLedgerScenario].title}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '10px' }}>
                      {ledgerScenarios[activeLedgerScenario].date}
                    </span>
                  </div>

                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                    Double-Entry Seimbang 100%
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px 18px', fontWeight: 600 }}>Kode Akun (COA)</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600 }}>Nama Rekening Akuntansi</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Debet (Rp)</th>
                        <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Kredit (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerScenarios[activeLedgerScenario].entries.map((entry, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: 'var(--cyan-400)', fontWeight: 600 }}>
                            {entry.code}
                          </td>
                          <td style={{ padding: '12px 18px', color: '#ffffff' }}>
                            {entry.name} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({entry.type})</span>
                          </td>
                          <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: entry.debit > 0 ? 700 : 400, color: entry.debit > 0 ? 'var(--emerald-400)' : 'var(--text-muted)' }}>
                            {entry.debit > 0 ? `Rp ${entry.debit.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: entry.credit > 0 ? 700 : 400, color: entry.credit > 0 ? 'var(--cyan-400)' : 'var(--text-muted)' }}>
                            {entry.credit > 0 ? `Rp ${entry.credit.toLocaleString('id-ID')}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{
                  padding: '12px 18px',
                  background: 'rgba(0,0,0,0.2)',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace'
                }}>
                  <span>Integritas Blok Kriptografis: {ledgerScenarios[activeLedgerScenario].hash}</span>
                  <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>Σ Debet ≡ Σ Kredit (Valid)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3 CONTENT: ANTI-LOAN */}
          {activeShowcaseTab === 'loan' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Uji Penawaran Pinjaman Modal Cepat:
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Nominal Pinjaman: Rp {loanPrincipal.toLocaleString('id-ID')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[2000000, 5000000, 10000000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setLoanPrincipal(amt)}
                        className={`btn btn-sm ${loanPrincipal === amt ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontSize: '0.78rem' }}
                      >
                        Rp {(amt / 1000000)} Jt
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Bunga Harian Tertera: {dailyRatePercent}% / Hari
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[0.2, 0.4, 0.8].map(rate => (
                      <button
                        key={rate}
                        onClick={() => setDailyRatePercent(rate)}
                        className={`btn btn-sm ${dailyRatePercent === rate ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontSize: '0.78rem' }}
                      >
                        {rate}% / hr
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Jangka Waktu Tenor: {loanDays} Hari
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[15, 30, 60].map(days => (
                      <button
                        key={days}
                        onClick={() => setLoanDays(days)}
                        className={`btn btn-sm ${loanDays === days ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, fontSize: '0.78rem' }}
                      >
                        {days} Hari
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shocking APR Truth Card */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700, fontSize: '0.92rem' }}>
                    <AlertTriangle size={18} />
                    <span>Hasil Dekonstruksi Suku Bunga Nyata</span>
                  </div>
                  <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>Predator Risk</span>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Bunga Tampak Harian:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                    Hanya {dailyRatePercent}% / hari ({loanDays} hari = Rp {totalLoanInterest.toLocaleString('id-ID')})
                  </div>
                </div>

                <div style={{
                  padding: '14px',
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.25)'
                }}>
                  <div style={{ fontSize: '0.76rem', color: '#fca5a5', fontWeight: 600 }}>
                    Suku Bunga Efektif Tahunan (APR) Sesungguhnya:
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ef4444', lineHeight: 1.1, margin: '4px 0' }}>
                    {effectiveAPR}% <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fca5a5' }}>/ Tahun</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Bandingkan dengan KUR Bank resmi Pemerintah: hanya 6% / tahun.
                  </div>
                </div>

                <div style={{
                  fontSize: '0.76rem',
                  color: 'var(--emerald-400)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={14} />
                  <span>FINA Agent merekomendasikan restrukturisasi arus kas internal.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4 CONTENT: FORENSIK STRUK */}
          {activeShowcaseTab === 'ela' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px' }}>
                  Pilih Sampel Pengujian Forensik Gambar:
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setElaSample('authentic')}
                    className={`btn btn-sm ${elaSample === 'authentic' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}
                  >
                    Nota Kasir Thermal Asli
                  </button>
                  <button
                    onClick={() => setElaSample('tampered')}
                    className={`btn btn-sm ${elaSample === 'tampered' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1 }}
                  >
                    Nota Rekayasa (Tampered)
                  </button>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status Dokumen:</span>
                    <span style={{ fontWeight: 700, color: elaSample === 'authentic' ? 'var(--emerald-400)' : '#f87171' }}>
                      {elaSample === 'authentic' ? 'Terverifikasi Asli' : 'Manipulasi Terdeteksi'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Error Level Analysis (ELA) Residual:</span>
                    <span style={{ fontFamily: 'monospace', color: '#fff' }}>
                      {elaSample === 'authentic' ? '1.8% (Normal)' : '28.4% (Anomali Kompresi)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Font Kerning Thermal Alignment:</span>
                    <span style={{ fontFamily: 'monospace', color: '#fff' }}>
                      {elaSample === 'authentic' ? '99.4% (Matriks Rapat)' : '42.1% (Font Luar / Diedit)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Forensic Result Inspection Card */}
              <div style={{
                background: elaSample === 'authentic' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: elaSample === 'authentic' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(244, 63, 94, 0.35)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {elaSample === 'authentic' ? (
                    <CheckCircle2 size={20} color="var(--emerald-400)" />
                  ) : (
                    <AlertTriangle size={20} color="var(--rose-400)" />
                  )}
                  <span style={{ fontWeight: 700, fontSize: '0.94rem', color: '#fff' }}>
                    {elaSample === 'authentic' 
                      ? 'Lolos Otentikasi Bukti Pengeluaran Kas'
                      : 'Audit Menolak: Indikasi Penggelembungan Angka'}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {elaSample === 'authentic'
                    ? 'Tingkat error kompresi seragam pada seluruh permukaan kertas nota. Karakter angka dicetak oleh head printer thermal yang konsisten dengan tanggal cetak.'
                    : 'Algoritma ELA mendeteksi perbedaan kompresi JPEG tajam pada area nominal Rp 750.000. Grid font tidak konsisten dengan resolusi printer toko.'}
                </p>

                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  fontSize: '0.74rem',
                  color: elaSample === 'authentic' ? 'var(--emerald-400)' : '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <ShieldCheck size={14} />
                  <span>
                    {elaSample === 'authentic'
                      ? 'Siap diposting ke Jurnal Umum SAK EMKM'
                      : 'Diteruskan ke Human Customer Support untuk Verifikasi'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8 Autonomous Pillars Bento Grid */}
      {/* ========================================================================= */}
      <section style={{
        maxWidth: '1200px',
        margin: '20px auto 70px auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Arsitektur Otonom 8 Pilar FINA-ENTERPRISE
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', marginTop: '6px' }}>
            Didukung orkestrasi FinOrchestrator FSM untuk menjamin keamanan kas dan keandalan akuntansi bank-grade.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {/* Card 1: Buku Besar SAK EMKM */}
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            transition: 'all 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={22} color="var(--emerald-400)" />
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>ACID Ledger</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>Buku Besar SAK EMKM Otonom</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Pencatatan jurnal umum double-entry yang terkunci secara kriptografis (SHA-256 Merkle chain). Menjamin debit dan kredit selalu seimbang tanpa selisih.
            </p>
          </div>

          {/* Card 2: Voice-to-Ledger Dialek */}
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            transition: 'all 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic2 size={22} color="var(--cyan-400)" />
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>Whisper STT</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>Voice-to-Ledger Dialek Lokal</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Cukup kirimkan pesan suara WhatsApp dalam dialek Jawa, Sunda, atau bahasa pasar. Whisper STT mengekstrak entitas komoditas dan nominal belanja secara presisi.
            </p>
          </div>

          {/* Card 3: Forensik Struk ELA */}
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            transition: 'all 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} color="var(--rose-400)" />
              </div>
              <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>Anti-Fraud</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>Forensik Struk & Nota ELA</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Deteksi manipulasi nota fisik, rekayasa angka kasir, dan penipuan struk belanja menggunakan algoritma Error Level Analysis (ELA) dan verifikasi font thermal.
            </p>
          </div>

          {/* Card 4: Monte Carlo Runway */}
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            transition: 'all 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={22} color="var(--indigo-400)" />
              </div>
              <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>10.000 Iterasi</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>Simulasi Monte Carlo Runway</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Uji ketahanan kas terhadap skenario fluktuasi harga bahan dan keterlambatan bayar piutang pelanggan untuk mengetahui sisa hari aman kas operasional.
            </p>
          </div>

          {/* Card 5: Anti-Loan Deobfuscator */}
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            transition: 'all 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={22} color="var(--amber-400)" />
              </div>
              <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>APR Real</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>Anti-Loan Deobfuscator</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Bongkar tipuan bunga flat pinjol harian menjadi suku bunga efektif tahunan (APR) nyata untuk mencegah pengusaha terjerat perangkap utang predator.
            </p>
          </div>

          {/* Card 6: Human-in-the-Loop Support Desk */}
          <div className="glass-panel" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            transition: 'all 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Headphones size={22} color="var(--emerald-400)" />
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>24/7 Desk</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>Customer Support & HITL Desk</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Operator manusia profesional siap meninjau transaksi bernilai besar, nota yang buram, atau membantu konsultasi akuntansi secara langsung.
            </p>
          </div>
        </div>
      </section>

      {/* Pre-Footer Action Banner */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 60px auto',
        padding: '0 24px',
        width: '100%'
      }}>
        <div style={{
          padding: '36px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.1) 50%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          boxShadow: '0 15px 40px rgba(0,0,0,0.5)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Siap Mengamankan Finansial & Pembukuan Usaha Anda?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
              Daftarkan usaha Anda dalam 2 menit. Dapatkan buku besar SAK EMKM dan proteksi kas otonom seketika.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigatePage('login')}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.9rem', borderRadius: '12px' }}
            >
              <span>Daftar Usaha Baru</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigatePage('login')}
              className="btn btn-ghost"
              style={{ padding: '12px 24px', fontSize: '0.9rem', borderRadius: '12px' }}
            >
              <span>Masuk Akun</span>
            </button>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '28px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'rgba(5, 8, 17, 0.95)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={15} color="var(--emerald-400)" />
          <span>FINA-ENTERPRISE v2.4 • Platform Keuangan Otonom Skala Enterprise Indonesia</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button 
            onClick={() => onNavigatePage('login')}
            style={{ background: 'none', border: 'none', color: 'var(--emerald-400)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
          >
            Masuk Pengusaha UMKM
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Kepatuhan UU PDP No. 27/2022 & Standar SAK EMKM
          </span>
        </div>
      </footer>
    </div>
  );
};
