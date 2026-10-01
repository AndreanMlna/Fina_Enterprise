import React from 'react';
import { Wallet, Package, Wrench, CheckCircle2, Check } from 'lucide-react';

export type WizardStep = 1 | 2 | 3 | 4;

interface StepMeta {
  number: WizardStep;
  title: string;
  icon: React.ElementType;
}

export const STEPS: StepMeta[] = [
  { number: 1, title: 'Kas & Bank', icon: Wallet },
  { number: 2, title: 'Persediaan', icon: Package },
  { number: 3, title: 'Aset Tetap', icon: Wrench },
  { number: 4, title: 'Konfirmasi', icon: CheckCircle2 },
];

interface SetupWizardStepperProps {
  step: WizardStep;
  onStepClick: (step: WizardStep) => void;
}

export const SetupWizardStepper: React.FC<SetupWizardStepperProps> = ({
  step,
  onStepClick
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '8px',
      background: 'rgba(255, 255, 255, 0.02)',
      padding: '5px',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      {STEPS.map((s) => {
        const StepIcon = s.icon;
        const isActive = s.number === step;
        const isDone = s.number < step;

        return (
          <button
            key={s.number}
            type="button"
            onClick={() => isDone && onStepClick(s.number)}
            disabled={!isDone && !isActive}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: '10px',
              background: isActive 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.10) 100%)'
                : isDone
                ? 'rgba(16, 185, 129, 0.05)'
                : 'transparent',
              border: isActive
                ? '1px solid rgba(0, 223, 143, 0.4)'
                : isDone
                ? '1px solid rgba(16, 185, 129, 0.2)'
                : '1px solid transparent',
              color: isActive ? '#FFFFFF' : isDone ? '#34d399' : '#64748b',
              cursor: isDone ? 'pointer' : isActive ? 'default' : 'not-allowed',
              transition: 'all 0.18s ease'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isActive
                ? 'rgba(0, 223, 143, 0.2)'
                : isDone
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(255, 255, 255, 0.04)',
              color: isActive ? 'var(--mint-neon)' : isDone ? '#34d399' : '#64748b',
              fontSize: '0.72rem',
              fontWeight: 700,
              flexShrink: 0
            }}>
              {isDone ? <Check size={13} strokeWidth={2.5} /> : <StepIcon size={12} />}
            </div>
            <span style={{ fontSize: '0.80rem', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>
              {s.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};
