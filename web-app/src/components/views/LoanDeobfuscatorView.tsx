import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Calculator,
  Scale
} from 'lucide-react';
import type { PredatoryLoanAnalysis } from '../../types';

export const LoanDeobfuscatorView: React.FC = () => {
  const [loanOffer, setLoanOffer] = useState({
    name: 'Pinjaman Modal Cepat Kilat 24 Jam',
    requestedAmount: 10000000, // 10 juta
    adminFeePercent: 30, // 30% potong di awal
    dailyInterestRate: 0.4, // 0.4% per hari
    tenorDays: 30 // 30 hari
  });

  const analysis: PredatoryLoanAnalysis = useMemo(() => {
    const upfront = (loanOffer.requestedAmount * loanOffer.adminFeePercent) / 100;
    const disbursed = loanOffer.requestedAmount - upfront;
    const totalInterest = loanOffer.requestedAmount * (loanOffer.dailyInterestRate / 100) * loanOffer.tenorDays;
    const totalRepayment = loanOffer.requestedAmount + totalInterest;
    const totalCostOfBorrowing = totalRepayment - disbursed;

    // Real Annual APR calculation
    const effectiveAPR = ((totalCostOfBorrowing / disbursed) / loanOffer.tenorDays) * 365 * 100;

    const isPredatory = effectiveAPR > 50 || loanOffer.adminFeePercent > 10;

    return {
      requestedAmount: loanOffer.requestedAmount,
      adminFeePercent: loanOffer.adminFeePercent,
      upfrontDeduction: upfront,
      disbursedAmount: disbursed,
      dailyInterestRate: loanOffer.dailyInterestRate,
      tenorDays: loanOffer.tenorDays,
      totalRepayment,
      effectiveAnnualAPR: Math.round(effectiveAPR * 10) / 10,
      isLegalOJK: !isPredatory,
      threatLevel: effectiveAPR > 150 ? 'PREDATORY_EXTREME' : effectiveAPR > 50 ? 'MODERATE' : 'SAFE',
      ojkStatusText: isPredatory 
        ? 'TIDAK TERDAFTAR DI OJK (Indikasi Entitas Ilegal Satgas PASTI)' 
        : 'Sesuai Batas Maksimum Bunga Fintech OJK (Maks 0.3%/hari)',
      alternativeSuggestion: 'Gunakan fasilitas KUR (Kredit Usaha Rakyat) Bank Himbara (BRI/Mandiri/BNI) dengan subsidi bunga 6% efektif TAHUNAN.'
    };
  }, [loanOffer]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Anti-Predatory Loan Deobfuscator</h2>
          <span className="badge badge-rose">
            <ShieldAlert size={12} /> Real APR Calculation Engine
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Membongkar skema biaya tersembunyi pinjaman digital & rentenir siber. Mengonversi klaim "bunga ringan per hari" menjadi persentase APR Efektif Riil Tahunan.
        </p>
      </div>

      {/* Main Analysis Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.5fr', gap: '20px' }}>
        {/* Left: Interactive Input Form */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Calculator size={18} color="var(--rose-500)" />
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Data Penawaran Pinjaman</h3>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Entitas / Aplikasi Penawar:
            </label>
            <input 
              type="text"
              value={loanOffer.name}
              onChange={(e) => setLoanOffer({ ...loanOffer, name: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-medium)',
                color: '#ffffff',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Nominal Pengajuan Pinjaman (Plafon):</span>
              <span className="mono" style={{ color: '#ffffff', fontWeight: 700 }}>
                {formatCurrency(loanOffer.requestedAmount)}
              </span>
            </div>
            <input 
              type="range"
              min="1000000"
              max="50000000"
              step="500000"
              value={loanOffer.requestedAmount}
              onChange={(e) => setLoanOffer({ ...loanOffer, requestedAmount: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--emerald-400)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Potongan Biaya Admin di Awal:</span>
              <span className="mono" style={{ color: 'var(--rose-500)', fontWeight: 700 }}>
                {loanOffer.adminFeePercent}% ({formatCurrency(analysis.upfrontDeduction)})
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="45"
              step="1"
              value={loanOffer.adminFeePercent}
              onChange={(e) => setLoanOffer({ ...loanOffer, adminFeePercent: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--rose-500)' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              *Praktik umum pinjol ilegal memotong 20% - 40% langsung di muka.
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Klaim Bunga Harian:</span>
              <span className="mono" style={{ color: 'var(--amber-500)', fontWeight: 700 }}>
                {loanOffer.dailyInterestRate}% / hari
              </span>
            </div>
            <input 
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={loanOffer.dailyInterestRate}
              onChange={(e) => setLoanOffer({ ...loanOffer, dailyInterestRate: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--amber-500)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Jangka Waktu (Tenor):</span>
              <span className="mono" style={{ color: 'var(--cyan-500)', fontWeight: 700 }}>
                {loanOffer.tenorDays} Hari
              </span>
            </div>
            <input 
              type="range"
              min="7"
              max="90"
              step="1"
              value={loanOffer.tenorDays}
              onChange={(e) => setLoanOffer({ ...loanOffer, tenorDays: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--cyan-500)' }}
            />
          </div>
        </div>

        {/* Right: Deobfuscated Real Financial Reality */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          borderColor: analysis.threatLevel === 'PREDATORY_EXTREME' ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)'
        }}>
          {/* Top Threat Banner */}
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: analysis.threatLevel === 'PREDATORY_EXTREME' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${analysis.threatLevel === 'PREDATORY_EXTREME' ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertTriangle size={26} color={analysis.threatLevel === 'PREDATORY_EXTREME' ? 'var(--rose-500)' : 'var(--emerald-400)'} />
            <div>
              <div style={{ 
                fontSize: '0.95rem', 
                fontWeight: 700, 
                color: analysis.threatLevel === 'PREDATORY_EXTREME' ? 'var(--rose-500)' : 'var(--emerald-400)' 
              }}>
                {analysis.threatLevel === 'PREDATORY_EXTREME' 
                  ? 'BAHAYA EKSTREM: JEBAKAN UTANG PREDATORIS' 
                  : 'STATUS PINJAMAN MODERAT'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {analysis.ojkStatusText}
              </div>
            </div>
          </div>

          {/* Shocking Reality Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {/* Real APR */}
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Bunga Efektif Riil Tahunan (REAL APR):
              </span>
              <div className="mono" style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--rose-500)', marginTop: '4px' }}>
                {analysis.effectiveAnnualAPR}% <span style={{ fontSize: '0.9rem' }}>/ TAHUN</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                *Bandingkan dengan KUR Bank BRI: Hanya 6% / Tahun!
              </span>
            </div>

            {/* Dana Cair vs Wajib Bayar */}
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dana Bersih yang Masuk Rekening:</span>
                <span className="mono" style={{ color: 'var(--emerald-400)', fontWeight: 700 }}>
                  {formatCurrency(analysis.disbursedAmount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total yang Harus Dilunasi:</span>
                <span className="mono" style={{ color: 'var(--rose-500)', fontWeight: 700 }}>
                  {formatCurrency(analysis.totalRepayment)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff' }}>Biaya Bunga & Admin Riil:</span>
                <span className="mono" style={{ color: 'var(--amber-500)', fontWeight: 700 }}>
                  {formatCurrency(analysis.totalRepayment - analysis.disbursedAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Alternative Smart Advisory */}
          <div style={{ 
            padding: '16px', 
            borderRadius: 'var(--radius-md)', 
            background: 'rgba(6, 182, 212, 0.08)', 
            border: '1px solid rgba(6, 182, 212, 0.25)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Scale size={16} color="var(--cyan-500)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan-500)' }}>
                Rekomendasi Alternatif FINA-ENTERPRISE:
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {analysis.alternativeSuggestion} Gunakan laporan keuangan SAK EMKM yang dihasilkan FINA untuk mengajukan pinjaman resmi ke bank Himbara tanpa agunan berlebih.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
