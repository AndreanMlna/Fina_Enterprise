import React from 'react';
import { Search, MoreHorizontal } from 'lucide-react';
import type { StaffMember, NavigationTab } from '../../types';
import { formatCurrency, maskPhone } from '../../utils';

export interface TransactionRow {
  id: string;
  refId: string;
  name: string;
  accountRole: string;
  nominal: number;
  status: 'Active' | 'Pending' | 'Audited';
  date: string;
  department: string;
  avatarSeed: string;
}

interface CockpitTableCardProps {
  tableMode: 'TRANSACTIONS' | 'STAFF';
  onTableModeChange: (mode: 'TRANSACTIONS' | 'STAFF') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  staffList: StaffMember[];
  filteredStaffList: StaffMember[];
  transactions: TransactionRow[];
  filteredTransactions: TransactionRow[];
  liveEntriesCount: number;
  onNavigate: (tab: NavigationTab) => void;
}

export const CockpitTableCard: React.FC<CockpitTableCardProps> = ({
  tableMode,
  onTableModeChange,
  searchQuery,
  onSearchChange,
  staffList,
  filteredStaffList,
  transactions,
  filteredTransactions,
  liveEntriesCount,
  onNavigate
}) => {
  return (
    <div className="homies-card" style={{ padding: '22px' }}>
      {/* Table Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 2px 0' }}>
              {tableMode === 'STAFF' ? 'Daftar Karyawan' : 'Jurnal Transaksi Kasir'}
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0 }}>
              {tableMode === 'STAFF' 
                ? `Akun personel tim dan hak akses aktif (${staffList.length} terdaftar).`
                : 'Catatan mutasi kasir POS dan pelunasan piutang usaha.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '3px',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => onTableModeChange('STAFF')}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: tableMode === 'STAFF' ? 'var(--mint-neon)' : 'transparent',
                color: tableMode === 'STAFF' ? '#000000' : '#94a3b8'
              }}
            >
              Karyawan ({staffList.length > 0 ? staffList.length : 3})
            </button>
            <button
              type="button"
              onClick={() => onTableModeChange('TRANSACTIONS')}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: tableMode === 'TRANSACTIONS' ? 'var(--mint-neon)' : 'transparent',
                color: tableMode === 'TRANSACTIONS' ? '#000000' : '#94a3b8'
              }}
            >
              Transaksi ({liveEntriesCount > 0 ? liveEntriesCount : transactions.length})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            padding: '6px 14px',
            width: '210px'
          }}>
            <Search size={14} color="#64748B" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                width: '100%'
              }}
            />
          </div>

          <button 
            className="homies-icon-btn" 
            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
            onClick={() => onNavigate(tableMode === 'STAFF' ? 'staff' : 'ledger')}
            title={tableMode === 'STAFF' ? 'Buka Manajemen Staf Lengkap' : 'Buka Buku Besar Lengkap'}
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Data Table with Internal Scroll & Sticky Header */}
      <div 
        className="table-scroll-container"
        style={{ 
          maxHeight: '360px', 
          overflowY: 'auto',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead className="sticky-table-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#111A24' }}>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: '#111A24' }}>
              <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                {tableMode === 'STAFF' ? 'NAMA PERSONEL' : 'DESKRIPSI TRANSAKSI'}
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                {tableMode === 'STAFF' ? 'ID STAF' : 'REFERENSI'}
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                {tableMode === 'STAFF' ? 'PERAN' : 'AKUN BUKU BESAR'}
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>
                {tableMode === 'STAFF' ? 'KONTAK' : 'NOMINAL'}
              </th>
              <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>STATUS</th>
              <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>TANGGAL</th>
              <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em' }}>DEPARTEMEN</th>
              <th style={{ padding: '11px 14px', fontSize: '0.70rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em', textAlign: 'right' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {tableMode === 'STAFF' ? (
              filteredStaffList.map((staff, idx) => {
                const empId = `EMP-${(idx + 1).toString().padStart(4, '0')}`;
                const dept = staff.role === 'OWNER' ? 'Direksi & Manajemen' : staff.role === 'MANAGER' ? 'Operasional Toko' : 'Kasir & Front Office';
                const emailOrPhone = maskPhone(staff.phone_number);
                const cleanName = staff.full_name ? staff.full_name.replace(/\s*\(.*?\)/g, '') : 'Staf';
                const avatar = staff.role === 'OWNER'
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60'
                  : staff.role === 'MANAGER'
                  ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60'
                  : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60';
                
                return (
                  <tr key={staff.id} className="homies-table-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={avatar} 
                          alt={cleanName}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '0.80rem', fontWeight: 600, color: '#FFFFFF' }}>
                            {cleanName}
                          </div>
                          <div style={{ fontSize: '0.70rem', color: '#64748B' }}>
                            @{staff.role.toLowerCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="mono" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {empId}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: staff.role === 'OWNER' ? 'rgba(0, 223, 143, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                        color: staff.role === 'OWNER' ? 'var(--mint-neon)' : '#FFFFFF'
                      }}>
                        {staff.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="mono" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {emailOrPhone}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        color: 'var(--mint-neon)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ● Aktif
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {staff.created_at ? new Date(staff.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Aktif'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                        {dept}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button 
                        className="homies-icon-btn" 
                        style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                        onClick={() => onNavigate('staff')}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              filteredTransactions.map((trx) => (
                <tr key={trx.id} className="homies-table-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                  {/* Name + Avatar */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={trx.avatarSeed} 
                        alt={trx.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                      <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#FFFFFF' }}>
                        {trx.name}
                      </span>
                    </div>
                  </td>

                  {/* Ref */}
                  <td style={{ padding: '12px 14px' }}>
                    <span className="mono" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                      {trx.refId}
                    </span>
                  </td>

                  {/* Role */}
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {trx.accountRole}
                    </span>
                  </td>

                  {/* Nominal */}
                  <td style={{ padding: '12px 14px' }}>
                    <span className="mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {formatCurrency(trx.nominal)}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      color: 'var(--mint-neon)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ● {trx.status === 'Active' ? 'Sukses' : trx.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                      {trx.date}
                    </span>
                  </td>

                  {/* Department */}
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                      {trx.department}
                    </span>
                  </td>

                  {/* Action */}
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button 
                      className="homies-icon-btn" 
                      style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                      onClick={() => onNavigate('ledger')}
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
