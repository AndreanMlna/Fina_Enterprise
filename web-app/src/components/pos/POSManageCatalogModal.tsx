import React from 'react';
import { 
  Settings, 
  PlusCircle, 
  X, 
  Package, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import type { POSProduct } from '../../types';

interface POSManageCatalogModalProps {
  isOpen: boolean;
  products: POSProduct[];
  tenantName: string;
  onClose: () => void;
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: POSProduct) => void;
  onDeleteProduct: (product: POSProduct) => void;
  onQuickStockAdjust: (product: POSProduct, delta: number) => void;
}

export const POSManageCatalogModal: React.FC<POSManageCatalogModalProps> = ({
  isOpen,
  products,
  tenantName,
  onClose,
  onOpenAddProduct,
  onOpenEditProduct,
  onDeleteProduct,
  onQuickStockAdjust
}) => {
  if (!isOpen) return null;

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
        maxWidth: '840px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(8, 14, 28, 0.98))',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} color="var(--cyan-400)" />
              Manajemen Katalog & Stok Tenant
            </h2>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tenant: <strong style={{ color: 'var(--cyan-400)' }}>{tenantName}</strong> • Total {products.length} Produk di PostgreSQL
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddProduct();
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <PlusCircle size={14} />
              <span>+ Tambah Produk</span>
            </button>

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
        </div>

        {/* Tabel Produk */}
        <div className="table-scroll-container" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead className="sticky-table-header">
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Produk</th>
                <th style={{ padding: '10px 8px' }}>Kategori</th>
                <th style={{ padding: '10px 8px' }}>Harga Jual</th>
                <th style={{ padding: '10px 8px' }}>HPP</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Penyesuaian Stok</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Belum ada produk terdaftar untuk unit usaha ini. Klik "+ Tambah Produk" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: 'rgba(15, 23, 42, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Package size={16} color="var(--text-muted)" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{prod.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prod.sku}</div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--cyan-400)' }}>{prod.category}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--emerald-400)' }}>
                      Rp {prod.price.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                      Rp {(prod.cogs || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => onQuickStockAdjust(prod, -1)}
                          disabled={prod.stock <= 0}
                          style={{
                            padding: '3px 8px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            cursor: prod.stock <= 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          -1
                        </button>
                        <span style={{ minWidth: '55px', textAlign: 'center', fontWeight: 700, color: '#ffffff' }}>
                          {prod.stock} {prod.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => onQuickStockAdjust(prod, 1)}
                          style={{
                            padding: '3px 8px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: 'var(--emerald-400)',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                          }}
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickStockAdjust(prod, 5)}
                          style={{
                            padding: '3px 8px',
                            background: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: 'var(--cyan-400)',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                          }}
                        >
                          +5
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenEditProduct(prod);
                          }}
                          style={{
                            padding: '5px 8px',
                            background: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: 'var(--cyan-400)',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod)}
                          style={{
                            padding: '5px 8px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
