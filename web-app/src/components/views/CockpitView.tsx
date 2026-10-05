/**
 * FINA-ENTERPRISE - Cockpit Executive Dashboard (View Orchestrator)
 * 
 * Standar Arsitektur: Clean Architecture / Single Responsibility Principle (SRP)
 * Terdekomposisi ke dalam 6 subkomponen modular di `components/cockpit/`:
 *   - CockpitHeroBanner: Greeting, breadcrumbs, stat pills, semicircular radial gauge meter
 *   - CockpitTelemetryCard: Otomasi & jadwal operasional, filter pills
 *   - CockpitLiquidityCard: +70,3% Efisiensi Arus Kas glowing bezier chart & 5 micro-metric cards
 *   - CockpitStaffCard: Status Karyawan bar chart distribusi & live roster
 *   - CockpitTableCard: Internal scrollable table dengan sticky header untuk staf & kasir
 *   - CockpitQuickLaunch: Pintasan cepat modul otonom
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { KPIStats, NavigationTab, Tenant, StaffMember } from '../../types';
import type { LedgerEntry } from '../../services/types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';
import {
  CockpitHeroBanner,
  CockpitTelemetryCard,
  CockpitLiquidityCard,
  CockpitStaffCard,
  CockpitTableCard,
  CockpitQuickLaunch
} from '../cockpit';
import type { TelemetryEvent, TransactionRow } from '../cockpit';

interface CockpitViewProps {
  kpi: KPIStats;
  onNavigate: (tab: NavigationTab) => void;
  tenant?: Tenant | null;
}

export const CockpitView: React.FC<CockpitViewProps> = ({ kpi, onNavigate, tenant }) => {
  // State manajemen dashboard
  const [activeTelemetryFilter, setActiveTelemetryFilter] = useState<'ALL' | 'SWEEPING' | 'DUNNING' | 'AUDIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableMode, setTableMode] = useState<'TRANSACTIONS' | 'STAFF'>('TRANSACTIONS');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [liveEntries, setLiveEntries] = useState<LedgerEntry[]>([]);

  // Sinkronisasi data live dari PostgreSQL 16
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [staffData, vouchersData] = await Promise.allSettled([
          api.getStaffList(),
          api.getLedgerEntries()
        ]);
        if (staffData.status === 'fulfilled' && Array.isArray(staffData.value)) {
          setStaffList(staffData.value);
        }
        if (vouchersData.status === 'fulfilled' && Array.isArray(vouchersData.value)) {
          setLiveEntries(vouchersData.value);
        }
      } catch (err) {
        console.warn("[CockpitView] Gagal mengambil data live dashboard:", err);
      }
    };
    loadDashboardData();
  }, [tenant?.id]);

  // Tanggal terformat dinamis bahasa Indonesia baku
  const formattedToday = useMemo(() => {
    const d = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  // Event otomasi & jadwal operasional sistem
  const telemetryEvents: TelemetryEvent[] = useMemo(() => {
    const hasCashSurplus = kpi.liquidCash > kpi.safetyBuffer && kpi.safetyBuffer > 0;
    const surplusAmount = hasCashSurplus ? kpi.liquidCash - kpi.safetyBuffer : 0;

    return [
      {
        id: 'tel-1',
        category: 'SWEEPING',
        title: hasCashSurplus ? 'Sweeping Kas & Deposito' : 'Penyangga Likuiditas Kas',
        subtitle: hasCashSurplus 
          ? `Alokasi surplus ${formatCurrency(surplusAmount)} ke pasar uang (yield 5.9% p.a.).`
          : 'Penyangga likuiditas operasional terjaga sesuai target aman.',
        source: 'FinOrchestrator AI',
        timeRange: '13:00 - 13:30',
        status: 'ACTIVE',
        avatars: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60'],
        actionTab: 'montecarlo',
        actionLabel: 'Buka Simulasi'
      },
      {
        id: 'tel-2',
        category: 'AUDIT',
        title: 'Audit Konsistensi Buku Besar',
        subtitle: 'Validasi integritas jurnal berpasangan dan konsistensi saldo SAK EMKM.',
        source: 'PostgreSQL ACID Engine',
        timeRange: '15:00 - 16:00',
        status: 'NORMAL',
        avatars: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60'],
        actionTab: 'ledger',
        actionLabel: 'Buka Buku Besar'
      },
      {
        id: 'tel-3',
        category: 'DUNNING',
        title: 'Penagihan Piutang WhatsApp',
        subtitle: kpi.activeAccountsReceivable > 0 
          ? `Piutang ${formatCurrency(kpi.activeAccountsReceivable)} siap dikirim reminder berlink QRIS SNAP.`
          : 'Seluruh piutang usaha terpantau lancar tanpa tunggakan.',
        source: 'AR Dunning Bot',
        timeRange: '16:30 - 17:00',
        status: 'NORMAL',
        avatars: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60'],
        actionTab: 'ar_dunning',
        actionLabel: 'Buka Penagihan'
      }
    ];
  }, [kpi]);

  // Transaksi buku besar & POS riil tersinkronisasi
  const transactions: TransactionRow[] = useMemo(() => {
    if (liveEntries.length > 0) {
      const avatars = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=60'
      ];
      return liveEntries.map((e, idx) => {
        const debitLine = e.lines?.find(l => l.debit > 0);
        const creditLine = e.lines?.find(l => l.credit > 0);
        const nominal = debitLine?.debit || creditLine?.credit || 0;
        return {
          id: e.id,
          refId: e.entry_number || e.id.slice(0, 8),
          name: e.description,
          accountRole: debitLine ? `${debitLine.account_name} (${debitLine.account_code})` : 'Buku Besar',
          nominal: nominal,
          status: 'Active' as const,
          date: e.entry_date ? new Date(e.entry_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Hari ini',
          department: (creditLine && creditLine.account_name) ? creditLine.account_name : 'Kas & Bank',
          avatarSeed: avatars[idx % avatars.length]
        };
      });
    }

    return [];
  }, [liveEntries]);

  // Filter pencarian
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.refId.toLowerCase().includes(q) || 
      t.accountRole.toLowerCase().includes(q) || 
      t.department.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  const filteredStaffList = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const q = searchQuery.toLowerCase();
    return staffList.filter(s => 
      s.full_name.toLowerCase().includes(q) || 
      s.phone_number.includes(q) || 
      s.role.toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. TOP BREADCRUMB + HERO GREETING + STAT PILLS + RADIAL GAUGE METER */}
      <CockpitHeroBanner
        tenant={tenant}
        formattedToday={formattedToday}
        kpi={kpi}
        staffList={staffList}
        onNavigate={onNavigate}
      />

      {/* 2. MIDDLE BENTO GRID (3 KARTU SEJAJAR) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(310px, 1.15fr) minmax(350px, 1.45fr) minmax(280px, 1fr)',
        gap: '16px',
        alignItems: 'stretch'
      }}>
        {/* CARD 1: Otomasi & Jadwal Operasional */}
        <CockpitTelemetryCard
          telemetryEvents={telemetryEvents}
          activeFilter={activeTelemetryFilter}
          onFilterChange={setActiveTelemetryFilter}
          onNavigate={onNavigate}
        />

        {/* CARD 2: Kinerja Likuiditas & Efisiensi Arus Kas */}
        <CockpitLiquidityCard
          kpi={kpi}
          onNavigate={onNavigate}
        />

        {/* CARD 3: Status Karyawan & Personel Shift */}
        <CockpitStaffCard
          staffList={staffList}
          onNavigate={onNavigate}
          onSelectStaffMode={() => setTableMode('STAFF')}
        />
      </div>

      {/* 3. BOTTOM BENTO CARD (DATA TABLE: STAFF & TRANSACTIONS) */}
      <CockpitTableCard
        tableMode={tableMode}
        onTableModeChange={setTableMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        staffList={staffList}
        filteredStaffList={filteredStaffList}
        transactions={transactions}
        filteredTransactions={filteredTransactions}
        liveEntriesCount={liveEntries.length}
        onNavigate={onNavigate}
      />

      {/* 4. ENTERPRISE QUICK LAUNCHPAD */}
      <CockpitQuickLaunch onNavigate={onNavigate} />

    </div>
  );
};
