import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface SuspenseLoaderProps {
  message?: string;
}

export const SuspenseLoader: React.FC<SuspenseLoaderProps> = ({ 
  message = 'Memuat modul cerdas...' 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '360px',
      width: '100%',
      gap: '14px',
      padding: '40px 20px'
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.12))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 0 24px rgba(16, 185, 129, 0.2)'
      }}>
        <Loader2 
          size={32} 
          className="animate-spin" 
          style={{ color: 'var(--emerald-400)' }} 
        />
        <Sparkles 
          size={14} 
          style={{ 
            position: 'absolute', 
            top: '8px', 
            right: '8px', 
            color: 'var(--cyan-400)'
          }} 
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.92rem',
          margin: '0 0 4px 0',
          letterSpacing: '-0.01em'
        }}>
          {message}
        </p>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)'
        }}>
          FINA-ENTERPRISE v2.4 PROD • Lazy Module Ingestion
        </span>
      </div>
    </div>
  );
};
