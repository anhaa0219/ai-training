import { ReactNode } from 'react';

export function StepCard({ children }: { children: ReactNode }) {
  return <section className="step-card">{children}</section>;
}
