import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Sparkles, 
  RefreshCw, 
  ShoppingBag, 
  PlusCircle,
  X,
  Trash2,
  Building2,
  Check
} from 'lucide-react';
import type { CommodityPriceBenchmark, CreateSupplierQuotePayload, NationalBenchmarkItem } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';

export const PriceBenchmarkView: React.FC = () => {
  const [commodities, setCommodities] = useState<CommodityPriceBenchmark[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityPriceBenchmark | null>(null);
  const [nationalBenchmarks, setNationalBenchmarks] = useState<NationalBenchmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Modal Tambah Kontrak Supplier
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    supplier_name: '',
    commodity_name: 'Beras Medium (IR 64)',
    unit: 'Kg',
    purchase_price: '',
    notes: ''
  });

  const fetchBenchmarks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, national] = await Promise.all([
        api.getCommodityBenchmarks(),
        api.getNationalBenchmarks()
      ]);
      setCommodities(data);
      setNationalBenchmarks(national);
      if (data && data.length > 0) {
        setSelectedCommodity(prev => prev ? (data.find(d => d.commodity === prev.commodity) || data[0]) : data[0]);
      } else {
        setSelectedCommodity(null);
      }
    } catch (err: any) {
      console.error('[PriceBenchmarkView] Gagal mengambil data benchmark:', err);
      setError('Gagal memuat indeks harga pasar dari basis data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmarks();
  }, []);


  const totalPotentialSavings = commodities.reduce((acc, c) => acc + (c.potentialMonthlySavings || 0), 0);

  const negotiationDraft = selectedCommodity
    ? `Halo ${selectedCommodity.supplierName}, selamat siang. Kami ingin menanyakan ketersediaan pasokan ${selectedCommodity.commodity}. Berdasarkan pantauan indeks harga grosir pasar terkini (${(selectedCommodity as any).source || 'Bapanas'}), harga acuan pasar berada di kisaran ${formatCurrency(selectedCommodity.marketMedianPrice)}/${selectedCommodity.unit}. Mengingat volume pesanan rutin kami, apakah memungkinkan untuk menyesuaikan harga beli agar kemitraan pasokan jangka panjang kita tetap kompetitif? Terima kasih banyak sebelumnya.`
    : '';

  const handleCopy = () => {
    if (!negotiationDraft) return;
    navigator.clipboard.writeText(negotiationDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(quoteForm.purchase_price.replace(/[^0-9]/g, ''));
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Masukkan harga beli yang valid.');
      return;
    }
    if (!quoteForm.supplier_name.trim()) {
      alert('Masukkan nama supplier.');
      return;
    }

    setIsSubmittingQuote(true);
    try {
      const payload: CreateSupplierQuotePayload = {
        supplier_name: quoteForm.supplier_name.trim(),
        commodity_name: quoteForm.commodity_name.trim(),
        unit: quoteForm.unit,
        purchase_price: priceNum,
        notes: quoteForm.notes.trim() || undefined
      };
      await api.createSupplierQuote(payload);
      setIsModalOpen(false);
      setQuoteForm({
        supplier_name: '',
        commodity_name: 'Beras Medium (IR 64)',
        unit: 'Kg',
        purchase_price: '',
        notes: ''
      });
      await fetchBenchmarks();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan penawaran supplier.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleDeleteQuote = async (id?: string, name?: string) => {
    if (!id) return;
    if (!window.confirm(`Hapus kontrak harga '${name}' dari daftar?`)) return;
    try {
      await api.deleteSupplierQuote(id);
      await fetchBenchmarks();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kontrak.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>B2B Supplier Price Intelligence</h2>
            <span className="badge badge-cyan">Ramp-Style Benchmarking</span>
            <span className="badge badge-emerald">
              <Building2 size={12} /> Bapanas & Pasar Induk PostgreSQL
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Mendeteksi kontrak bahan baku yang terlalu mahal (<em>overpriced</em>) dengan membandingkan harga beli Anda terhadap data indeks pasar grosir nasional secara anonim.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={14} />
            <span>Catat Penawaran Supplier</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchBenchmarks}
            disabled={isLoading}
            title="Muat Ulang Indeks Harga Pasar"
          >
            <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            <span>Sinkronisasi Pasar</span>
          </button>
          
          <div className="glass-panel" style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Potensi Penghematan Bulanan:</span>
            <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
              {formatCurrency(totalPotentialSavings)}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--rose-400)',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error}</span>
          <button className="btn btn-sm btn-outline" onClick={fetchBenchmarks}>Coba Lagi</button>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1.05fr', gap: '20px' }}>
        {/* Left: Commodities Benchmark Table */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
              Komparasi Bahan Baku vs Indeks Pasar Grosir
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {commodities.length} Bahan Terpantau
            </span>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--cyan-400)' }} />
              <span>Memuat perbandingan harga dari PostgreSQL...</span>
            </div>
          ) : commodities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <ShoppingBag size={36} style={{ opacity: 0.4, margin: '0 auto 8px auto', display: 'block' }} />
              <p>Belum ada bahan baku atau penawaran supplier yang tercatat.</p>
              <button className="btn btn-sm btn-outline" onClick={() => setIsModalOpen(true)}>
                + Catat Penawaran Supplier Pertama
              </button>
            </div>
          ) : (
            <div className="table-scroll-container" style={{ maxHeight: 'calc(100vh - 310px)', minHeight: '420px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead className="sticky-table-header">
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Bahan Baku & Pemasok</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Harga Beli</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Median Pasar</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Selisih</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {commodities.map((item, idx) => {
                    const isSelected = selectedCommodity?.commodity === item.commodity;
                    const isCustom = (item as any).isCustomQuote;
                    return (
                      <tr 
                        key={idx}
                        onClick={() => setSelectedCommodity(item)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(6, 182, 212, 0.1)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{item.commodity}</span>
                            {isCustom && <span className="badge badge-emerald" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>Kontrak Riil</span>}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.supplierName} • per {item.unit}
                          </div>
                        </td>
                        <td className="mono" style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: item.isOverpriced ? 'var(--rose-400)' : '#ffffff' }}>
                          {formatCurrency(item.userPurchasePrice)}
                        </td>
                        <td className="mono" style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatCurrency(item.marketMedianPrice)}
                        </td>
                        <td className="mono" style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: item.isOverpriced ? 'var(--rose-400)' : 'var(--emerald-400)' }}>
                          {item.discrepancyPercent > 0 ? `+${item.discrepancyPercent}%` : `${item.discrepancyPercent}%`}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span className={`badge ${item.isOverpriced ? 'badge-rose' : 'badge-emerald'}`}>
                            {item.isOverpriced ? 'OVERPRICED' : 'KOMPETITIF'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          {isCustom ? (
                            <button 
                              className="btn btn-sm btn-outline"
                              onClick={() => handleDeleteQuote((item as any).id, item.commodity)}
                              title="Hapus kontrak supplier ini"
                              style={{ padding: '4px', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--rose-400)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Katalog POS</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Negotiation Copilot & Intelligence Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '20px', alignSelf: 'start' }}>
          {/* Card Detail Selected */}
          {selectedCommodity && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Bahan Terpilih:</span>
                  <h4 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '2px 0 0 0' }}>{selectedCommodity.commodity}</h4>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Pemasok: {selectedCommodity.supplierName}
                  </div>
                </div>
                <span className={`badge ${selectedCommodity.isOverpriced ? 'badge-rose' : 'badge-emerald'}`}>
                  {selectedCommodity.isOverpriced ? 'Potensi Negosiasi' : 'Harga Wajar'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Harga Beli Anda:</div>
                  <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: selectedCommodity.isOverpriced ? 'var(--rose-400)' : '#ffffff' }}>
                    {formatCurrency(selectedCommodity.userPurchasePrice)}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Acuan Pasar Grosir:</div>
                  <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                    {formatCurrency(selectedCommodity.marketMedianPrice)}
                  </div>
                </div>
              </div>

              {selectedCommodity.isOverpriced && (
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  color: 'var(--rose-400)'
                }}>
                  Terdeteksi lebih mahal <strong>+{selectedCommodity.discrepancyPercent}%</strong> dari harga pasar. Potensi penghematan: <strong>{formatCurrency(selectedCommodity.potentialMonthlySavings)}</strong> / bulan.
                </div>
              )}
            </div>
          )}

          {/* AI Negotiation Copilot Box */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--cyan-400)" />
                <h4 style={{ fontSize: '0.98rem', color: '#ffffff', margin: 0 }}>
                  Draf Pesan Negosiasi AI ke Pemasok
                </h4>
              </div>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={handleCopy}
                disabled={!selectedCommodity}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
              >
                {copied ? <Check size={13} color="var(--emerald-400)" /> : <Copy size={13} />}
                <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '14px',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              minHeight: '110px'
            }}>
              {negotiationDraft || 'Pilih bahan baku di tabel sebelah kiri untuk membuat draf penyesuaian harga.'}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Kontrak Supplier */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={18} color="var(--cyan-400)" />
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>Catat Kontrak Penawaran Supplier</h3>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setIsModalOpen(false)}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Nama Supplier / Distributor *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: CV Makmur Pangan Jaya"
                  value={quoteForm.supplier_name}
                  onChange={(e) => setQuoteForm({ ...quoteForm, supplier_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-medium)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Nama Bahan Baku / Komoditas *
                </label>
                {nationalBenchmarks.length > 0 ? (
                  <select
                    value={quoteForm.commodity_name}
                    onChange={(e) => setQuoteForm({ ...quoteForm, commodity_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid var(--border-medium)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  >
                    {nationalBenchmarks.map((bm) => (
                      <option key={bm.id} value={bm.commodity_name}>
                        {bm.commodity_name} ({formatCurrency(bm.market_median_price)}/{bm.unit})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text"
                    required
                    value={quoteForm.commodity_name}
                    onChange={(e) => setQuoteForm({ ...quoteForm, commodity_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-medium)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Harga Beli per Satuan (Rp) *
                  </label>
                  <input 
                    type="number"
                    required
                    min="100"
                    placeholder="Contoh: 14500"
                    value={quoteForm.purchase_price}
                    onChange={(e) => setQuoteForm({ ...quoteForm, purchase_price: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-medium)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Satuan Ukuran
                  </label>
                  <input 
                    type="text"
                    value={quoteForm.unit}
                    onChange={(e) => setQuoteForm({ ...quoteForm, unit: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-medium)',
                      color: '#ffffff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Catatan Kontrak (Opsional)
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: Diskon 5% jika order > 100 kg"
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-medium)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingQuote}>
                  {isSubmittingQuote ? 'Menyimpan...' : 'Simpan Kontrak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
