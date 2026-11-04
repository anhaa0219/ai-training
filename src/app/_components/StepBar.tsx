'use client';

import { Step, StepItem } from '../types';

const STEPS: StepItem[] = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Label' },
  { id: 3, label: 'Train' },
  { id: 4, label: 'Test' },
];

interface StepBarProps {
  currentStep: Step;
  onStepClick: (step: Step) => void;
}

export const StepBar = ({ currentStep, onStepClick }: StepBarProps) => (
  <nav className="step-bar" aria-label="Workflow steps">
    {STEPS.map(({ id, label }) => {
      const active = currentStep === id;
      const complete = currentStep > id;
      return <button key={id} type="button" className={`step-item ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`} aria-current={active ? 'step' : undefined} onClick={() => onStepClick(id)}>
        <span className="step-number">{id}</span>
        <span className="step-label">{label}</span>
      </button>;
    })}
  </nav>
);
