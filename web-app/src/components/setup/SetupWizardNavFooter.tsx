import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { WizardStep } from './SetupWizardStepper';

interface SetupWizardNavFooterProps {
  step: WizardStep;
  setStep: React.Dispatch<React.SetStateAction<WizardStep>>;
  setError: (err: string | null) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  isNeracaBalanced: boolean;
}

export const SetupWizardNavFooter: React.FC<SetupWizardNavFooterProps> = ({
  step,
  setStep,
  setError,
  handleSubmit,
  isSubmitting,
  isNeracaBalanced
}) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      {step > 1 ? (
        <button
          type="button"
          onClick={() => { setStep((step - 1) as WizardStep); setError(null); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            color: '#cbd5e1',
            fontSize: '0.80rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={14} /> Kembali
        </button>
      ) : (
        <div />
      )}

      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
        Langkah {step} dari 4
      </div>

      {step < 4 ? (
        <button
          type="button"
          onClick={() => { setStep((step + 1) as WizardStep); setError(null); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            background: 'linear-gradient(135deg, #00DF8F 0%, #059669 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#060911',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Lanjutkan <ArrowRight size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !isNeracaBalanced}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 20px',
            background: isNeracaBalanced 
              ? 'linear-gradient(135deg, #00DF8F 0%, #059669 100%)'
              : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '8px',
            color: isNeracaBalanced ? '#060911' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: isSubmitting || !isNeracaBalanced ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Saldo Awal'}
        </button>
      )}
    </div>
  );
};
