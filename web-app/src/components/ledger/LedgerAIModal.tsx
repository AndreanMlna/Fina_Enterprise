import React from 'react';
import { Sparkles } from 'lucide-react';

interface LedgerAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawPrompt: string;
  onPromptChange: (val: string) => void;
  onSubmit: () => void;
  isSimulating: boolean;
}

export const LedgerAIModal: React.FC<LedgerAIModalProps> = ({
  isOpen,
  onClose,
  rawPrompt,
  onPromptChange,
  onSubmit,
  isSimulating
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="homies-card" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '26px',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="var(--mint-neon)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              Input Jurnal Double-Entry AI
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="homies-icon-btn"
            style={{ width: '28px', height: '28px' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '14px' }}>
          Ketik transaksi keuangan dalam bahasa sehari-hari. FinOrchestrator AI akan secara otomatis memetakan ke akun Debet dan Kredit berpasangan (Double-Entry Balancing).
        </p>

        <textarea
          value={rawPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '12px',
            color: '#FFFFFF',
            fontSize: '0.82rem',
            outline: 'none',
            resize: 'none',
            marginBottom: '16px'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            className="homies-pill-btn"
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            disabled={isSimulating}
            className="homies-pill-btn active"
          >
            {isSimulating ? 'Memvalidasi SAK EMKM...' : 'Jurnal Otomatis'}
          </button>
        </div>
      </div>
    </div>
  );
};
