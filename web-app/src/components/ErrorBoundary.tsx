import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[FINA ErrorBoundary] Runtime rendering fault caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel" style={{
          padding: '36px 24px',
          margin: '20px auto',
          maxWidth: '560px',
          textAlign: 'center',
          borderColor: 'rgba(239, 68, 68, 0.4)',
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <AlertTriangle size={26} color="var(--rose-400)" />
          </div>

          <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: '0 0 8px 0' }}>
            {this.props.fallbackMessage || 'Terjadi Kendala pada Modul Ini'}
          </h3>

          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            margin: '0 0 18px 0',
            lineHeight: 1.5
          }}>
            {this.state.error?.message || 'Komponen mengalami galat rendering tak terduga. Modul diisolasi agar tidak mengganggu sistem utama.'}
          </p>

          <button 
            className="btn btn-primary btn-sm" 
            onClick={this.handleRetry}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>Muat Ulang Modul</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
