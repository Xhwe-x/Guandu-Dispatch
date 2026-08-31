import { GameButton } from '../primitives/GameButton';

interface ObjectiveRailProps {
  title: string;
  question: string;
  action?: string;
  directionCount: number;
  activeCue?: { id: string; text: string; onDismiss: () => void };
  onOpenDossier: () => void;
  onRequestHint: () => void;
}

export function ObjectiveRail({ title, question, action, directionCount, activeCue, onOpenDossier, onRequestHint }: ObjectiveRailProps) {
  return <aside className="v095-objective-rail" aria-label="当前查案目标">
    <div className="v095-objective-rail__main">
      <small>当前目标</small><strong>{title}</strong><p>{question}</p>
      {action ? <p className="v095-objective-rail__step"><b>下一步</b>{action}</p> : null}
    </div>
    <div className="v095-objective-rail__actions">
      <span>{directionCount > 0 ? `${directionCount} 个方向仍可调查` : '当前证据已无明显新方向'}</span>
      <GameButton variant="secondary" size="sm" onClick={onOpenDossier}>打开案卷</GameButton>
      <GameButton variant="ghost" size="sm" onClick={onRequestHint}>提示</GameButton>
    </div>
    {activeCue ? <div className="v095-objective-rail__cue" role="status"><p>{activeCue.text}</p><GameButton variant="ghost" size="sm" onClick={activeCue.onDismiss}>知道了</GameButton></div> : null}
  </aside>;
}
