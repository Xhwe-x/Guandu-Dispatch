import type { ReactNode } from 'react';
import './primitives.css';
export function GameTooltip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="v09-tooltip"><span className="v09-tooltip__trigger">{children}</span><span className="v09-tooltip__content" role="tooltip">{label}</span></span>;
}
