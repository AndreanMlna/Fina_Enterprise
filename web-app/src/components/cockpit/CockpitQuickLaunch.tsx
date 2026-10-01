import React from 'react';
import { Bot } from 'lucide-react';
import type { NavigationTab } from '../../types';

interface CockpitQuickLaunchProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const CockpitQuickLaunch: React.FC<CockpitQuickLaunchProps> = ({ onNavigate }) => {
  return (
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
  );
};
