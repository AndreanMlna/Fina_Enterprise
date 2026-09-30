import React, { useState } from 'react';
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
  Building2,
  Copy,
  Check,
  Mic,
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
  paymentMethod: 'CASH' | 'STATIC_QRIS' | 'QRIS';
  onPaymentMethodChange: (method: 'CASH' | 'STATIC_QRIS' | 'QRIS') => void;
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
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const handleCopyAccount = (accNumber: string, label: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedBank(label);
    setTimeout(() => setCopiedBank(null), 2500);
  };

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
        minHeight: '130px',
        maxHeight: '230px',
        overflowY: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 0', fontSize: '0.8rem' }}>
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

      {/* Metode Pembayaran (3 Opsi Saldo & Gateway) */}
      <div>
        <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#ffffff', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Opsi Pembayaran Saldo & Kasir:</span>
          <span style={{ fontSize: '0.68rem', color: '#34d399' }}>0% Fee / Bebas Potongan</span>
        </label>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {/* Opsi 1: Tunai Cash */}
          <button
            type="button"
            onClick={() => onPaymentMethodChange('CASH')}
            style={{
              padding: '8px 6px',
              borderRadius: '8px',
              border: paymentMethod === 'CASH' ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: paymentMethod === 'CASH' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.03)',
              color: paymentMethod === 'CASH' ? '#34d399' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.18s ease'
            }}
          >
            <Banknote size={17} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>Opsi 1: CASH</span>
            <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>100% Offline (0%)</span>
          </button>

          {/* Opsi 2: QRIS Statis / Rekening Toko */}
          <button
            type="button"
            onClick={() => onPaymentMethodChange('STATIC_QRIS')}
            style={{
              padding: '8px 6px',
              borderRadius: '8px',
              border: paymentMethod === 'STATIC_QRIS' ? '1.5px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: paymentMethod === 'STATIC_QRIS' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.03)',
              color: paymentMethod === 'STATIC_QRIS' ? '#38bdf8' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.18s ease'
            }}
          >
            <QrCode size={17} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>Opsi 2: QRIS MEJA</span>
            <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>Stiker & Rek. Toko</span>
          </button>

          {/* Opsi Gateway SNAP QRIS */}
          <button
            type="button"
            onClick={() => onPaymentMethodChange('QRIS')}
            style={{
              padding: '8px 6px',
              borderRadius: '8px',
              border: paymentMethod === 'QRIS' ? '1.5px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: paymentMethod === 'QRIS' ? 'rgba(139, 92, 246, 0.14)' : 'rgba(255, 255, 255, 0.03)',
              color: paymentMethod === 'QRIS' ? '#c084fc' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.18s ease'
            }}
          >
            <Building2 size={17} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>SNAP QRIS</span>
            <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>Dinamis Gateway</span>
          </button>
        </div>
      </div>

      {/* --- OPSI 1: INPUT TUNAI & KEMBALIAN (AKUN 1101) --- */}
      {paymentMethod === 'CASH' && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--emerald-400)', fontWeight: 700 }}>
              Jurnal SAK EMKM:
            </span>
            <span className="mono" style={{ color: '#94a3b8' }}>
              DEBET: 1101 (Kas Tunai) | KREDIT: 4101
            </span>
          </div>

          {/* Pilihan Cepat Uang Kertas Pecahan */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {[10000, 20000, 50000, 100000].map((nominal) => (
              <button
                key={nominal}
                type="button"
                onClick={() => onCashTenderedChange(nominal)}
                style={{
                  background: cashTendered === nominal ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  color: cashTendered === nominal ? '#34d399' : '#cbd5e1',
                  border: cashTendered === nominal ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '6px 2px',
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Rp {(nominal / 1000)}k
              </button>
            ))}
            <button
              type="button"
              onClick={() => onCashTenderedChange(grandTotal)}
              style={{
                background: cashTendered === grandTotal && grandTotal > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: cashTendered === grandTotal && grandTotal > 0 ? '#34d399' : '#cbd5e1',
                border: cashTendered === grandTotal && grandTotal > 0 ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '6px 2px',
                fontSize: '0.70rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Bayar dengan uang pas"
            >
              Uang Pas
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                Uang Diterima Kasir (Rp):
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
                Kembalian Kasir:
              </span>
              <div style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: isCashInsufficient ? 'var(--rose-400)' : 'var(--emerald-400)'
              }}>
                {isCashInsufficient ? 'Kurang' : formatCurrency(changeAmount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- OPSI 2: QRIS STATIS MEJA & REKENING TOKO BIASA (AKUN 1102) --- */}
      {paymentMethod === 'STATIC_QRIS' && (
        <div style={{
          background: 'rgba(0, 223, 143, 0.05)',
          border: '1px solid rgba(0, 223, 143, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--mint-neon)', fontWeight: 700 }}>
              Jurnal SAK EMKM:
            </span>
            <span className="mono" style={{ color: '#94a3b8' }}>
              DEBET: 1102 (Bank Giro/QRIS) | KREDIT: 4101
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px', alignItems: 'center' }}>
            {/* Visual Stiker QRIS Statis Meja Toko */}
            <div style={{
              background: '#ffffff',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}>
              <QrCode size={56} color="#0f172a" />
              <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                QRIS MEJA #1
              </span>
            </div>

            {/* Nomor Rekening Toko Langsung */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.74rem' }}>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>
                Rekening Toko Langsung (0% Fee):
              </span>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.7)', padding: '3px 6px', borderRadius: '4px' }}>
                <span><strong>BCA</strong>: 8830-1928-31 (FINA Store)</span>
                <button
                  type="button"
                  onClick={() => handleCopyAccount('8830192831', 'BCA')}
                  style={{ background: 'none', border: 'none', color: copiedBank === 'BCA' ? 'var(--mint-neon)' : '#94a3b8', cursor: 'pointer', padding: '2px' }}
                  title="Salin No Rekening"
                >
                  {copiedBank === 'BCA' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.7)', padding: '3px 6px', borderRadius: '4px' }}>
                <span><strong>Mandiri</strong>: 137-00-19283-91</span>
                <button
                  type="button"
                  onClick={() => handleCopyAccount('137001928391', 'Mandiri')}
                  style={{ background: 'none', border: 'none', color: copiedBank === 'Mandiri' ? 'var(--mint-neon)' : '#94a3b8', cursor: 'pointer', padding: '2px' }}
                  title="Salin No Rekening"
                >
                  {copiedBank === 'Mandiri' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.7)', padding: '3px 6px', borderRadius: '4px' }}>
                <span><strong>GoPay/DANA</strong>: 0812-9876-5432</span>
                <button
                  type="button"
                  onClick={() => handleCopyAccount('081298765432', 'GoPay')}
                  style={{ background: 'none', border: 'none', color: copiedBank === 'GoPay' ? 'var(--mint-neon)' : '#94a3b8', cursor: 'pointer', padding: '2px' }}
                >
                  {copiedBank === 'GoPay' ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 223, 143, 0.1)',
            padding: '6px 8px',
            borderRadius: '4px',
            fontSize: '0.68rem',
            color: 'var(--mint-neon)'
          }}>
            <Mic size={13} style={{ flexShrink: 0 }} />
            <span>
              Voice AI: Ucapkan <em>"Pelanggan bayar {formatCurrency(grandTotal)} transfer BCA"</em> untuk auto-input!
            </span>
          </div>
        </div>
      )}

      {/* --- OPSI GATEWAY: QRIS DINAMIS BANK INDONESIA --- */}
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
            QRIS Dinamis SNAP Gateway
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
