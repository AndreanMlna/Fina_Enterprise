import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  ArrowLeft, 
  UserCheck, 
  KeyRound,
  CheckCircle2,
  Headphones,
  Globe,
  Radio
} from 'lucide-react';
import type { AppPage, UserRole } from '../../types';

interface CSStaffLoginViewProps {
  onLoginSuccess: (role: UserRole, targetPage: AppPage) => void;
  onBackToHome: () => void;
}

export const CSStaffLoginView: React.FC<CSStaffLoginViewProps> = ({
  onLoginSuccess,
  onBackToHome
}) => {
  const [loginMode, setLoginMode] = useState<'SSO' | 'CREDENTIALS'>('SSO');
  const [staffId, setStaffId] = useState('CS-OPS-8842');
  const [staffPassword, setStaffPassword] = useState('••••••••••••');
  const [twoFactorCode, setTwoFactorCode] = useState('849201');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess('AUDITOR', 'portal_cs');
    }, 700);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #06192e 0%, #030712 80%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Back to Home Button */}
      <button
        onClick={onBackToHome}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '0.82rem'
        }}
      >
        <ArrowLeft size={16} />
        <span>Kembali ke Halaman Publik</span>
      </button>

      {/* Main Internal Login Card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(6, 182, 212, 0.3)'
      }}>
        {/* Header Badges */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px var(--cyan-glow)'
          }}>
            <Headphones size={28} color="#000000" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
              INTERNAL BACKOFFICE
            </span>
            <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>
              VPN RESTRICTED
            </span>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 0 0' }}>
            FINA CS & AI-Ops Desk
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Konsol Operasional Bantuan Pelanggan & Human-in-the-Loop (HITL)
          </p>
        </div>

        {/* Security Warning Box */}
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          fontSize: '0.76rem',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>
            Akses Terbatas Staf Resmi. Seluruh aktivitas audit sesi dicatat secara kriptografis (*SHA-256 Merkle Chain*).
          </span>
        </div>

        {/* Auth Mode Toggle */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(0,0,0,0.3)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => setLoginMode('SSO')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              background: loginMode === 'SSO' ? 'var(--cyan-500)' : 'transparent',
              color: loginMode === 'SSO' ? '#000000' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Globe size={14} />
            <span>Google Workspace SSO</span>
          </button>

          <button
            type="button"
            onClick={() => setLoginMode('CREDENTIALS')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              background: loginMode === 'CREDENTIALS' ? 'var(--cyan-500)' : 'transparent',
              color: loginMode === 'CREDENTIALS' ? '#000000' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <KeyRound size={14} />
            <span>Staff ID & 2FA</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loginMode === 'SSO' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Akun Email Korporat Terdeteksi:</span>
                <span className="mono" style={{ fontSize: '0.92rem', color: 'var(--cyan-400)', fontWeight: 600 }}>
                  rian.pratama@fina.enterprise
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Peran: Senior Support Engineer & Dialect Lexicon Reviewer
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--emerald-400)' }}>
                <Radio size={12} />
                <span>Koneksi VPN WireGuard Aktif (IP: 10.240.88.12)</span>
              </div>
            </div>
          ) : (
            <>
              {/* Field 1: Staff ID */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Nomor Induk Staf / Employee ID:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px'
                }}>
                  <UserCheck size={16} color="var(--cyan-400)" />
                  <input
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    required
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Kata Sandi Portal Internal:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px'
                }}>
                  <Lock size={16} color="var(--cyan-400)" />
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    required
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              {/* Field 3: 2FA */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Kode Otentikasi 2FA (Google Authenticator / YubiKey):
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px'
                }}>
                  <KeyRound size={16} color="var(--cyan-400)" />
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    required
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      letterSpacing: '0.2em',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              padding: '12px',
              fontSize: '0.92rem',
              marginTop: '6px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? (
              <span>Memverifikasi Akses Internal Zero-Trust...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{loginMode === 'SSO' ? 'Masuk via Google SSO Korporat' : 'Otentikasi & Buka CS Desk'}</span>
              </>
            )}
          </button>
        </form>

        {/* Security Footer Note */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '14px'
        }}>
          <span>Audit Sesi Karyawan: ENCRYPTED-SESSION-ECDSA-P256</span>
          <span className="mono" style={{ color: 'var(--cyan-400)' }}>Device Posture: COMPLIANT (BitLocker Active)</span>
        </div>
      </div>
    </div>
  );
};
