import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Smartphone, 
  KeyRound,
  CheckCircle2,
  Lock,
  AlertCircle,
  Building2,
  User,
  MapPin,
  Briefcase,
  UserPlus,
  LogIn
} from 'lucide-react';
import type { AppPage, UserRole } from '../../types';
import { api, type LoginResponse } from '../../services/api';

interface LoginViewProps {
  onLoginSuccess: (role: UserRole, targetPage: AppPage, tenant?: LoginResponse['tenant']) => void;
  onBackToHome: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onBackToHome
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State: Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Form State: Register
  const [regFullName, setRegFullName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regCategory, setRegCategory] = useState('Kuliner & Katering');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await api.login(loginPhone, loginPin);
      setIsLoading(false);
      onLoginSuccess((response.user.role as UserRole) || 'OWNER', 'portal_umkm', response.tenant);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Nomor WhatsApp atau PIN tidak valid.');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validasi PIN
    if (regPin.length !== 6 || !/^\d+$/.test(regPin)) {
      setIsLoading(false);
      setErrorMessage('PIN keamanan finansial harus terdiri dari 6 digit angka numerik.');
      return;
    }

    if (regPin !== regConfirmPin) {
      setIsLoading(false);
      setErrorMessage('Konfirmasi PIN tidak cocok dengan PIN transaksi yang Anda masukkan.');
      return;
    }

