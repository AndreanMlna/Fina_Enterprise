import React, { useState, useEffect } from 'react';
import { 
  Mic2, 
  Play, 
  Pause, 
  Sparkles, 
  FileSpreadsheet, 
  Loader2 
} from 'lucide-react';
import { api } from '../../services/api';
import type { VoiceDialectSample } from '../../types';
import { formatCurrency } from '../../utils';

export const VoiceDialectView: React.FC = () => {
  const [dialects, setDialects] = useState<VoiceDialectSample[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceDialectSample | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(75000);
  const [postingResult, setPostingResult] = useState<{
    journal_entry_number: string;
    audit_merkle_hash: string;
    message: string;
    debit_account?: string;
    credit_account?: string;
    amount?: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDialects = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getDialects();
      if (data && data.length > 0) {
        const mapped: VoiceDialectSample[] = data.map(d => ({
          id: d.id,
          dialect: (d.dialect as any) || 'JAWA',
          audioTitle: `Rekaman Suara Dialek ${d.dialect}`,
          rawSpeechText: d.sample_sentence || d.raw_term,
          detectedEntities: {
            action: (d.action_type as any) || 'BELI',
            item: d.canonical_term,
            quantity: '1 Transaksi Terverifikasi',
            amount: 75000
          },
          journalPreview: {
            debit: `${d.target_coa_code} - ${d.canonical_term}`,
            credit: '1101 - Kas Tunai Kasir Warung',
            amount: 75000
          }
        }));
        setDialects(mapped);
        setSelectedVoice(mapped[0]);
      } else {
        setDialects([]);
        setSelectedVoice(null);
      }
    } catch (err: any) {
      console.error("[VoiceDialectView] Gagal mengambil leksikon dialek:", err);
      setErrorMessage(err?.response?.data?.detail || err?.message || "Gagal memuat leksikon dialek dari server.");
      setDialects([]);
      setSelectedVoice(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDialects();
  }, []);

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };

  const handlePostToLedger = async () => {
    if (!selectedVoice) return;
    setIsPosting(true);
    setErrorMessage(null);
    try {
      const coaCode = selectedVoice.journalPreview.debit.split(' - ')[0]?.trim() || '1104';
      const res = await api.postDialectJournal({
        raw_speech_text: selectedVoice.rawSpeechText,
        dialect: selectedVoice.dialect,
        action_type: selectedVoice.detectedEntities.action,
        canonical_term: selectedVoice.detectedEntities.item,
        target_coa_code: coaCode,
        amount: customAmount > 0 ? customAmount : 75000
      });
      setPostingResult({
        journal_entry_number: res.journal_entry_number,
        audit_merkle_hash: res.audit_merkle_hash,
        message: res.message,
        amount: customAmount > 0 ? customAmount : 75000
      });
    } catch (err: any) {
      console.error("[VoiceDialectView] Gagal membukukan transaksi dialek:", err);
      setErrorMessage(err?.message || "Gagal membukukan transaksi dialek ke buku besar SAK EMKM.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Voice-to-Ledger Dialect Console</h2>
          <span className="badge badge-indigo">Whisper STT Fine-Tuned</span>
          {isLoading && <Loader2 size={16} className="animate-spin" color="var(--indigo-400)" />}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Mengonversi pesan suara WhatsApp pedagang informal dalam dialek lokal (Jawa, Sunda, & Bahasa Indonesia pasar) menjadi jurnal akuntansi debit/kredit seimbang.
        </p>
      </div>

      {/* Dialect Selector Bar */}
      {isLoading ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--indigo-400)' }} />
          <span>Menghubungkan ke Kamus Leksikon PostgreSQL...</span>
        </div>
      ) : errorMessage ? (
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <p style={{ color: 'var(--rose-400)', fontSize: '0.88rem', margin: '0 0 10px 0' }}>{errorMessage}</p>
          <button className="btn btn-sm btn-primary" onClick={fetchDialects}>Muat Ulang Leksikon</button>
        </div>
      ) : dialects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Belum ada leksikon dialek yang tersimpan di basis data PostgreSQL.
          </p>
        </div>
      ) : (
        <>
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Pilih Leksikon Dialek Terverifikasi:
            </span>
            {dialects.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVoice(v);
                  setIsPlaying(false);
                  setPostingResult(null);
                }}
                className={`btn btn-sm ${selectedVoice?.id === v.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Mic2 size={13} />
                <span>
                  {v.dialect === 'JAWA' ? `Dialek Jawa (${v.detectedEntities.item})` : 
                   v.dialect === 'SUNDA' ? `Dialek Sunda (${v.detectedEntities.item})` : 
                   v.dialect === 'MADURA' ? `Dialek Madura (${v.detectedEntities.item})` :
                   `Indonesia Pasar (${v.detectedEntities.item})`}
                </span>
              </button>
            ))}
          </div>

          {selectedVoice && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
              {/* Left: Audio Wave & Transcription */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                    Pemutar Audio & Transkrip Whisper
                  </h3>
                  <span className="badge badge-emerald">Noise Filter: Active</span>
                </div>

                {/* Audio Player Simulated Box */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <button 
                    onClick={handlePlayToggle}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: isPlaying ? 'var(--rose-500)' : 'var(--emerald-500)',
                      color: '#000000',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px var(--emerald-glow)'
                    }}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                      {selectedVoice.audioTitle}
                    </div>
                    {/* Simulated Audio Waveform */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
                      {[40, 65, 80, 50, 90, 100, 75, 45, 85, 95, 60, 40, 80, 100, 70, 55, 30, 85, 95, 60, 40, 75, 90, 60, 35].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: isPlaying ? `${h}%` : `${h * 0.4}%`,
                            animation: isPlaying ? 'audioWaveEqualizer 0.7s ease-in-out infinite alternate' : 'none',
                            animationDelay: `${(i * 0.05) % 0.6}s`,
                            background: isPlaying ? 'var(--emerald-400)' : 'var(--text-muted)',
                            borderRadius: '2px',
                            transition: 'background-color 0.2s ease, height 0.2s ease'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Raw Speech Transcription Box */}
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Hasil Transkripsi Akustik Suara:
                  </span>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    fontSize: '0.82rem',
                    color: '#ffffff',
                    lineHeight: 1.5,
                    fontStyle: 'italic'
                  }}>
                    "{selectedVoice.rawSpeechText}"
                  </div>
                </div>
              </div>

              {/* Right: Entity Extraction & Journal Entry Preview */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                    Ekstraksi Entitas & Pemetaan COA
                  </h3>
                  <span className="badge badge-cyan">Deterministic Mapper</span>
                </div>

                {/* Entity Grid & Dynamic Amount Controller */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tindakan (Action)</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--emerald-400)', marginTop: '2px' }}>
                      {selectedVoice.detectedEntities.action}
                    </div>
                  </div>

                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nominal Transaksi (Dapat Disesuaikan)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rp</span>
                      <input 
                        type="number"
                        min="1000"
                        step="5000"
                        value={customAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomAmount(val);
                          setPostingResult(null);
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          color: '#ffffff',
                          padding: '4px 8px',
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 700
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Barang & Estimasi Qty</span>
                      {/* Quick preset chips */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[25000, 50000, 75000, 150000, 300000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setCustomAmount(val);
                              setPostingResult(null);
                            }}
                            style={{
                              background: customAmount === val ? 'var(--indigo-600)' : 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#e2e8f0',
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {(val / 1000)}k
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff', marginTop: '4px' }}>
                      {selectedVoice.detectedEntities.item} ({selectedVoice.detectedEntities.quantity})
                    </div>
                  </div>
                </div>

                {/* Double-Entry Journal Preview Card */}
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--cyan-500)' }}>
                    <FileSpreadsheet size={15} />
                    <span>Draf Jurnal Otomatis Berpasangan (SAK EMKM):</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--emerald-400)' }}>[DEBET] {selectedVoice.journalPreview.debit}</span>
                    <span className="mono" style={{ color: '#ffffff', fontWeight: 700 }}>
                      {formatCurrency(customAmount)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--cyan-500)' }}>[KREDIT] {selectedVoice.journalPreview.credit}</span>
                    <span className="mono" style={{ color: '#ffffff', fontWeight: 700 }}>
                      {formatCurrency(customAmount)}
                    </span>
                  </div>
                </div>

                {/* Feedback Card if Posted */}
                {postingResult && (
                  <div style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                        Berhasil Dibukukan ke PostgreSQL
                      </span>
                      <span className="mono" style={{ fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 700 }}>
                        {postingResult.journal_entry_number}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {postingResult.message}
                    </div>
                    <div className="mono" style={{ fontSize: '0.64rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginTop: '2px' }}>
                      Audit Hash: {postingResult.audit_merkle_hash}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  {postingResult ? (
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => setPostingResult(null)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      Reset / Transaksi Baru
                    </button>
                  ) : <span />}

                  <button 
                    className="btn btn-primary"
                    onClick={handlePostToLedger}
                    disabled={isPosting || customAmount <= 0}
                  >
                    {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>{isPosting ? 'Menyimpan ke Buku Besar...' : 'Konfirmasi & Bukukan Jurnal'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
