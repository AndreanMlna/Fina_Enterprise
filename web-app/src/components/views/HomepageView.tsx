import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Bot, 
  Database, 
  Headphones, 
  Sparkles, 
  TrendingUp, 
  FileCheck2, 
  FileSpreadsheet, 
  Coins, 
  Mic2, 
  Cpu
} from 'lucide-react';
import type { AppPage } from '../../types';

interface HomepageViewProps {
  onNavigatePage: (page: AppPage) => void;
}


export const HomepageView: React.FC<HomepageViewProps> = ({ onNavigatePage }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0c1527 0%, #05070f 70%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Top Navbar */}
      <nav style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px var(--emerald-glow)'
          }}>
            <ShieldCheck size={24} color="#021a10" strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              FINA<span style={{ color: 'var(--emerald-400)' }}>-ENTERPRISE</span>
            </span>
            <span className="badge badge-emerald" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>
              FINTECH AI
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onNavigatePage('portal_umkm')}
            style={{ fontSize: '0.82rem', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Bot size={15} color="var(--emerald-400)" />
            <span>Coba Demo Dashboard</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => onNavigatePage('login')}
            style={{ fontSize: '0.82rem', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
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
        padding: '80px 24px 60px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Compliance Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '0.78rem',
          color: 'var(--emerald-400)'
        }}>
          <Sparkles size={14} />
          <span>FinOrchestrator FSM • Standar Akuntansi SAK EMKM • Terlindungi UU PDP No. 27/2022</span>
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: '3.4rem',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.15,
          maxWidth: '960px',
          margin: 0
        }}>
          Sistem <span style={{
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Agentic AI Keuangan Otonom</span> untuk Ketahanan Usaha Anda.
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary)',
          maxWidth: '780px',
          lineHeight: 1.6,
          margin: 0
        }}>
          Bebaskan usaha Anda dari keruwetan pembukuan. Ubah nota fisik dan pesan suara dialek pasar menjadi pembukuan SAK EMKM seimbang secara instan, periksa bunga pinjol mencekik, dan proyeksikan kas 90 hari ke depan dengan pendampingan Customer Support manusia 24/7.
        </p>

        {/* Hero CTA Group */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => onNavigatePage('login')}
            style={{ fontSize: '1rem', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <span>Mulai Kelola Finansial Usaha</span>
            <ArrowRight size={18} />
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onNavigatePage('portal_umkm')}
            style={{ fontSize: '1rem', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Bot size={18} color="var(--emerald-400)" />
            <span>Eksplorasi Demo Dashboard</span>
          </button>
        </div>

        {/* Micro Telemetry Badges */}
        <div style={{
          display: 'flex',
          gap: '32px',
          marginTop: '40px',
          padding: '16px 32px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-subtle)',
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
            <span>Human-in-the-Loop Customer Support</span>
          </div>
        </div>
      </section>

      {/* 8 Autonomous Pillars Bento Grid */}
      <section style={{
        maxWidth: '1200px',
        margin: '40px auto 80px auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff' }}>
            Arsitektur Otonom 8 Pilar FINA-ENTERPRISE
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
            Didukung orkestrasi FinOrchestrator FSM untuk menjamin keamanan kas dan keandalan akuntansi bank-grade.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {/* Card 1: Buku Besar SAK EMKM */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={22} color="var(--emerald-400)" />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Buku Besar SAK EMKM Otonom</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Pencatatan jurnal umum double-entry yang terkunci secara kriptografis (SHA-256 Merkle chain). Menjamin debit dan kredit selalu seimbang tanpa selisih.
            </p>
          </div>

          {/* Card 2: Voice-to-Ledger Dialek */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic2 size={22} color="var(--cyan-400)" />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Voice-to-Ledger Dialek Lokal</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Cukup kirimkan pesan suara WhatsApp dalam dialek Jawa, Sunda, atau bahasa pasar. Whisper STT mengekstrak entitas komoditas dan nominal belanja secara presisi.
            </p>
          </div>

          {/* Card 3: Forensik Struk ELA */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} color="var(--rose-400)" />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Forensik Struk & Nota ELA</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Deteksi manipulasi nota fisik, rekayasa angka kasir, dan penipuan struk belanja menggunakan algoritma Error Level Analysis (ELA) dan verifikasi font thermal.
            </p>
          </div>

          {/* Card 4: Monte Carlo Runway */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} color="var(--indigo-400)" />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Simulasi Monte Carlo 10.000 Iterasi</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Uji ketahanan kas terhadap skenario inflasi cabai/bawang dan keterlambatan bayar piutang pelanggan untuk mengetahui sisa hari aman (cash runway).
            </p>
          </div>

          {/* Card 5: Anti-Loan Deobfuscator */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={22} color="var(--amber-400)" />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Anti-Loan Deobfuscator</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Bongkar tipuan bunga flat pinjol harian menjadi suku bunga efektif tahunan (APR) nyata untuk mencegah pengusaha terjerat perangkap utang predator.
            </p>
          </div>

          {/* Card 6: Human-in-the-Loop Support Desk */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Headphones size={22} color="var(--emerald-400)" />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Customer Support & HITL Desk</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Operator manusia profesional siap meninjau transaksi bernilai besar, nota yang buram, atau membantu konsultasi akuntansi secara langsung.
            </p>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        padding: '30px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
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
