import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Calendar, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Users
} from 'lucide-react';
import { api } from '../../services/api';
import type { StaffMember, CreateStaffPayload, Tenant } from '../../types';
import { StaffStatsCards, StaffTable, StaffModal, StaffDetailModal } from '../staff';

interface StaffManagementViewProps {
  isPiiMasked?: boolean;
  tenant: Tenant | null;
}

// Sample avatars for realistic representation
const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&auto=format&fit=crop&q=60'
];

type RoleFilterType = 'ALL' | 'OWNER' | 'MANAGER' | 'CASHIER' | 'AUDITOR';

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ isPiiMasked = false, tenant }) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<RoleFilterType>('ALL');

  // Detail Modal State
  const [selectedStaffDetail, setSelectedStaffDetail] = useState<StaffMember | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Modal Tambah Karyawan State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateStaffPayload>({
    full_name: '',
    phone_number: '',
    role: 'CASHIER',
    pin: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Active Action Menu Popup
  const [activeMenuStaffId, setActiveMenuStaffId] = useState<string | null>(null);

  // Fetch data staf dari backend
  const loadStaff = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getStaffList();
      setStaffList(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat daftar staf karyawan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [tenant?.id]);

  // Handle pembuatan staf baru
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.full_name.trim() || formData.full_name.trim().length < 3) {
      setFormError('Nama lengkap karyawan minimal harus 3 karakter.');
      return;
    }
    if (!formData.phone_number.trim() || formData.phone_number.trim().length < 9) {
      setFormError('Nomor WhatsApp tidak valid (minimal 9 digit angka).');
      return;
    }
    if (!/^\d{6}$/.test(formData.pin)) {
      setFormError('PIN keamanan harus tepat 6 digit angka numerik.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newStaff = await api.createStaff({
        ...formData,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim()
      });
      setStaffList(prev => [...prev, newStaff]);
      setSuccessMsg(`Staf '${newStaff.full_name}' (${newStaff.role}) berhasil didaftarkan!`);
      setIsModalOpen(false);
      setFormData({
        full_name: '',
        phone_number: '',
        role: 'CASHIER',
        pin: ''
      });
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Gagal mendaftarkan karyawan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status aktif/nonaktif
  const handleToggleStatus = async (staff: StaffMember) => {
    if (staff.role === 'OWNER') {
      alert('Akun Pemilik Usaha (Owner) tidak dapat dinonaktifkan.');
      return;
    }
    try {
      const updated = await api.updateStaffStatus(staff.id, !staff.is_active);
      setStaffList(prev => prev.map(s => s.id === staff.id ? updated : s));
      if (selectedStaffDetail?.id === staff.id) {
        setSelectedStaffDetail(updated);
      }
      setSuccessMsg(`Status '${staff.full_name}' diubah menjadi ${updated.is_active ? 'AKTIF' : 'NONAKTIF'}.`);
      setActiveMenuStaffId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status staf.');
    }
  };

  // Hapus staf
  const handleDeleteStaff = async (staff: StaffMember) => {
    if (staff.role === 'OWNER') {
      alert('Akun Pemilik Usaha (Owner) tidak dapat dihapus.');
      return;
    }
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus akun staf '${staff.full_name}'?`);
    if (!confirmDelete) return;

    try {
      await api.deleteStaff(staff.id);
      setStaffList(prev => prev.filter(s => s.id !== staff.id));
      if (selectedStaffDetail?.id === staff.id) {
        setIsDetailModalOpen(false);
        setSelectedStaffDetail(null);
      }
      setSuccessMsg(`Karyawan '${staff.full_name}' berhasil dihapus.`);
      setActiveMenuStaffId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus karyawan.');
    }
  };

  // Hitung jumlah staf per role
  const roleCounts = useMemo(() => {
    return {
      ALL: staffList.length,
      OWNER: staffList.filter(s => s.role === 'OWNER').length,
      MANAGER: staffList.filter(s => s.role === 'MANAGER').length,
      CASHIER: staffList.filter(s => s.role === 'CASHIER').length,
      AUDITOR: staffList.filter(s => s.role === 'AUDITOR').length,
    };
  }, [staffList]);

  // Filter pencarian staf & role tabs
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      // 1. Role filter
      if (selectedRoleFilter !== 'ALL' && s.role !== selectedRoleFilter) {
        return false;
      }
      // 2. Search query filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        s.full_name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.phone_number.includes(q)
      );
    });
  }, [staffList, searchTerm, selectedRoleFilter]);

  // Statistik Metrik untuk Top Stat Cards
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.is_active).length;
  const departmentsCount = new Set(staffList.map(s => s.role)).size;
  const attendanceRate = totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 98) : 98;

  const ROLE_TABS = [
    { id: 'ALL', label: 'Semua Karyawan', count: roleCounts.ALL },
    { id: 'OWNER', label: 'Owner', count: roleCounts.OWNER },
    { id: 'MANAGER', label: 'Manager', count: roleCounts.MANAGER },
    { id: 'CASHIER', label: 'Kasir POS', count: roleCounts.CASHIER },
    { id: 'AUDITOR', label: 'Auditor SAK', count: roleCounts.AUDITOR }
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. TOP BREADCRUMB & ACTION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
          <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>Home</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>/</span>
          <span style={{ color: '#94a3b8' }}>Employees</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="homies-icon-btn" title="Kalender Kerja & Shift">
            <Calendar size={16} />
          </button>
          <button className="homies-icon-btn" title="Ekspor Data Karyawan">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* 2. HEADER TITLE & SUBTITLE */}
      <div>
        <h1 style={{ 
          fontSize: '2.1rem', 
          fontWeight: 700, 
          color: '#FFFFFF', 
          letterSpacing: '-0.025em',
          margin: '0 0 4px 0',
          fontFamily: 'var(--font-display)'
        }}>
          Employees & Workforce
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.90rem', margin: 0 }}>
          Manajemen kredensial tim, hak akses kasir POS, dan verifikasi audit SAK EMKM untuk {tenant?.name || 'Unit Usaha'}.
        </p>
      </div>

      {/* Notifikasi Feedback */}
      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--emerald-400)',
          fontSize: '0.86rem',
          fontWeight: 500
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#F87171',
          fontSize: '0.86rem',
          fontWeight: 500
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. TOP STAT CARDS ROW */}
      <StaffStatsCards 
        totalStaff={totalStaff}
        activeStaff={activeStaff}
        departmentsCount={departmentsCount}
        attendanceRate={attendanceRate}
      />

      {/* 4. MAIN EMPLOYEES PANEL & TABLE */}
      <div className="homies-card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Table Toolbar: Filter Chips + Search + Action */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Top Row of Toolbar: Interactive Role Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {ROLE_TABS.map(tab => {
                const isSelected = selectedRoleFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedRoleFilter(tab.id as RoleFilterType)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: isSelected ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? 'var(--emerald-400)' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#ffffff' : '#64748b',
                      fontWeight: 700
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Match Indicator */}
            <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={13} color="var(--emerald-400)" />
              <span>{filteredStaff.length} dari {staffList.length} karyawan tampil</span>
            </div>
          </div>

          {/* Bottom Row of Toolbar: Search Box & Add Employee Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Search Box with dark glass design and clear button */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px'
            }}>
              <Search 
                size={16} 
                color="var(--emerald-400)" 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.8 }} 
              />
              <input 
                type="text"
                placeholder="Cari nama, role, no. WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="homies-input"
                style={{ 
                  paddingLeft: '36px', 
                  paddingRight: searchTerm ? '32px' : '12px',
                  height: '40px', 
                  fontSize: '0.84rem' 
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Action Right: Luxury Gradient Add Employee Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  color: '#021a10',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.3)';
                }}
              >
                <UserPlus size={16} strokeWidth={2.3} />
                <span>+ Tambah Karyawan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <StaffTable 
          staffList={filteredStaff}
          isLoading={isLoading}
          isPiiMasked={isPiiMasked}
          activeMenuStaffId={activeMenuStaffId}
          onToggleMenu={(id) => setActiveMenuStaffId(activeMenuStaffId === id ? null : id)}
          onToggleStatus={handleToggleStatus}
          onDeleteStaff={handleDeleteStaff}
          onViewDetail={(staff) => {
            setSelectedStaffDetail(staff);
            setIsDetailModalOpen(true);
          }}
          avatars={AVATARS}
        />
      </div>

      {/* Modal Tambah Karyawan Baru */}
      <StaffModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateStaff}
        isSubmitting={isSubmitting}
        formError={formError}
      />

      {/* Modal Detail Profil & Otoritas Karyawan */}
      <StaffDetailModal 
        staff={selectedStaffDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStaffDetail(null);
        }}
        isPiiMasked={isPiiMasked}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
};
