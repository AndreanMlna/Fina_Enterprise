import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorMsg = (error?.message || error?.toString() || '').toLowerCase();
    const isChunkError =
      errorMsg.includes('failed to fetch dynamically imported module') ||
      errorMsg.includes('strict mime type checking') ||
      errorMsg.includes('text/html') ||
      errorMsg.includes('importing a module script failed') ||
      errorMsg.includes('loading chunk') ||
      error?.name === 'ChunkLoadError';

    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[FINA ErrorBoundary] Runtime rendering fault caught:', error, errorInfo);

    // Jika terjadi kegagalan modul script karena rilis versi baru di Vercel, lakukan reload otomatis 1 kali
    const errorMsg = (error?.message || error?.toString() || '').toLowerCase();
    const isChunkError =
      errorMsg.includes('failed to fetch dynamically imported module') ||
      errorMsg.includes('strict mime type checking') ||
      errorMsg.includes('text/html') ||
      errorMsg.includes('importing a module script failed') ||
      errorMsg.includes('loading chunk');

    if (isChunkError) {
      const storageKey = 'fina_eb_chunk_reload';
      const hasReloaded = sessionStorage.getItem(storageKey);
      if (!hasReloaded) {
        sessionStorage.setItem(storageKey, 'true');
        console.info('[FINA ErrorBoundary] Auto-reloading page to sync newly deployed assets...');
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    }
  }

  handleRetry = () => {
    if (this.state.isChunkError) {
      // Hard refresh untuk mengambil asset bundle hash terbaru dari server
      window.location.reload();
      return;
    }

    this.setState({ hasError: false, error: null, isChunkError: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const { isChunkError } = this.state;

      return (
        <div className="glass-panel" style={{
          padding: '36px 24px',
          margin: '20px auto',
          maxWidth: '560px',
          textAlign: 'center',
          borderColor: isChunkError ? 'rgba(0, 223, 143, 0.4)' : 'rgba(239, 68, 68, 0.4)',
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: isChunkError ? '0 10px 30px rgba(0, 223, 143, 0.1)' : undefined
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: isChunkError ? 'rgba(0, 223, 143, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            border: isChunkError ? '1px solid rgba(0, 223, 143, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {isChunkError ? (
              <Sparkles size={26} color="var(--mint-neon)" />
            ) : (
              <AlertTriangle size={26} color="var(--rose-400)" />
            )}
          </div>

          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 8px 0' }}>
            {isChunkError
              ? 'Pembaruan Versi Sistem Tersedia'
              : (this.props.fallbackMessage || 'Terjadi Kendala pada Modul Ini')}
          </h3>

          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            margin: '0 0 18px 0',
            lineHeight: 1.5
          }}>
            {isChunkError
              ? 'Aplikasi telah diperbarui dengan versi terbaru di server. Muat ulang halaman untuk menyinkronkan antarmuka terbaru.'
              : (this.state.error?.message || 'Komponen mengalami galat rendering tak terduga. Modul diisolasi agar tidak mengganggu sistem utama.')}
          </p>

          <button 
            className="btn btn-primary btn-sm" 
            onClick={this.handleRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isChunkError ? 'linear-gradient(135deg, #00DF8F 0%, #059669 100%)' : undefined,
              color: isChunkError ? '#060911' : undefined,
              fontWeight: 700
            }}
          >
            <RefreshCw size={14} />
            <span>{isChunkError ? 'Perbarui & Muat Ulang Halaman' : 'Muat Ulang Modul'}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
