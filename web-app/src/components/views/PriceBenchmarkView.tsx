import React, { useState } from 'react';
import { 
  Copy, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import type { CommodityPriceBenchmark } from '../../types';
import { sampleCommodities } from '../../data/mockData';

export const PriceBenchmarkView: React.FC = () => {
  const [commodities] = useState<CommodityPriceBenchmark[]>(sampleCommodities);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityPriceBenchmark>(sampleCommodities[0]);
  const [copied, setCopied] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalPotentialSavings = commodities.reduce((acc, c) => acc + c.potentialMonthlySavings, 0);

  const negotiationDraft = `Halo ${selectedCommodity.supplierName}, selamat siang. Kami dari Berkah Katering ingin menanyakan ketersediaan pasokan ${selectedCommodity.commodity}. Berdasarkan pantauan indeks harga grosir pasar minggu ini, harga acuan saat ini berada di kisaran ${formatCurrency(selectedCommodity.marketMedianPrice)}/${selectedCommodity.unit}. Mengingat volume pesanan rutin kami mencapai 60 unit per bulan, apakah memungkinkan untuk menyesuaikan harga beli kami agar kerja sama pasokan jangka panjang ini tetap kompetitif? Terima kasih banyak sebelumnya.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(negotiationDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>B2B Supplier Price Intelligence</h2>
            <span className="badge badge-cyan">Ramp-Style Benchmarking</span>
            <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} /> Data Agregasi Pasar Grosir
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Mendeteksi kontrak bahan baku yang terlalu mahal (*overpriced*) dengan membandingkan harga faktur Anda terhadap data harga pasar grosir agregat secara anonim.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '10px 18px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Potensi Penghematan Bulanan:</span>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
            {formatCurrency(totalPotentialSavings)}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Commodity Comparison Table */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
            Indeks Harga Pembelian vs Pasar Grosir
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Komoditas Bahan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Pemasok Saat Ini</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Harga Beli Anda</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Harga Median Pasar</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Selisih</th>
                </tr>
              </thead>
              <tbody>
                {commodities.map((c, idx) => {
                  const isSelected = selectedCommodity.commodity === c.commodity;
                  return (
                    <tr 
                      key={idx}
                      onClick={() => setSelectedCommodity(c)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: 600, color: '#ffffff' }}>
                        {c.commodity}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                        {c.supplierName}
                      </td>
                      <td className="mono" style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                        {formatCurrency(c.userPurchasePrice)} / {c.unit}
                      </td>
                      <td className="mono" style={{ padding: '12px', textAlign: 'right', color: 'var(--cyan-500)' }}>
                        {formatCurrency(c.marketMedianPrice)} / {c.unit}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {c.isOverpriced ? (
                          <span className="badge badge-rose">
                            +{c.discrepancyPercent}% Kemahalan
                          </span>
                        ) : (
                          <span className="badge badge-emerald">
                            Harga Wajar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: AI WhatsApp Negotiation Draft Generator */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--emerald-400)" />
              <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Draf Negosiasi WhatsApp</h3>
            </div>
            <span className="badge badge-indigo">Auto-Generated</span>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            fontSize: '0.8rem',
            color: '#e2e8f0',
            lineHeight: 1.6,
            fontFamily: 'var(--font-sans)',
            whiteSpace: 'pre-wrap'
          }}>
            {negotiationDraft}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Pemasok: <strong>{selectedCommodity.supplierName}</strong>
            </span>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleCopy}
            >
              <Copy size={14} />
              <span>{copied ? 'Tersalin!' : 'Salin Pesan WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
