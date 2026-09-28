import React from 'react';
import { Package, Edit2, Trash2, Sparkles } from 'lucide-react';
import type { POSProduct, POSCartItem } from '../../types';
import { formatCurrency } from '../../utils';

interface POSProductCardProps {
  product: POSProduct;
  inCart?: POSCartItem;
  onAddToCart: (p: POSProduct) => void;
  onEdit: (p: POSProduct, e: React.MouseEvent) => void;
  onDelete: (p: POSProduct, e: React.MouseEvent) => void;
  onOpenPricing?: (p: POSProduct, e: React.MouseEvent) => void;
}

export const POSProductCard: React.FC<POSProductCardProps> = ({
  product,
  inCart,
  onAddToCart,
  onEdit,
  onDelete,
  onOpenPricing
}) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        borderColor: inCart ? 'var(--emerald-500)' : 'var(--border-subtle)'
      }}
      onClick={() => onAddToCart(product)}
    >
      {inCart && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'var(--emerald-500)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '2px 8px',
          fontSize: '0.72rem',
          fontWeight: 800,
          zIndex: 2
        }}>
          {inCart.quantity}x
        </div>
      )}

      {/* Quick Edit/Delete/AI Pricing */}
      <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px', zIndex: 3 }}>
        {onOpenPricing && (
          <button
            type="button"
            title="AI Resep & Rekomendasi Harga Anti-Rugi"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPricing(product, e);
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(168, 85, 247, 0.6)',
              color: '#c084fc',
              borderRadius: '6px',
              padding: '4px 6px',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={12} />
          </button>
        )}
        <button
          type="button"
          title="Edit Produk"
          onClick={(e) => onEdit(product, e)}
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: 'var(--cyan-400)',
            borderRadius: '6px',
            padding: '4px 6px',
            cursor: 'pointer'
          }}
        >
          <Edit2 size={12} />
        </button>
        <button
          type="button"
          title="Hapus Produk"
          onClick={(e) => onDelete(product, e)}
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            borderRadius: '6px',
            padding: '4px 6px',
            cursor: 'pointer'
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Foto / Ilustrasi Produk */}
      <div style={{
        width: '100%',
        height: '110px',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px'
      }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Package size={36} color="var(--text-muted)" style={{ opacity: 0.6 }} />
        )}
      </div>

      {/* Metadata Produk */}
      <div>
        <span className="badge badge-cyan" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>
          {product.category}
        </span>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '2px 0 4px 0', color: '#ffffff' }}>
          {product.name}
        </h4>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          SKU: {product.sku} • Stok: {product.stock} {product.unit}
        </div>
      </div>

      {/* Harga & Tombol Tambah */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--emerald-400)' }}>
          {formatCurrency(product.price)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="btn btn-sm btn-outline"
          style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: 'var(--emerald-400)' }}
        >
          + Tambah
        </button>
      </div>
    </div>
  );
};
