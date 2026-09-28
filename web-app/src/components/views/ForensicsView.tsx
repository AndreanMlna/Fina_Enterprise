import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  FileCheck2, 
  Receipt,
  Scan,
  ShieldAlert,
  PlusCircle,
  X
} from 'lucide-react';
import type { ReceiptScan, AnalyzeReceiptPayload } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';

interface ExtendedReceiptScan extends ReceiptScan {
  dbRecordId?: string;
  status?: string;
}

export const ForensicsView: React.FC = () => {
  const [receipts, setReceipts] = useState<ExtendedReceiptScan[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ExtendedReceiptScan | null>(null);
  const [showElaHeatmap, setShowElaHeatmap] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [postSuccessMsg, setPostSuccessMsg] = useState<string | null>(null);

  // Modal Uji Nota Baru
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReceiptForm, setNewReceiptForm] = useState(() => ({
    merchant_name: 'UD Sumber Makmur Pasar Induk',
    receipt_number: `NOTA-PSR-${Date.now().toString().slice(-4)}`,
    item_1_name: 'Beras IR 64 (25 Kg)',
    item_1_price: '337500',
    item_2_name: 'Minyakita Pouch 1L (5 Pcs)',
    item_2_price: '77500',
    simulate_tamper: false
  }));

  const fetchReceipts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [forensicRecs, posReceipts] = await Promise.all([
        api.getForensicRecords(30),
        api.getPOSReceipts(15)
      ]);

      const forensicMapped: ExtendedReceiptScan[] = forensicRecs.map((fr) => ({
        id: fr.receipt_number,
        dbRecordId: fr.id,
        merchantName: fr.merchant_name,
        date: fr.transaction_date,
        items: fr.items.map(it => ({
          name: it.name,
          qty: it.qty,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal
        })),
        subtotal: fr.subtotal,
        tax: fr.tax_amount,
        total: fr.grand_total,
        elaIntegrityScore: fr.ela_integrity_score,
        isTampered: fr.is_tampered,
        tamperingDetails: fr.tampering_details || undefined,
        qrVerified: !fr.is_tampered,
        receiptType: 'GROSIR',
        status: fr.status
      }));

      const posMapped: ExtendedReceiptScan[] = posReceipts.map((r) => ({
        id: r.receipt_number,
        merchantName: r.tenant_name || 'FINA Enterprise Kasir',
        date: r.transaction_date,
        items: (r.items || []).map((it) => ({
          name: it.product_name,
          qty: it.quantity,
          unitPrice: it.unit_price,
          subtotal: it.subtotal
        })),
        subtotal: r.subtotal,
        tax: r.tax_pp55_estimated,
        total: r.grand_total,
        elaIntegrityScore: 100,
        isTampered: false,
        tamperingDetails: undefined,
        qrVerified: true,
        receiptType: 'MINIMARKET',
        status: 'POSTED_TO_LEDGER'
      }));

      const combined = [...forensicMapped, ...posMapped];
      setReceipts(combined);
      if (combined.length > 0) {
        setSelectedReceipt(prev => prev ? (combined.find(c => c.id === prev.id) || combined[0]) : combined[0]);
      } else {
        setSelectedReceipt(null);
      }
    } catch (err: any) {
      console.error('[ForensicsView] Gagal mengambil riwayat struk:', err);
      setError('Gagal memuat arsip transaksi struk nota dari basis data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handlePostToLedger = async () => {
    if (!selectedReceipt) return;
    if (selectedReceipt.isTampered) {
      alert('Dokumen ini terdeteksi manipulasi/tampered! Sistem melarang pembukuan nota bermasalah ke SAK EMKM.');
      return;
    }
    if (selectedReceipt.status === 'POSTED_TO_LEDGER') {
      alert('Dokumen ini sudah pernah dibukukan ke buku besar.');
      return;
    }
    if (!selectedReceipt.dbRecordId) {
      alert('Transaksi kasir POS sudah otomatis dibukukan saat checkout.');
      return;
    }

    setIsPosting(true);
    setPostSuccessMsg(null);
    try {
      const res = await api.postForensicToLedger(selectedReceipt.dbRecordId);
      setPostSuccessMsg(res.message);
      setTimeout(() => setPostSuccessMsg(null), 5000);
      await fetchReceipts();
    } catch (err: any) {
      alert(err.message || 'Gagal membukukan nota ke buku besar.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateAndAnalyzeReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = parseFloat(newReceiptForm.item_1_price.replace(/[^0-9]/g, '')) || 0;
    const p2 = parseFloat(newReceiptForm.item_2_price.replace(/[^0-9]/g, '')) || 0;
    const subtotal = p1 + p2;
    if (subtotal <= 0) {
      alert('Masukkan harga barang yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AnalyzeReceiptPayload = {
        receipt_number: newReceiptForm.receipt_number.trim(),
        merchant_name: newReceiptForm.merchant_name.trim(),
        subtotal: subtotal,
        tax_amount: 0,
        grand_total: subtotal,
        simulate_tamper: newReceiptForm.simulate_tamper,
        items: [
          { name: newReceiptForm.item_1_name, qty: 1, unitPrice: p1, subtotal: p1 },
          { name: newReceiptForm.item_2_name, qty: 1, unitPrice: p2, subtotal: p2 }
        ]
      };
      await api.analyzeForensicReceipt(payload);
      setIsModalOpen(false);
      setNewReceiptForm({
        merchant_name: 'UD Sumber Makmur Pasar Induk',
        receipt_number: `NOTA-PSR-${Date.now().toString().slice(-4)}`,
        item_1_name: 'Beras IR 64 (25 Kg)',
        item_1_price: '337500',
        item_2_name: 'Minyakita Pouch 1L (5 Pcs)',
        item_2_price: '77500',
        simulate_tamper: false
      });
      await fetchReceipts();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses nota.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveReceipt = selectedReceipt;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Studio Forensik */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Multimodal Receipt Forensics Studio</h2>
            <span className="badge badge-amber">Vision AI & Error Level Analysis (ELA)</span>
            <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <FileCheck2 size={12} /> Audit Kriptografis PostgreSQL
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Mendeteksi keaslian nota kasir & nota belanjaan pasar, memeriksa anomali piksel kompresi (ELA), dan memverifikasi rantai hash kriptografis SHA-256 Merkle Chaining di basis data.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={14} />
            <span>Uji & Unggah Nota Baru</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchReceipts}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            <span>Sinkronkan Struk</span>
          </button>
        </div>
      </div>

      {/* Post to Ledger Success Banner */}
      {postSuccessMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--emerald-400)',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{postSuccessMsg}</span>
        </div>
      )}

      {/* 2. Error Alert Banner */}
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
          <button className="btn btn-sm btn-outline" onClick={fetchReceipts}>Coba Lagi</button>
        </div>
      )}

      {/* 3. Selector Dokumen Struk & Kontrol Forensik */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Pilih Dokumen Struk / Nota:
          </span>
          {isLoading ? (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Memuat riwayat struk dari PostgreSQL...</span>
          ) : receipts.length === 0 ? (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Belum ada nota tersimpan.</span>
          ) : (
            receipts.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedReceipt(r);
                  setShowElaHeatmap(false);
                }}
                className={`btn btn-sm ${selectedReceipt?.id === r.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Scan size={13} />
                <span>{r.id} ({r.merchantName})</span>
                {r.isTampered && <span className="badge badge-rose" style={{ fontSize: '0.6rem', padding: '0 4px' }}>Tampered</span>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 4. Tampilan Kerja Forensik Ganda */}
      {effectiveReceipt ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '20px' }}>
          {/* Panel Kiri: Visual Dokumen Struk Termal & Heatmap ELA */}
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
                <span>{showElaHeatmap ? 'Tampilkan Kertas Asli' : 'Aktifkan Mode ELA Forensics'}</span>
              </button>
            </div>

            {/* Simulasi Kertas Termal Dokumen */}
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
              {/* Header Struk */}
              <div style={{ textAlign: 'center', borderBottom: `1px dashed ${showElaHeatmap ? '#ec4899' : '#94a3b8'}`, paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{effectiveReceipt.merchantName}</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>No: {effectiveReceipt.id} • Tgl: {effectiveReceipt.date}</div>
              </div>

              {/* Rincian Barang Belanjaan */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {effectiveReceipt.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{it.name} x{it.qty}</span>
                    <span>{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Total Belanja */}
              <div style={{ borderTop: `1px dashed ${showElaHeatmap ? '#ec4899' : '#94a3b8'}`, paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span>TOTAL:</span>
                  <span style={{ 
                    background: showElaHeatmap && effectiveReceipt.isTampered ? '#f43f5e' : 'transparent',
                    color: showElaHeatmap && effectiveReceipt.isTampered ? '#ffffff' : 'inherit',
                    padding: showElaHeatmap && effectiveReceipt.isTampered ? '2px 6px' : '0',
                    borderRadius: '4px'
                  }}>
                    {formatCurrency(effectiveReceipt.total)}
                  </span>
                </div>
              </div>

              {showElaHeatmap && effectiveReceipt.isTampered && (
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
                  HIGH FREQ RESIDUAL NOISE DETECTED
                </div>
              )}
            </div>
          </div>

          {/* Panel Kanan: Diagnostik Integritas Forensik */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>
                Hasil Audit Digital Forensik
              </h3>
              <span className={`badge ${effectiveReceipt.isTampered ? 'badge-rose' : 'badge-emerald'}`}>
                {effectiveReceipt.isTampered ? 'DOKUMEN TIDAK VALID / MANIPULASI' : 'DOKUMEN ASLI TERVERIFIKASI'}
              </span>
            </div>

            {/* Skor Integritas ELA */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Skor Integritas Piksel (ELA Score):</div>
                <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: effectiveReceipt.isTampered ? 'var(--rose-400)' : 'var(--emerald-400)' }}>
                  {effectiveReceipt.elaIntegrityScore} / 100
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${effectiveReceipt.qrVerified ? 'badge-emerald' : 'badge-rose'}`}>
                  {effectiveReceipt.qrVerified ? '✓ QRIS Merchant Sah' : '✗ QR Anomali'}
                </span>
              </div>
            </div>

            {/* Detail Anomali jika Tampered */}
            {effectiveReceipt.isTampered && effectiveReceipt.tamperingDetails && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                fontSize: '0.82rem',
                color: 'var(--rose-400)',
                display: 'flex',
                gap: '10px'
              }}>
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Peringatan Pemalsuan Dokumen:</strong>
                  {effectiveReceipt.tamperingDetails}
                </div>
              </div>
            )}

            {/* Status SAK EMKM */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '14px',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status Pembukuan:</span>
                <span style={{ fontWeight: 600, color: effectiveReceipt.status === 'POSTED_TO_LEDGER' ? 'var(--emerald-400)' : '#ffffff' }}>
                  {effectiveReceipt.status === 'POSTED_TO_LEDGER' ? 'Sudah Tercatat di SAK EMKM' : 'Menunggu Verifikasi Buku Besar'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Audit Merkle Hash:</span>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {effectiveReceipt.id.slice(0, 14)}...
                </span>
              </div>
            </div>

            {/* Tombol Bukukan ke Ledger */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
              <button 
                className="btn btn-primary"
                disabled={effectiveReceipt.isTampered || effectiveReceipt.status === 'POSTED_TO_LEDGER' || isPosting}
                onClick={handlePostToLedger}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Sparkles size={15} />
                <span>
                  {isPosting ? 'Membukukan...' : effectiveReceipt.isTampered ? 'Ditolak Otomatis oleh Sistem' : effectiveReceipt.status === 'POSTED_TO_LEDGER' ? 'Sudah Terverifikasi di Buku Besar' : 'Bukukan ke Buku Besar SAK EMKM'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div style={{
          padding: '60px 24px',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Receipt size={48} color="var(--text-muted)" />
          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', margin: 0 }}>Belum Ada Struk / Nota Tersimpan</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', lineHeight: 1.5, margin: 0 }}>
            Lakukan penjualan di kasir POS atau unggah nota belanjaan bahan baku pasar Anda. Sistem akan memverifikasi integritas dokumen melalui algoritma ELA dan mencatatnya ke PostgreSQL.
          </p>
          <button className="btn btn-sm btn-primary" onClick={() => setIsModalOpen(true)}>
            + Uji & Unggah Nota Pertama
          </button>
        </div>
      )}

      {/* Modal Uji Nota Baru */}
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
            maxWidth: '480px',
            padding: '24px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck2 size={18} color="var(--cyan-400)" />
                <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>Uji Dokumen Nota Baru</h3>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setIsModalOpen(false)}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateAndAnalyzeReceipt} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Nama Toko / Penjual Pasar *
                </label>
                <input 
                  type="text"
                  required
                  value={newReceiptForm.merchant_name}
                  onChange={(e) => setNewReceiptForm({ ...newReceiptForm, merchant_name: e.target.value })}
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
                  Nomor Struk / Nota *
                </label>
                <input 
                  type="text"
                  required
                  value={newReceiptForm.receipt_number}
                  onChange={(e) => setNewReceiptForm({ ...newReceiptForm, receipt_number: e.target.value })}
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

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rincian Barang Belanjaan:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px', marginTop: '6px' }}>
                  <input 
                    type="text"
                    placeholder="Nama Barang 1"
                    value={newReceiptForm.item_1_name}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, item_1_name: e.target.value })}
                    style={{ padding: '6px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-medium)', color: '#ffffff', fontSize: '0.82rem' }}
                  />
                  <input 
                    type="number"
                    placeholder="Subtotal (Rp)"
                    value={newReceiptForm.item_1_price}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, item_1_price: e.target.value })}
                    style={{ padding: '6px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-medium)', color: '#ffffff', fontSize: '0.82rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px', marginTop: '6px' }}>
                  <input 
                    type="text"
                    placeholder="Nama Barang 2"
                    value={newReceiptForm.item_2_name}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, item_2_name: e.target.value })}
                    style={{ padding: '6px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-medium)', color: '#ffffff', fontSize: '0.82rem' }}
                  />
                  <input 
                    type="number"
                    placeholder="Subtotal (Rp)"
                    value={newReceiptForm.item_2_price}
                    onChange={(e) => setNewReceiptForm({ ...newReceiptForm, item_2_price: e.target.value })}
                    style={{ padding: '6px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-medium)', color: '#ffffff', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="checkbox"
                  id="tamper_check"
                  checked={newReceiptForm.simulate_tamper}
                  onChange={(e) => setNewReceiptForm({ ...newReceiptForm, simulate_tamper: e.target.checked })}
                  style={{ accentColor: 'var(--rose-500)', width: '16px', height: '16px' }}
                />
                <label htmlFor="tamper_check" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Simulasikan anomali piksel kompresi (Modus Uji ELA Fraud Detection)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menganalisis...' : 'Analisis & Simpan ke DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
