import type { HTMLAttributes, ReactNode } from 'react';
import './primitives.css';

type Density = 'compact' | 'default' | 'spacious';
type Tone = 'dark' | 'paper' | 'transparent';

export function GameCard({ density='default', tone='dark', className='', ...props }: HTMLAttributes<HTMLElement> & { density?: Density; tone?: Tone }) {
  return <article {...props} data-density={density} data-tone={tone} className={`v09-card ${className}`.trim()} />;
}
export function CardHeader({ children, className='' }: { children: ReactNode; className?: string }) { return <header className={`v09-card__header ${className}`.trim()}>{children}</header>; }
export function CardContent({ children, className='' }: { children: ReactNode; className?: string }) { return <div className={`v09-card__content ${className}`.trim()}>{children}</div>; }
export function CardFooter({ children, className='' }: { children: ReactNode; className?: string }) { return <footer className={`v09-card__footer ${className}`.trim()}>{children}</footer>; }
