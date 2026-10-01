import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, 
  Calculator,
  Scale,
  Save,
  Trash2,
  CheckCircle,
  History,
  Loader2
} from 'lucide-react';
import type { PredatoryLoanAnalysis, LoanEvaluationRecord, CreateLoanEvaluationPayload } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';

export const LoanDeobfuscatorView: React.FC = () => {
  const [loanOffer, setLoanOffer] = useState({
    name: 'Pinjaman Modal Cepat Kilat 24 Jam',
    requestedAmount: 10000000,
    adminFeePercent: 30,
    dailyInterestRate: 0.4,
    tenorDays: 30
  });

  const [savedEvaluations, setSavedEvaluations] = useState<LoanEvaluationRecord[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fetchSavedLoans = async () => {
    setIsLoadingSaved(true);
    try {
      const data = await api.getLoanEvaluations();
      setSavedEvaluations(data);
    } catch (err) {
      console.warn('[LoanDeobfuscatorView] Gagal mengambil riwayat pinjaman:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  useEffect(() => {
    fetchSavedLoans();
  }, []);

  const analysis: PredatoryLoanAnalysis = useMemo(() => {
    const upfront = (loanOffer.requestedAmount * loanOffer.adminFeePercent) / 100;
    const disbursed = Math.max(1, loanOffer.requestedAmount - upfront);
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
        ? 'TIDAK SESUAI REGULASI OJK (Indikasi Bunga Predatori / Biaya Terselubung)' 
        : 'Sesuai Batas Maksimum Bunga Fintech OJK (Maks 0.3%/hari)',
      alternativeSuggestion: 'Gunakan fasilitas KUR (Kredit Usaha Rakyat) Bank Himbara (BRI/Mandiri/BNI) dengan subsidi bunga 6% efektif TAHUNAN.'
    };
  }, [loanOffer]);

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      const payload: CreateLoanEvaluationPayload = {
        provider_name: loanOffer.name,
        requested_amount: loanOffer.requestedAmount,
        admin_fee_percent: loanOffer.adminFeePercent,
        daily_interest_rate: loanOffer.dailyInterestRate,
        tenor_days: loanOffer.tenorDays,
        notes: `Uji APR Riil: ${analysis.effectiveAnnualAPR}% | Legalitas OJK: ${analysis.isLegalOJK ? 'LOLOS' : 'WASPADA'}`
      };
      await api.saveLoanEvaluation(payload);
      setSaveSuccessMsg('Hasil uji pinjaman berhasil disimpan ke PostgreSQL!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      await fetchSavedLoans();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan evaluasi pinjaman.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvaluation = async (id: string, name: string) => {
    if (!window.confirm(`Hapus riwayat evaluasi pinjaman '${name}'?`)) return;
    try {
      await api.deleteLoanEvaluation(id);
      await fetchSavedLoans();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus evaluasi.');
    }
  };

  const handleLoadSavedIntoCalculator = (record: LoanEvaluationRecord) => {
    setLoanOffer({
      name: record.provider_name,
      requestedAmount: record.requested_amount,
      adminFeePercent: record.admin_fee_percent,
      dailyInterestRate: record.daily_interest_rate,
      tenorDays: record.tenor_days
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Kalkulator Anti-Rentenir</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Hitung suku bunga riil tahunan (APR) dan periksa biaya tersembunyi pada penawaran pinjaman usaha.
        </p>
      </div>

      {saveSuccessMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--emerald-400)',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Nominal Pengajuan:</label>
              <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--emerald-400)' }}>
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
              style={{ width: '100%', accentColor: 'var(--emerald-500)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Biaya Admin Dipotong di Depan (%):</label>
              <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: loanOffer.adminFeePercent > 10 ? 'var(--rose-400)' : '#ffffff' }}>
                {loanOffer.adminFeePercent}%
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="50"
              step="1"
              value={loanOffer.adminFeePercent}
              onChange={(e) => setLoanOffer({ ...loanOffer, adminFeePercent: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--rose-500)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Klaim Bunga Harian (%/hari):</label>
              <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: loanOffer.dailyInterestRate > 0.3 ? 'var(--rose-400)' : '#ffffff' }}>
                {loanOffer.dailyInterestRate}% per hari
              </span>
            </div>
            <input 
              type="range"
              min="0.05"
              max="1.5"
              step="0.05"
              value={loanOffer.dailyInterestRate}
              onChange={(e) => setLoanOffer({ ...loanOffer, dailyInterestRate: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--rose-500)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Tenor Pinjaman (Hari):</label>
              <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
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
              style={{ width: '100%', accentColor: 'var(--indigo-500)' }}
            />
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}
          >
            <Save size={15} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Hasil Evaluasi'}</span>
          </button>
        </div>

        {/* Right: Deobfuscation Results Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
              Analisis Biaya Riil Pinjaman
            </h3>
            <span className={`badge ${analysis.threatLevel === 'PREDATORY_EXTREME' ? 'badge-rose' : analysis.threatLevel === 'MODERATE' ? 'badge-amber' : 'badge-emerald'}`}>
              {analysis.threatLevel === 'PREDATORY_EXTREME' ? 'BAHAYA PREDATORI TINGGI' : analysis.threatLevel === 'MODERATE' ? 'WASPADA BIAYA TINGGI' : 'BUNGA AMAN'}
            </span>
          </div>

          {/* APR Callout Banner */}
          <div style={{
            background: analysis.isLegalOJK ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${analysis.isLegalOJK ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Bunga Riil Efektif Tahunan (Real Annual APR):
              </div>
              <div className="mono" style={{ fontSize: '2.2rem', fontWeight: 800, color: analysis.isLegalOJK ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
                {analysis.effectiveAnnualAPR}% <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>/ tahun</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Klaim Awal Aplikasi:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                {loanOffer.dailyInterestRate}%/hari
              </div>
            </div>
          </div>

          {/* Breakdown Numbers Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Potongan Admin di Awal:</div>
              <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--rose-400)' }}>
                -{formatCurrency(analysis.upfrontDeduction)}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Uang Diterima Bersih:</div>
              <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                {formatCurrency(analysis.disbursedAmount)}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total Pengembalian:</div>
              <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                {formatCurrency(analysis.totalRepayment)}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total Biaya Bunga & Admin:</div>
              <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--amber-400)' }}>
                {formatCurrency(analysis.totalRepayment - analysis.disbursedAmount)}
              </div>
            </div>
          </div>

          {/* OJK Legal status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={18} color={analysis.isLegalOJK ? 'var(--emerald-400)' : 'var(--rose-400)'} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#ffffff' }}>Status Regulasi Otoritas Jasa Keuangan:</strong>
              <p style={{ margin: '4px 0 0 0', lineHeight: 1.4 }}>{analysis.ojkStatusText}</p>
            </div>
          </div>

          {/* Recommendation */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(99, 102, 241, 0.08)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <Scale size={18} color="var(--indigo-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#ffffff' }}>Rekomendasi Solusi Bankable KUR:</strong>
              <p style={{ margin: '4px 0 0 0', lineHeight: 1.4 }}>{analysis.alternativeSuggestion}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Saved Evaluations History in Database */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--emerald-400)" />
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: 0 }}>
              Riwayat Evaluasi Pinjaman
            </h3>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {savedEvaluations.length} Riwayat Tersimpan
          </span>
        </div>

        {isLoadingSaved ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <span>Memuat riwayat evaluasi dari basis data...</span>
          </div>
        ) : savedEvaluations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>Belum ada hasil uji pinjaman yang disimpan oleh tenant Anda.</p>
          </div>
        ) : (
          <div className="table-scroll-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead className="sticky-table-header">
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Entitas Pinjaman</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Pengajuan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Diterima Bersih</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Bunga Riil (APR)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status OJK</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {savedEvaluations.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{ev.provider_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {ev.tenor_days} Hari • Admin {ev.admin_fee_percent}% • Bunga {ev.daily_interest_rate}%/hari
                      </div>
                    </td>
                    <td className="mono" style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>
                      {formatCurrency(ev.requested_amount)}
                    </td>
                    <td className="mono" style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--emerald-400)' }}>
                      {formatCurrency(ev.disbursed_amount)}
                    </td>
                    <td className="mono" style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: ev.effective_annual_apr > 110 ? 'var(--rose-400)' : 'var(--emerald-400)' }}>
                      {ev.effective_annual_apr}%
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span className={`badge ${ev.is_legal_ojk ? 'badge-emerald' : 'badge-rose'}`}>
                        {ev.is_legal_ojk ? 'LEGAL OJK' : 'WASPADA PREDATORI'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleLoadSavedIntoCalculator(ev)}
                          title="Buka kembali di kalkulator"
                        >
                          Muat Uji
                        </button>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => handleDeleteEvaluation(ev.id, ev.provider_name)}
                          title="Hapus riwayat ini"
                          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--rose-400)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
