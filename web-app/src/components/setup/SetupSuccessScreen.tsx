import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils';

export interface SetupSuccessData {
  journal_entry_number: string;
  owner_equity: number;
  products_created: number;
  audit_merkle_hash: string;
}

interface SetupSuccessScreenProps {
  successData: SetupSuccessData;
  businessName: string;
  onSetupComplete: () => void;
}

export const SetupSuccessScreen: React.FC<SetupSuccessScreenProps> = ({
  successData,
  businessName,
  onSetupComplete
}) => {
  return (
    <div style={{
      maxWidth: '560px',
      margin: '60px auto',
      padding: '36px 32px'
    }}>
      <div className="homies-card" style={{
        padding: '36px 32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '18px',
        border: '1px solid rgba(0, 223, 143, 0.3)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(0, 223, 143, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mint-neon)'
        }}>
          <CheckCircle2 size={36} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px 0' }}>
            Saldo Awal Berhasil Disimpan
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
            Data keuangan {businessName} telah tersimpan dan siap digunakan untuk transaksi operasional.
          </p>
        </div>

        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          margin: '8px 0'
        }}>
          <div className="homies-card-inner" style={{ padding: '14px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '2px' }}>No. Jurnal</div>
            <div className="mono" style={{ fontSize: '0.86rem', fontWeight: 600, color: '#FFFFFF' }}>
              {successData.journal_entry_number}
            </div>
          </div>

          <div className="homies-card-inner" style={{ padding: '14px', textAlign: 'center', border: '1px solid rgba(0, 223, 143, 0.25)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '2px' }}>Total Modal Awal</div>
            <div className="mono" style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--mint-neon)' }}>
              {formatCurrency(successData.owner_equity)}
            </div>
          </div>

          <div className="homies-card-inner" style={{ padding: '14px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '2px' }}>Katalog Produk</div>
            <div className="mono" style={{ fontSize: '0.98rem', fontWeight: 700, color: '#38BDF8' }}>
              {successData.products_created} Item
            </div>
          </div>
        </div>

        <button
          onClick={onSetupComplete}
          style={{
            padding: '11px 28px',
            background: 'linear-gradient(135deg, #00DF8F 0%, #059669 100%)',
            color: '#060911',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            marginTop: '6px',
            boxShadow: '0 4px 14px rgba(0, 223, 143, 0.25)'
          }}
        >
          Buka Dashboard
        </button>
      </div>
    </div>
  );
};
