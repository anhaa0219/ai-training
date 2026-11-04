import { ReactNode } from 'react';

interface MainButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export function MainButton({ children, onClick, disabled = false }: MainButtonProps) {
  return <button className="main-button" type="button" onClick={onClick} disabled={disabled}>{children}</button>;
}
