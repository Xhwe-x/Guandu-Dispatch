import { GameButton } from '../primitives/GameButton';

export function HintPanel({ level, text, relatedText, onMore, onClose }: {
  level: number;
  text: string;
  relatedText?: string;
  onMore: () => void;
  onClose: () => void;
}) {
  if (level <= 0) return null;
  return <aside className="v09-hint-panel" role="status">
    <header><small>提示 · {Math.min(level, 3)}/3</small><GameButton variant="ghost" size="icon" onClick={onClose} aria-label="关闭提示">×</GameButton></header>
    <p>{text}</p>
    {relatedText ? <div className="v095-guidance-related">{relatedText}</div> : null}
    {level < 3 ? <GameButton variant="ghost" size="sm" onClick={onMore}>再给一点提示</GameButton> : null}
  </aside>;
}
