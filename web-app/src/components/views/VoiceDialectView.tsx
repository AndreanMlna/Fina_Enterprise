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
import { sampleVoiceDialects } from '../../data/mockData';

export const VoiceDialectView: React.FC = () => {
  const [dialects, setDialects] = useState<VoiceDialectSample[]>(sampleVoiceDialects);
  const [selectedVoice, setSelectedVoice] = useState<VoiceDialectSample>(sampleVoiceDialects[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDialects = async () => {
      setIsLoading(true);
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
              quantity: '1 Unit / Transaksi',
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
          setDialects(sampleVoiceDialects);
          setSelectedVoice(sampleVoiceDialects[0]);
        }
      } catch {
        setDialects(sampleVoiceDialects);
        setSelectedVoice(sampleVoiceDialects[0]);
      }
      setIsLoading(false);
    };
    fetchDialects();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };

  const handlePostToLedger = () => {
    setIsPosted(true);
    setTimeout(() => setIsPosted(false), 2000);
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
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Pilih Sampel Audio Dialek:
        </span>
        {dialects.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              setSelectedVoice(v);
              setIsPlaying(false);
              setIsPosted(false);
            }}
            className={`btn btn-sm ${selectedVoice?.id === v.id ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Mic2 size={13} />
            <span>{v.dialect === 'JAWA' ? 'Dialek Jawa (Brambang/Lombok)' : v.dialect === 'SUNDA' ? 'Dialek Sunda (Endog Hayam)' : 'Indonesia Pasar (Katering)'}</span>
          </button>
        ))}
      </div>

      {/* Main Dialect Processing Grid */}
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

          {/* Entity Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tindakan (Action)</span>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--emerald-400)', marginTop: '2px' }}>
                {selectedVoice.detectedEntities.action}
              </div>
            </div>

            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nominal Uang Terdeteksi</span>
              <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                {formatCurrency(selectedVoice.detectedEntities.amount)}
              </div>
            </div>

            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Barang & Jumlah</span>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
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
              <span>Draf Jurnal Otomatis yang Akan Dibukukan:</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--emerald-400)' }}>[DEBET] {selectedVoice.journalPreview.debit}</span>
              <span className="mono" style={{ color: '#ffffff', fontWeight: 700 }}>
                {formatCurrency(selectedVoice.journalPreview.amount)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--cyan-500)' }}>[KREDIT] {selectedVoice.journalPreview.credit}</span>
              <span className="mono" style={{ color: '#ffffff', fontWeight: 700 }}>
                {formatCurrency(selectedVoice.journalPreview.amount)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
            <button 
              className="btn btn-primary"
              onClick={handlePostToLedger}
              disabled={isPosted}
            >
              <Sparkles size={16} />
              <span>{isPosted ? 'Berhasil Dibukukan ke Buku Besar!' : 'Konfirmasi & Bukukan Jurnal'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