    try {
      const response = await api.register({
        full_name: regFullName.trim(),
        business_name: regBusinessName.trim(),
        phone_number: regPhone.trim(),
        business_category: regCategory,
        address: regAddress.trim(),
        pin: regPin
      });

      setSuccessMessage('Pendaftaran berhasil! Menginisialisasi buku besar SAK EMKM...');
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess((response.user.role as UserRole) || 'OWNER', 'portal_umkm', response.tenant);
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Pendaftaran akun gagal. Silakan periksa kembali data Anda.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0f1c36 0%, #05070f 70%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
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
        <span>Kembali ke Beranda</span>
      </button>

      {/* Main Container Card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: activeTab === 'register' ? '540px' : '440px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        borderRadius: 'var(--radius-lg)',
        transition: 'max-width 0.3s ease'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px var(--emerald-glow)'
          }}>
            <ShieldCheck size={26} color="#021a10" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            FINA<span style={{ color: 'var(--emerald-400)' }}>-ENTERPRISE</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            {activeTab === 'login' 
              ? 'Portal Otentikasi Pemilik Usaha UMKM Terdaftar'
              : 'Pendaftaran Akun Bisnis & Pengusaha UMKM Baru'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'login' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'login' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeTab === 'login' ? 600 : 500,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogIn size={15} color={activeTab === 'login' ? 'var(--emerald-400)' : 'currentColor'} />
            <span>Masuk Akun</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'register' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'register' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeTab === 'register' ? 600 : 500,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <UserPlus size={15} color={activeTab === 'register' ? 'var(--emerald-400)' : 'currentColor'} />
            <span>Daftar Usaha Baru</span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            color: '#fca5a5',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#f87171', marginBottom: '2px' }}>Akses Ditolak</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            color: 'var(--emerald-400)',
            lineHeight: 1.4
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, color: 'var(--emerald-400)' }} />
            <div>{successMessage}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: FORM LOGIN */}
        {/* ========================================================================= */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Field: Phone */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Nomor WhatsApp Bisnis Terdaftar:
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
                <Smartphone size={16} color="var(--emerald-400)" />
                <input
                  type="text"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  required
                  placeholder="Contoh: 0812-3456-7890"
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

            {/* Field: PIN */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                PIN Keamanan Finansial (6 Digit):
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
                <KeyRound size={16} color="var(--emerald-400)" />
                <input
                  type="password"
                  maxLength={6}
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  required
                  placeholder="••••••"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    letterSpacing: '0.3em',
                    outline: 'none',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{
                padding: '12px',
                fontSize: '0.92rem',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <span>Memverifikasi Akses Kriptografis...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Masuk ke Workspace Finansial</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Belum memiliki akun bisnis?{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--emerald-400)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Daftar Usaha Baru
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FORM REGISTRASI AKUN BARU */}
        {/* ========================================================================= */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Grid Baris 1: Nama Pemilik & Nama Usaha */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Nama Lengkap Pemilik Usaha:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px'
                }}>
                  <User size={15} color="var(--emerald-400)" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                    placeholder="Nama lengkap Anda"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.82rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Nama Usaha / Toko / CV / PT:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px'
                }}>
                  <Building2 size={15} color="var(--emerald-400)" />
                  <input
                    type="text"
                    value={regBusinessName}
                    onChange={(e) => setRegBusinessName(e.target.value)}
                    required
                    placeholder="Contoh: Kopi Nusantara"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.82rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Grid Baris 2: Sektor Usaha & Nomor WhatsApp */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Sektor / Kategori Usaha:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px'
                }}>
                  <Briefcase size={15} color="var(--emerald-400)" />
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      outline: 'none',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Kuliner & Katering" style={{ background: '#0f1c36', color: '#fff' }}>Kuliner & Katering</option>
                    <option value="Ritel & Minimarket / Sembako" style={{ background: '#0f1c36', color: '#fff' }}>Ritel & Minimarket / Sembako</option>
                    <option value="Distribusi, Grosir & FMCG" style={{ background: '#0f1c36', color: '#fff' }}>Distribusi, Grosir & FMCG</option>
                    <option value="Jasa & Agensi Kreatif" style={{ background: '#0f1c36', color: '#fff' }}>Jasa & Agensi Kreatif</option>
                    <option value="Manufaktur & Produksi Rumahan" style={{ background: '#0f1c36', color: '#fff' }}>Manufaktur & Produksi Rumahan</option>
                    <option value="Lainnya" style={{ background: '#0f1c36', color: '#fff' }}>Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Nomor WhatsApp Bisnis Aktif:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px'
                }}>
                  <Smartphone size={15} color="var(--emerald-400)" />
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                    placeholder="08xxxxxxxxxx"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.82rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Field: Alamat Usaha */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Alamat Operasional Bisnis:
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px'
              }}>
                <MapPin size={15} color="var(--emerald-400)" />
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  required
                  placeholder="Jl. Nama Jalan No. XX, Kota"
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.82rem', outline: 'none', width: '100%' }}
                />
              </div>
            </div>

            {/* Grid Baris 3: Buat PIN & Konfirmasi PIN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Buat PIN 6 Digit:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px'
                }}>
                  <KeyRound size={15} color="var(--emerald-400)" />
                  <input
                    type="password"
                    maxLength={6}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    required
                    placeholder="••••••"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.82rem', letterSpacing: '0.2em', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Konfirmasi PIN 6 Digit:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: regConfirmPin && regPin !== regConfirmPin ? '1px solid #ef4444' : '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px'
                }}>
                  <KeyRound size={15} color={regConfirmPin && regPin === regConfirmPin ? 'var(--emerald-400)' : 'currentColor'} />
                  <input
                    type="password"
                    maxLength={6}
                    value={regConfirmPin}
                    onChange={(e) => setRegConfirmPin(e.target.value)}
                    required
                    placeholder="••••••"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.82rem', letterSpacing: '0.2em', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{
                padding: '12px',
                fontSize: '0.9rem',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <span>Mendaftarkan Usaha & Menyiapkan Ledger...</span>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Daftarkan Usaha & Terbitkan Lisensi</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Sudah memiliki akun bisnis terdaftar?{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--emerald-400)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Masuk di Sini
              </button>
            </div>
          </form>
        )}

        {/* Security Footer Note (Zero Information Leakage) */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--emerald-400)' }}>
            <Lock size={12} />
            <span>Enkripsi AES-256 GCM & Kriptografi Hash PBKDF2-HMAC-SHA256</span>
          </div>
          <span>Kepatuhan Penuh UU PDP No. 27/2022 & Standar Akuntansi SAK EMKM</span>
        </div>
      </div>
    </div>
  );
};
