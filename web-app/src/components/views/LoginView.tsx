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
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { AppPage, UserRole } from '../../types';
import { api, type LoginResponse } from '../../services/api';

interface LoginViewProps {
  onLoginSuccess: (role: UserRole, targetPage: AppPage, tenant?: LoginResponse['tenant']) => void;
  onBackToHome: () => void;
  initialTab?: 'login' | 'register';
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onBackToHome,
  initialTab = 'login'
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State: Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPin, setShowLoginPin] = useState(false);

  // Form State: Register
  const [regFullName, setRegFullName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regCategory, setRegCategory] = useState('Kuliner & Katering');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [showRegConfirmPin, setShowRegConfirmPin] = useState(false);

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
      background: 'radial-gradient(ellipse at 50% 15%, #0e1e38 0%, #050811 75%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient Radial Glow Behind Card */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '560px',
        height: '420px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Back to Home Button */}
      <button
        onClick={onBackToHome}
        className="btn-ghost"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          backdropFilter: 'blur(16px)',
          borderRadius: '999px',
          padding: '8px 18px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '0.84rem',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 10
        }}
      >
        <ArrowLeft size={16} />
        <span>Kembali ke Beranda</span>
      </button>

      {/* Main Container Card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: activeTab === 'register' ? '560px' : '450px',
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        background: 'rgba(10, 18, 32, 0.85)',
        backdropFilter: 'blur(28px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 45px -10px rgba(16, 185, 129, 0.16)',
        borderRadius: '24px',
        transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
          }}>
            <ShieldCheck size={28} color="#021a10" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            FINA<span style={{ color: 'var(--emerald-400)' }}>-ENTERPRISE</span>
          </h2>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 12px',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.74rem',
            color: 'var(--emerald-400)',
            fontWeight: 600
          }}>
            <Sparkles size={12} />
            <span>
              {activeTab === 'login' 
                ? 'Portal Otentikasi Pemilik Usaha UMKM'
                : 'Pendaftaran Akun Bisnis & Pengusaha UMKM Baru'}
            </span>
          </div>
        </div>

        {/* Tab Switcher Segment Control */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(5, 10, 20, 0.75)',
          padding: '5px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: activeTab === 'login' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent',
              background: activeTab === 'login' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.24) 0%, rgba(6, 182, 212, 0.18) 100%)' 
                : 'transparent',
              color: activeTab === 'login' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeTab === 'login' ? 700 : 500,
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'login' ? '0 4px 14px rgba(16, 185, 129, 0.22)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <LogIn size={16} color={activeTab === 'login' ? 'var(--emerald-400)' : 'currentColor'} />
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
              padding: '10px 14px',
              borderRadius: '10px',
              border: activeTab === 'register' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent',
              background: activeTab === 'register' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.24) 0%, rgba(6, 182, 212, 0.18) 100%)' 
                : 'transparent',
              color: activeTab === 'register' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeTab === 'register' ? 700 : 500,
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'register' ? '0 4px 14px rgba(16, 185, 129, 0.22)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <UserPlus size={16} color={activeTab === 'register' ? 'var(--emerald-400)' : 'currentColor'} />
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
            border: '1px solid rgba(239, 68, 68, 0.35)',
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
            border: '1px solid rgba(16, 185, 129, 0.35)',
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
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Field: Phone */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Nomor WhatsApp Bisnis Terdaftar:
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '11px 14px',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}>
                <Smartphone size={17} color="var(--emerald-400)" />
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
                    fontSize: '0.9rem',
                    outline: 'none',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {/* Field: PIN with Show/Hide Toggle */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  PIN Keamanan Finansial (6 Digit):
                </label>
                <button
                  type="button"
                  onClick={() => setShowLoginPin(!showLoginPin)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: showLoginPin ? 'var(--emerald-400)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  {showLoginPin ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showLoginPin ? 'Sembunyikan' : 'Lihat PIN'}</span>
                </button>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '11px 14px',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}>
                <KeyRound size={17} color="var(--emerald-400)" />
                <input
                  type={showLoginPin ? "text" : "password"}
                  maxLength={6}
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  required
                  placeholder={showLoginPin ? "123456" : "••••••"}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    letterSpacing: showLoginPin ? '0.25em' : '0.35em',
                    fontFamily: 'monospace',
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
                width: '100%',
                padding: '13px',
                fontSize: '0.94rem',
                fontWeight: 700,
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <span>Memverifikasi Akses Kriptografis...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Masuk ke Workspace Finansial</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
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
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Grid Baris 1: Nama Pemilik & Nama Usaha */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Nama Lengkap Pemilik Usaha:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px'
                }}>
                  <User size={15} color="var(--emerald-400)" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                    placeholder="Nama lengkap Anda"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.84rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Nama Usaha / Toko / CV / PT:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px'
                }}>
                  <Building2 size={15} color="var(--emerald-400)" />
                  <input
                    type="text"
                    value={regBusinessName}
                    onChange={(e) => setRegBusinessName(e.target.value)}
                    required
                    placeholder="Contoh: Kopi Nusantara"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.84rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Grid Baris 2: Sektor Usaha & Nomor WhatsApp */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Sektor / Kategori Usaha:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px'
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
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Nomor WhatsApp Bisnis Aktif:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px'
                }}>
                  <Smartphone size={15} color="var(--emerald-400)" />
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                    placeholder="08xxxxxxxxxx"
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.84rem', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Field: Alamat Usaha */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                Alamat Operasional Bisnis:
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '9px 12px'
              }}>
                <MapPin size={15} color="var(--emerald-400)" />
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  required
                  placeholder="Jl. Nama Jalan No. XX, Kota"
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.84rem', outline: 'none', width: '100%' }}
                />
              </div>
            </div>

            {/* Grid Baris 3: Buat PIN & Konfirmasi PIN with Eye Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Buat PIN 6 Digit:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegPin(!showRegPin)}
                    style={{ background: 'none', border: 'none', color: showRegPin ? 'var(--emerald-400)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    {showRegPin ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px'
                }}>
                  <KeyRound size={15} color="var(--emerald-400)" />
                  <input
                    type={showRegPin ? "text" : "password"}
                    maxLength={6}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    required
                    placeholder="••••••"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      letterSpacing: showRegPin ? '0.2em' : '0.3em',
                      fontFamily: 'monospace',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Konfirmasi PIN:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPin(!showRegConfirmPin)}
                    style={{ background: 'none', border: 'none', color: showRegConfirmPin ? 'var(--emerald-400)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    {showRegConfirmPin ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.35)',
                  border: regConfirmPin && regPin !== regConfirmPin ? '1px solid #ef4444' : '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px'
                }}>
                  <KeyRound size={15} color={regConfirmPin && regPin === regConfirmPin ? 'var(--emerald-400)' : 'currentColor'} />
                  <input
                    type={showRegConfirmPin ? "text" : "password"}
                    maxLength={6}
                    value={regConfirmPin}
                    onChange={(e) => setRegConfirmPin(e.target.value)}
                    required
                    placeholder="••••••"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      letterSpacing: showRegConfirmPin ? '0.2em' : '0.3em',
                      fontFamily: 'monospace',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* PIN Matching Real-Time Feedback */}
            {regConfirmPin.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                marginTop: '-4px',
                fontWeight: 600,
                color: regPin === regConfirmPin && regPin.length === 6 ? 'var(--emerald-400)' : '#f87171'
              }}>
                {regPin === regConfirmPin && regPin.length === 6 ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>PIN 6 Digit Cocok & Siap Diterbitkan</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    <span>{regPin.length !== 6 ? 'PIN utama harus tepat 6 digit angka numerik' : 'Konfirmasi PIN belum cocok'}</span>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.94rem',
                fontWeight: 700,
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <span>Mendaftarkan Usaha & Menyiapkan Ledger...</span>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Daftarkan Usaha & Terbitkan Lisensi</span>
                  <ArrowRight size={16} />
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
          paddingTop: '16px'
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
