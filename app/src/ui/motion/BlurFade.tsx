import type { CSSProperties, ReactNode } from 'react';
import './motion.css';
export function BlurFade({ children, keyId, delay=0, className='' }: { children: ReactNode; keyId?: string; delay?: number; className?: string }) {
  return <div key={keyId} className={`v09-blur-fade ${className}`.trim()} style={{'--v09-delay':`${delay}ms`} as CSSProperties}>{children}</div>;
}
