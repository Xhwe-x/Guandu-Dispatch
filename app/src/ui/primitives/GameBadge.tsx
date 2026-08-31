import type { HTMLAttributes } from 'react';
import './primitives.css';
export function GameBadge({ className='', ...props }: HTMLAttributes<HTMLSpanElement>) { return <span {...props} className={`v09-badge ${className}`.trim()} />; }
