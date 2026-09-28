import React from 'react';
import {
  ShoppingCart,
  RotateCcw,
  User,
  Phone,
  Minus,
  Plus,
  Trash2,
  Banknote,
  QrCode,
  AlertTriangle,
  Receipt,
  ArrowRight
} from 'lucide-react';
import type { POSCartItem } from '../../types';
import { formatCurrency } from '../../utils';

interface POSCartPanelProps {
  cart: POSCartItem[];
  customerName: string;
  customerPhone: string;
  onCustomerNameChange: (val: string) => void;
  onCustomerPhoneChange: (val: string) => void;
  onClearCart: () => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  subtotal: number;
  taxPP55Estimated: number;
  grandTotal: number;
  paymentMethod: 'CASH' | 'QRIS';
  onPaymentMethodChange: (method: 'CASH' | 'QRIS') => void;
  cashTendered: number;
  onCashTenderedChange: (val: number) => void;
  changeAmount: number;
  isCashInsufficient: boolean;
  isProcessing: boolean;
  errorMessage: string | null;
  onCheckout: () => void;
}

export const POSCartPanel: React.FC<POSCartPanelProps> = ({
  cart,
  customerName,
  customerPhone,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onClearCart,
  onUpdateQuantity,
  onRemoveItem,
  subtotal,
  taxPP55Estimated,
  grandTotal,
  paymentMethod,
  onPaymentMethodChange,
  cashTendered,
  onCashTenderedChange,
  changeAmount,
  isCashInsufficient,
  isProcessing,
  errorMessage,
  onCheckout
}) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'sticky',
        top: '20px',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={18} color="var(--emerald-400)" />
          Keranjang Transaksi
        </h3>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--rose-400)',
              fontSize: '0.76rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Form Pembeli */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            Nama Pelanggan
          </label>
          <div style={{ position: 'relative' }}>
            <User size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Pelanggan Umum"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px 6px 26px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.78rem'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            WhatsApp Nota (Opsional)
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="tel"
              placeholder="0812xxxx"
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px 6px 26px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.78rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Daftar Item Keranjang */}
      <div style={{
        minHeight: '140px',
        maxHeight: '260px',
        overflowY: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '0.8rem' }}>
            Keranjang masih kosong. Klik "+ Tambah" pada katalog untuk menambahkan produk.
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '6px'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.product.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {formatCurrency(item.product.price)} / {item.product.unit}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '4px' }}>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    style={{ background: 'none', border: 'none', color: '#ffffff', padding: '4px 6px', cursor: 'pointer' }}
                  >
                    <Minus size={13} />
                  </button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 6px', minWidth: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    style={{ background: 'none', border: 'none', color: '#ffffff', padding: '4px 6px', cursor: 'pointer' }}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--emerald-400)', minWidth: '70px', textAlign: 'right' }}>
                  {formatCurrency(item.subtotal)}
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ringkasan Finansial */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '0.82rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span>Subtotal Bruto:</span>
          <span className="mono" style={{ color: '#ffffff' }}>{formatCurrency(subtotal)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Estimasi PPh Final PP 55 (0.5%):</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>SAK EMKM</span>
          </span>
          <span className="mono" style={{ color: 'var(--cyan-400)' }}>{formatCurrency(taxPP55Estimated)}</span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderTop: '1px dashed var(--border-subtle)',
          paddingTop: '8px',
          marginTop: '4px'
        }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>Total Bayar:</span>
          <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--emerald-400)' }}>
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>

      {/* Metode Pembayaran */}
      <div>
        <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#ffffff', display: 'block', marginBottom: '8px' }}>
          Metode Pembayaran
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onPaymentMethodChange('CASH')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: paymentMethod === 'CASH' ? '2px solid var(--emerald-500)' : '1px solid var(--border-subtle)',
              background: paymentMethod === 'CASH' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: paymentMethod === 'CASH' ? 'var(--emerald-400)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Banknote size={18} />
            <span>Tunai (Cash)</span>
          </button>

          <button
            type="button"
            onClick={() => onPaymentMethodChange('QRIS')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: paymentMethod === 'QRIS' ? '2px solid var(--cyan-500)' : '1px solid var(--border-subtle)',
              background: paymentMethod === 'QRIS' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: paymentMethod === 'QRIS' ? 'var(--cyan-400)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <QrCode size={18} />
            <span>QRIS SNAP</span>
          </button>
        </div>
      </div>

      {/* Input Tunai & Kembalian */}
      {paymentMethod === 'CASH' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
            {[10000, 20000, 50000, 100000].map((nominal) => (
              <button
                key={nominal}
                type="button"
                onClick={() => onCashTenderedChange(nominal)}
                style={{
                  background: cashTendered === nominal ? 'var(--emerald-600)' : 'rgba(30, 41, 59, 0.7)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 2px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Rp {(nominal / 1000)}k
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Diterima (Rp):
              </label>
              <input
                type="number"
                value={cashTendered || ''}
                onChange={(e) => onCashTenderedChange(Number(e.target.value))}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: isCashInsufficient ? '1px solid var(--rose-500)' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              />
            </div>

            <div style={{ flex: 1, textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                Kembalian:
              </span>
              <div style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: isCashInsufficient ? 'var(--rose-400)' : 'var(--emerald-400)'
              }}>
                {isCashInsufficient ? 'Kurang' : formatCurrency(changeAmount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QRIS Otomatis Information */}
      {paymentMethod === 'QRIS' && (
        <div style={{
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px dashed var(--cyan-500)',
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <QrCode size={32} color="var(--cyan-400)" style={{ margin: '0 auto 6px auto' }} />
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
            QRIS Dinamis Bank Indonesia
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Mendukung GoPay, OVO, Dana, ShopeePay & Semua M-Banking
          </p>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--rose-500)',
          color: 'var(--rose-400)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <AlertTriangle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tombol Eksekusi Transaksi */}
      <button
        type="button"
        disabled={cart.length === 0 || isProcessing || isCashInsufficient}
        onClick={onCheckout}
        style={{
          padding: '14px',
          borderRadius: '8px',
          border: 'none',
          background: (cart.length === 0 || isCashInsufficient)
            ? 'rgba(71, 85, 105, 0.4)'
            : 'linear-gradient(135deg, var(--emerald-500), var(--cyan-600))',
          color: '#ffffff',
          fontSize: '0.92rem',
          fontWeight: 800,
          cursor: (cart.length === 0 || isCashInsufficient || isProcessing) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: (cart.length > 0 && !isCashInsufficient) ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
          transition: 'all 0.2s'
        }}
      >
        {isProcessing ? (
          <span>Memproses Transaksi ACID...</span>
        ) : (
          <>
            <Receipt size={18} />
            <span>Selesaikan & Cetak Struk (SAK EMKM)</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
};
