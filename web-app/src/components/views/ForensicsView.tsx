import React, { useState } from 'react';
import { 
  AlertOctagon, 
  CheckCircle, 
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import type { ReceiptScan } from '../../types';
import { sampleReceipts } from '../../data/mockData';

export const ForensicsView: React.FC = () => {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptScan>(sampleReceipts[0]);
  const [showElaHeatmap, setShowElaHeatmap] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Multimodal Receipt Forensics Studio</h2>
          <span className="badge badge-amber">Vision AI & Error Level Analysis (ELA)</span>
          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> Mode Demo Vision OCR
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Mendeteksi pemalsuan nota belanja, manipulasi piksel angka, serta mengekstraksi daftar belanjaan secara terstruktur ke buku besar.
        </p>
      </div>

      {/* Select Receipt Presets */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Pilih Sampel Dokumen Nota:
        </span>
        {sampleReceipts.map((r) => (
          <button
            key={r.id}
            onClick={() => {
              setSelectedReceipt(r);
              setShowElaHeatmap(false);
            }}
            className={`btn btn-sm ${selectedReceipt.id === r.id ? 'btn-primary' : 'btn-secondary'}`}
          >
            {r.isTampered ? '⚠️ ' : '✅ '} {r.merchantName} ({r.isTampered ? 'Manipulasi' : 'Asli'})
          </button>
        ))}
      </div>

      {/* Main Forensics Dual-View Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '20px' }}>
        {/* Left: Receipt Visual & Forensics Inspector */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
              Visual Dokumen & Heatmap ELA
            </h3>
            <button 
              className={`btn btn-sm ${showElaHeatmap ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setShowElaHeatmap(!showElaHeatmap)}
            >
              <Layers size={14} />
              <span>{showElaHeatmap ? 'Tampilkan Nota Asli' : 'Aktifkan Mode ELA Forensics'}</span>
            </button>
          </div>

          {/* Simulated Thermal/Paper Receipt */}
          <div style={{
            background: showElaHeatmap ? '#050209' : '#ffffff',
            color: showElaHeatmap ? '#ec4899' : '#0f172a',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            border: showElaHeatmap ? '2px dashed #f43f5e' : '1px solid #cbd5e1',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            position: 'relative',
            transition: 'all 0.3s ease'
          }}>
            {/* Header Nota */}
            <div style={{ textAlign: 'center', borderBottom: `1px dashed ${showElaHeatmap ? '#ec4899' : '#94a3b8'}`, paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedReceipt.merchantName}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Tanggal: {selectedReceipt.date} • Kasir: #04</div>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {selectedReceipt.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{it.name} x{it.qty}</span>
                  <span>{formatCurrency(it.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Total Section */}
            <div style={{ borderTop: `1px dashed ${showElaHeatmap ? '#ec4899' : '#94a3b8'}`, paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
                <span>TOTAL:</span>
                <span style={{ 
                  background: showElaHeatmap && selectedReceipt.isTampered ? '#f43f5e' : 'transparent',
                  color: showElaHeatmap && selectedReceipt.isTampered ? '#ffffff' : 'inherit',
                  padding: showElaHeatmap && selectedReceipt.isTampered ? '2px 6px' : '0',
                  borderRadius: '4px'
                }}>
                  {formatCurrency(selectedReceipt.total)}
                </span>
              </div>
            </div>

            {showElaHeatmap && selectedReceipt.isTampered && (
              <div style={{
                position: 'absolute',
                bottom: '18px',
                right: '18px',
                background: 'rgba(244, 63, 94, 0.9)',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 700
              }}>
                [!] ELA RESIDUAL NOISE DETECTED (+420%)
              </div>
            )}
          </div>
        </div>

        {/* Right: OCR Entity Extraction & Verification Status */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
              Hasil Analisis & Verifikasi Integritas
            </h3>
            <span className={`badge ${selectedReceipt.isTampered ? 'badge-rose' : 'badge-emerald'}`}>
              Skor Integritas: {selectedReceipt.elaIntegrityScore}%
            </span>
          </div>

          {/* Status Alert */}
          {selectedReceipt.isTampered ? (
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <AlertOctagon size={20} color="var(--rose-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--rose-500)', marginBottom: '2px' }}>
                  PERINGATAN: DOKUMEN TERINDIKASI PALSU / DIUBAH
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {selectedReceipt.tamperingDetails}
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle size={20} color="var(--emerald-400)" />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                  DOKUMEN ASLI & VALID
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  QR Code merchant terverifikasi dan tidak ditemukan anomali kompresi piksel.
                </div>
              </div>
            </div>
          )}

          {/* Parsed Line Items Table */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Ekstraksi Baris Barang (OCR Multimodal):
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <tbody>
                {selectedReceipt.items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', color: '#ffffff' }}>{it.name}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>x{it.qty}</td>
                    <td className="mono" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--emerald-400)' }}>
                      {formatCurrency(it.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
            <button 
              className={`btn ${selectedReceipt.isTampered ? 'btn-danger' : 'btn-primary'}`}
              disabled={selectedReceipt.isTampered}
              onClick={() => alert(`Transaksi ${selectedReceipt.merchantName} berhasil dibukukan ke Buku Besar!`)}
            >
              <Sparkles size={15} />
              <span>{selectedReceipt.isTampered ? 'Ditolak Otomatis oleh Sistem' : 'Setujui & Bukukan ke Buku Besar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
