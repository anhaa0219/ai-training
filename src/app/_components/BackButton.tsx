interface BackButtonProps {
  onClick: () => void;
}

export function BackButton({ onClick }: BackButtonProps) {
  return <button className="back-button" type="button" onClick={onClick}><span aria-hidden="true">←</span> Back</button>;
}
