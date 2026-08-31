import type { ReactNode } from 'react';
export function AnimatedList({ children,className='' }: { children:ReactNode[]|ReactNode; className?:string }){
  const items=Array.isArray(children)?children:[children];
  return <div className={`v09-animated-list ${className}`.trim()}>{items.map((item,index)=><div className="v09-animated-list__item" style={{animationDelay:`${index*140}ms`}} key={index}>{item}</div>)}</div>;
}
