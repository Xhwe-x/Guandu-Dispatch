import { GameButton } from '../primitives/GameButton';
export function TaskChip({ label='任务', count, onClick }: { label?:string; count?:number; onClick:()=>void }) {
  return <GameButton variant="ghost" size="sm" onClick={onClick} audioCue="journal-tab"><span className="v09-task-chip">{label}{count ? <b>{count}</b> : null}</span></GameButton>;
}
