import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Calendar, 
  Share2, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import type { StaffMember, CreateStaffPayload, Tenant } from '../../types';
import { StaffStatsCards, StaffTable, StaffModal } from '../staff';

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

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ isPiiMasked = false, tenant }) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
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
      setSuccessMsg(`Karyawan '${staff.full_name}' berhasil dihapus.`);
      setActiveMenuStaffId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus karyawan.');
    }
  };

  // Filter pencarian staf
  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) return staffList;
    const q = searchTerm.toLowerCase();
    return staffList.filter(s => 
      s.full_name.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.phone_number.includes(q)
    );
  }, [staffList, searchTerm]);

  // Statistik Metrik untuk Top Stat Cards
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.is_active).length;
  const departmentsCount = new Set(staffList.map(s => s.role)).size;
  const attendanceRate = totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 98) : 98;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. TOP BREADCRUMB & ACTION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
          <span style={{ color: 'var(--mint-neon)', fontWeight: 600 }}>Home</span>
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
          Employees
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.90rem', margin: 0 }}>
          Manage all company employees, credentials, and workforce data for {tenant?.name || 'PT Abadi Nan Jaya'}.
        </p>
      </div>

      {/* Notifikasi Feedback */}
      {successMsg && (
        <div style={{
          background: 'rgba(0, 223, 143, 0.12)',
          border: '1px solid rgba(0, 223, 143, 0.35)',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--mint-neon)',
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

      {/* 3. TOP STAT PILLS ROW */}
      <StaffStatsCards 
        totalStaff={totalStaff}
        activeStaff={activeStaff}
        departmentsCount={departmentsCount}
        attendanceRate={attendanceRate}
      />

      {/* 4. MAIN EMPLOYEES PANEL & TABLE */}
      <div className="homies-card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Table Toolbar */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '320px'
          }}>
            <Search 
              size={16} 
              color="#64748b" 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input 
              type="text"
              placeholder="Search by name, role, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="homies-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Action Right: Filter & Add Employee Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setIsModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '0.82rem',
                background: 'var(--mint-neon)',
                color: '#000000'
              }}
            >
              <UserPlus size={15} />
              <span>+ Add Employee</span>
            </button>
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
    </div>
  );
};
