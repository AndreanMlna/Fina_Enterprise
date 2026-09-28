import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  Edit2, 
  AlertCircle, 
  CheckCircle2,
  Trash2
} from 'lucide-react';
import type { POSProduct } from '../../types';

interface POSProductModalProps {
  isOpen: boolean;
  editingProduct: POSProduct | null;
  tenantName: string;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    sku?: string;
    category: string;
    price: number;
    cogs: number;
    stock: number;
    unit: string;
    image_url?: string;
  }) => Promise<void>;
  onDelete?: (product: POSProduct) => void;
  isSubmitting: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
}

export const POSProductModal: React.FC<POSProductModalProps> = ({
  isOpen,
  editingProduct,
  tenantName,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting,
  feedback
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [price, setPrice] = useState<number | ''>('');
  const [cogs, setCogs] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(50);
  const [unit, setUnit] = useState('Porsi');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setSku(editingProduct.sku);
      setCategory(editingProduct.category);
      setPrice(editingProduct.price);
      setCogs(editingProduct.cogs || 0);
      setStock(editingProduct.stock);
      setUnit(editingProduct.unit || 'Porsi');
      setImageUrl(editingProduct.image_url || '');
    } else {
      setName('');
      setSku('');
      setCategory('Makanan');
      setPrice('');
      setCogs('');
      setStock(50);
      setUnit('Porsi');
      setImageUrl('');
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      sku: sku.trim() || undefined,
      category: category.trim() || 'Umum',
      price: Number(price) || 0,
      cogs: Number(cogs) || 0,
      stock: Number(stock) || 0,
      unit: unit.trim() || 'Porsi',
      image_url: imageUrl.trim() || undefined
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(3, 7, 18, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.98))',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
              padding: '8px',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              {editingProduct ? <Edit2 size={20} color="var(--cyan-400)" /> : <PlusCircle size={20} color="var(--emerald-400)" />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {editingProduct ? 'Perbarui Produk & Stok' : 'Tambah Produk Baru ke Database'}
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Tenant: <strong style={{ color: 'var(--emerald-400)' }}>{tenantName}</strong> • PostgreSQL Multi-Tenant
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: feedback.type === 'success' ? '1px solid var(--emerald-500)' : '1px solid var(--rose-500)',
            color: feedback.type === 'success' ? 'var(--emerald-400)' : 'var(--rose-400)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Nama Produk */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Nama Produk / Menu *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Paket Ayam Bakar Madu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.86rem'
              }}
            />
          </div>

          {/* Baris 2: Kategori & SKU */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Kategori
              </label>
              <input
                type="text"
                placeholder="Makanan, Minuman, Sembako..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.86rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                SKU / Barcode (Opsional)
              </label>
              <input
                type="text"
                placeholder="Otomatis jika kosong"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.86rem'
                }}
              />
            </div>
          </div>

          {/* Baris 3: Harga Jual & HPP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Harga Jual (Rp) *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="25000"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 700
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                HPP / Biaya Modal (Rp)
              </label>
              <input
                type="number"
                min="0"
                placeholder="15000"
                value={cogs}
                onChange={(e) => setCogs(e.target.value === '' ? '' : Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.86rem'
                }}
              />
            </div>
          </div>

          {/* Baris 4: Stok Fisik & Satuan Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Stok Fisik Awal
              </label>
              <input
                type="number"
                min="0"
                placeholder="50"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 700
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Satuan Unit
              </label>
              <input
                type="text"
                placeholder="Porsi, Pcs, Kg, Botol..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.86rem'
                }}
              />
            </div>
          </div>

          {/* URL Foto */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              URL Gambar Produk (Opsional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.86rem'
              }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
            {editingProduct && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(editingProduct)}
                style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Hapus produk ini dari katalog tenant"
              >
                <Trash2 size={14} />
                <span>Hapus Produk</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: editingProduct ? 1 : 1,
                padding: '10px',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: editingProduct ? 1.5 : 2,
                padding: '10px',
                background: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-600))',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {isSubmitting ? 'Menyimpan ke Database...' : (editingProduct ? 'Simpan Perubahan' : 'Simpan Produk Baru')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
