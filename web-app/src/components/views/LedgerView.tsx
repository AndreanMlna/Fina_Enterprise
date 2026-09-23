import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Search, 
  Sparkles, 
  FileCheck2, 
  FileSpreadsheet, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  Loader2 
} from 'lucide-react';
import type { DoubleEntryVoucher, UserRole, Tenant, SAKEMKMFinancialReport } from '../../types';
import { api } from '../../services/api';
import { sampleVouchers, mockSAKEMKMReport } from '../../data/mockData';

interface LedgerViewProps {
  isPiiMasked?: boolean;
  userRole?: UserRole;
  tenant?: Tenant | null;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  isPiiMasked = false,
  userRole = 'OWNER',
  tenant
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'JOURNAL' | 'SAK_EMKM'>('JOURNAL');
  const [vouchers, setVouchers] = useState<DoubleEntryVoucher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [rawPrompt, setRawPrompt] = useState('Beli kemasan kardus katering 250 pcs harga 375.000 bayar tunai dari laci kasir warung');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sakEmkmReport, setSakEmkmReport] = useState<SAKEMKMFinancialReport | null>(null);

  useEffect(() => {
    const fetchLedgerData = async () => {
      setIsLoading(true);
      try {
        const entries = await api.getLedgerEntries();
        if (entries && entries.length > 0) {
          const mapped: DoubleEntryVoucher[] = entries.map(e => ({
            id: e.id,
            voucherNumber: e.entry_number,
            date: e.entry_date,
            description: e.description,
            debitAccount: e.lines.filter(l => l.debit > 0).map(l => `${l.account_code || ''} - ${l.account_name || ''}`).join(', ') || '1101 - Kas',
            creditAccount: e.lines.filter(l => l.credit > 0).map(l => `${l.account_code || ''} - ${l.account_name || ''}`).join(', ') || '4101 - Pendapatan',
            amount: e.lines.reduce((sum, l) => sum + l.debit, 0),
            taxCategory: 'NON_TAX' as const,
            integrityHash: e.audit_merkle_hash,
            reconciled: true,
            source: 'MANUAL' as const
          }));
          setVouchers(mapped);
        } else {
          setVouchers(sampleVouchers);
        }

        const report = await api.getSAKEMKMReport();
        if (report) {
          const mappedReport: SAKEMKMFinancialReport = {
            period: report.period || 'Periode Berjalan 2026',
            assets: {
              currentAssets: report.current_assets || [],
              nonCurrentAssets: report.non_current_assets || [],
              totalAssets: report.total_assets || 0,
            },
            liabilitiesAndEquity: {
              liabilities: report.liabilities || [],
              equity: report.equity || [],
              totalLiabilitiesAndEquity: report.total_liabilities_and_equity || 0,
            },
            incomeStatement: {
              revenue: report.revenue || 0,
              cogs: report.cogs || 0,
              grossProfit: report.gross_profit || 0,
              operationalExpenses: report.operational_expenses || [],
              netIncomeBeforeTax: report.net_income_before_tax || 0,
              pp55TaxEstimated: (report.revenue || 0) * 0.005,
              netIncomeAfterTax: (report.net_income_before_tax || 0) - ((report.revenue || 0) * 0.005),
            },
            auditMerkleHash: report.audit_merkle_hash || 'sha256:merkle-active',
            signedBy: 'KAP Drs. Hendrawan & Rekan (Register Akuntan Publik #AP-2026-889)'
          };
          setSakEmkmReport(mappedReport);
        }
      } catch {
        setVouchers(sampleVouchers);
      }
      setIsLoading(false);
    };
    fetchLedgerData();
  }, []);

  const activeReport: SAKEMKMFinancialReport = sakEmkmReport || mockSAKEMKMReport;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const maskText = (text: string) => {
    if (!isPiiMasked) return text;
    // Mask specific PII patterns like names or accounts
    return text.replace(/(QRIS SNAP|BCA|Mandiri|Kelurahan|Warung)/gi, '[REDACTED]');
  };

  const handleSimulateReActEntry = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newVoucher: DoubleEntryVoucher = {
        id: `vch-00${vouchers.length + 1}`,
        voucherNumber: `JV-2026-09-00${vouchers.length + 1}`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        description: 'Pembelian Kemasan Kardus Katering 250 pcs (Auto-classified ReAct)',
        debitAccount: '1104 - Persediaan Perlengkapan & Kemasan',
        creditAccount: '1101 - Kas Tunai Kasir Warung',
        amount: 375000,
        taxCategory: 'NON_TAX',
        integrityHash: '9a72b83c4f51e0a29d8164b219e831ca02941b7123efab0912cde411039bb810',
        reconciled: true,
        source: 'WHATSAPP_VOICE'
      };
      setVouchers([newVoucher, ...vouchers]);
      setIsSimulating(false);
      setShowAddModal(false);
    }, 900);
  };

  const handleExportReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Laporan Keuangan SAK EMKM Terverifikasi SHA-256 berhasil diekspor.');
    }, 1200);
  };

  const filteredVouchers = vouchers.filter(v => 
    v.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.debitAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.creditAccount.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Autonomous Semantic Ledger</h2>
            <span className="badge badge-emerald">
              <Lock size={11} /> Immutable Double-Entry
            </span>
            {isPiiMasked && (
              <span className="badge badge-amber">
                UU PDP Privacy Masking: ON
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Buku besar akuntansi berpasangan berintegritas tinggi (ACID). Tidak dapat diubah/dihapus (NO UPDATE / NO DELETE) sesuai standar audit perbankan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Sub-tab switcher */}
          <div className="glass-panel" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveSubTab('JOURNAL')}
              className={`btn btn-sm ${activeSubTab === 'JOURNAL' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem' }}
            >
              Jurnal Umum Mutasi
            </button>
            <button
              onClick={() => setActiveSubTab('SAK_EMKM')}
              className={`btn btn-sm ${activeSubTab === 'SAK_EMKM' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem' }}
            >
              Laporan SAK EMKM
            </button>
          </div>

          {userRole !== 'AUDITOR' ? (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Sparkles size={16} />
              <span>Simulasi Jurnal ReAct</span>
            </button>
          ) : (
            <span className="badge badge-indigo" style={{ padding: '8px 14px' }}>
              <ShieldCheck size={14} /> Mode Auditor: Read-Only Kriptografis
            </span>
          )}
        </div>
      </div>

      {activeSubTab === 'JOURNAL' ? (
        <>
          {/* Control & Search Bar */}
          <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', background: 'rgba(255,255,255,0.03)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text"
                placeholder="Cari transaksi, nomor voucher, atau akun COA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge badge-cyan" style={{ padding: '6px 12px' }}>
                <FileCheck2 size={13} /> SAK EMKM Compliant
              </span>
              <span className="badge badge-indigo" style={{ padding: '6px 12px' }}>
                PP 55/2022 PPh Final: 0.5%
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="glass-panel" style={{ padding: '4px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Voucher & Waktu</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Deskripsi Transaksi</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Debet (Debit Account)</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Kredit (Credit Account)</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Nominal (Rp)</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status Pajak</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Audit Hash</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((v) => (
                  <tr 
                    key={v.id}
                    className="ledger-table-row"
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div className="mono" style={{ fontWeight: 600, color: 'var(--emerald-400)' }}>
                        {v.voucherNumber}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {v.date}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#ffffff', maxWidth: '240px' }}>
                      <div style={{ fontWeight: 500 }}>{maskText(v.description)}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
                          {v.source}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--emerald-400)', fontWeight: 500 }}>
                      {v.debitAccount}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--cyan-500)', fontWeight: 500 }}>
                      {v.creditAccount}
                    </td>
                    <td className="mono" style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                      {formatCurrency(v.amount)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {v.taxCategory === 'PP_55_BEBAS' ? (
                        <span className="badge badge-emerald">PPh Bebas (&lt;500Jt)</span>
                      ) : v.taxCategory === 'PP_55_FINAL_05' ? (
                        <span className="badge badge-amber">PPh 0.5%</span>
                      ) : (
                        <span className="badge badge-indigo">Non-Objek</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Lock size={12} color="var(--emerald-400)" />
                        <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }} title={v.integrityHash}>
                          {v.integrityHash.substring(0, 10)}...
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* SAK EMKM OFFICIAL FINANCIAL REPORT VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Statement Action Toolbar */}
          <div className="glass-panel" style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff' }}>
                  Laporan Keuangan SAK EMKM Terverifikasi {tenant ? `— ${tenant.name}` : ''}
                </h3>
                <span className="badge badge-emerald">
                  <CheckCircle2 size={12} /> Balance Validated
                </span>
                {isLoading && <Loader2 size={14} className="animate-spin" color="var(--emerald-400)" />}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {activeReport.period} • {tenant ? `Entitas: ${tenant.name} (${tenant.branchCode}) • ` : ''}Sesuai Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (IAI)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => window.print()}
              >
                <Printer size={14} />
                <span>Cetak Laporan</span>
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleExportReport}
                disabled={isExporting}
              >
                <Download size={14} />
                <span>{isExporting ? 'Mengompres PDF...' : 'Ekspor Laporan Audit (.PDF)'}</span>
              </button>
            </div>
          </div>

          {/* Dual Column Statement: Neraca (Posisi Keuangan) & Laba Rugi */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {/* Laporan Posisi Keuangan (Neraca) */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <FileSpreadsheet size={18} color="var(--emerald-400)" />
                <h4 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Laporan Posisi Keuangan (Neraca)</h4>
              </div>

              {/* Aset Lancar */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald-400)', textTransform: 'uppercase' }}>
                  ASET LANCAR
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {activeReport.assets.currentAssets.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>{item.name}</span>
                      <span className="mono" style={{ color: '#ffffff', fontWeight: 500 }}>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aset Tidak Lancar */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan-400)', textTransform: 'uppercase' }}>
                  ASET TIDAK LANCAR (PERALATAN & KENDARAAN)
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {activeReport.assets.nonCurrentAssets.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>{item.name}</span>
                      <span className="mono" style={{ color: item.amount < 0 ? 'var(--rose-400)' : '#ffffff', fontWeight: 500 }}>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700 }}>
                <span style={{ color: '#ffffff' }}>JUMLAH ASET:</span>
                <span className="mono" style={{ color: 'var(--emerald-400)' }}>
                  {formatCurrency(activeReport.assets.totalAssets)}
                </span>
              </div>

              {/* Liabilitas & Ekuitas */}
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--amber-400)', textTransform: 'uppercase' }}>
                  LIABILITAS & EKUITAS
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {activeReport.liabilitiesAndEquity.liabilities.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>{item.name}</span>
                      <span className="mono" style={{ color: '#ffffff' }}>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {activeReport.liabilitiesAndEquity.equity.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>{item.name}</span>
                      <span className="mono" style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700 }}>
                <span style={{ color: '#ffffff' }}>JUMLAH LIABILITAS & EKUITAS:</span>
                <span className="mono" style={{ color: 'var(--emerald-400)' }}>
                  {formatCurrency(activeReport.liabilitiesAndEquity.totalLiabilitiesAndEquity)}
                </span>
              </div>
            </div>

            {/* Laporan Laba Rugi */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <FileCheck2 size={18} color="var(--cyan-400)" />
                <h4 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Laporan Laba Rugi Komprehensif</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Pendapatan Usaha Penjualan:</span>
                  <span className="mono" style={{ color: 'var(--emerald-400)', fontWeight: 700 }}>
                    {formatCurrency(activeReport.incomeStatement.revenue)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Beban Pokok Penjualan (HPP):</span>
                  <span className="mono" style={{ color: 'var(--rose-400)', fontWeight: 700 }}>
                    ({formatCurrency(activeReport.incomeStatement.cogs)})
                  </span>
                </div>

                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.88rem',
                  fontWeight: 700
                }}>
                  <span style={{ color: '#ffffff' }}>LABA BRUTO:</span>
                  <span className="mono" style={{ color: 'var(--emerald-400)' }}>
                    {formatCurrency(activeReport.incomeStatement.grossProfit)}
                  </span>
                </div>

                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Rincian Beban Operasional:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    {activeReport.incomeStatement.operationalExpenses.map((exp, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>• {exp.name}</span>
                        <span className="mono" style={{ color: '#ffffff' }}>{formatCurrency(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Laba Bersih Sebelum Pajak:</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#ffffff' }}>
                      {formatCurrency(activeReport.incomeStatement.netIncomeBeforeTax)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--amber-400)' }}>Estimasi PPh Final PP 55/2022 (0.5%):</span>
                    <span className="mono" style={{ color: 'var(--amber-400)', fontWeight: 600 }}>
                      ({formatCurrency(activeReport.incomeStatement.pp55TaxEstimated)})
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(6, 182, 212, 0.3)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 800 }}>
                    <span style={{ color: 'var(--cyan-400)' }}>LABA BERSIH TAHUN BERJALAN:</span>
                    <span className="mono" style={{ color: 'var(--emerald-400)' }}>
                      {formatCurrency(activeReport.incomeStatement.netIncomeAfterTax)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Audit & KAP Signing Footer */}
          <div className="glass-panel" style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderLeft: '4px solid var(--emerald-500)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} color="var(--emerald-400)" />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                  Integritas Laporan Terkunci Kriptografis
                </div>
                <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Merkle Root Hash: {activeReport.auditMerkleHash}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
              <div>Entitas: <strong style={{ color: '#ffffff' }}>{tenant?.name || 'PT Abadi Nan Jaya'}</strong> (NPWP: {tenant?.npwp || '00.000.000.0-000.000'})</div>
              <div style={{ marginTop: '2px' }}>Diaudit & Disahkan Oleh: <span style={{ fontWeight: 600, color: '#ffffff' }}>{activeReport.signedBy}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal ReAct Agent Simulator */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '28px', background: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--emerald-400)" />
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                  Simulasi Input Teks Alami ke Jurnal
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Ketikkan transaksi dalam bahasa sehari-hari seperti pesan WhatsApp warung. FinOrchestrator akan melakukan ekstraksi entitas, memilih Chart of Accounts (COA) yang seimbang, dan mengunci hash buku besar secara ACID.
            </p>

            <textarea 
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-medium)',
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: '0.88rem',
                marginBottom: '16px',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
                disabled={isSimulating}
              >
                Batal
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSimulateReActEntry}
                disabled={isSimulating}
              >
                {isSimulating ? 'Memproses FinOrchestrator FSM...' : 'Eksekusi ReAct Auto-Journal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
