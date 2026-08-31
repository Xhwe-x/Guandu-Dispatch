import { CardContent, CardFooter, CardHeader, GameCard } from '../primitives/GameCard';
import { GameBadge } from '../primitives/GameBadge';
import { GameButton } from '../primitives/GameButton';

export function EvidenceCard({
  title,
  eyebrow,
  text,
  selected,
  onToggle,
  onInspect,
}: {
  title: string;
  eyebrow: string;
  text: string;
  selected?: boolean;
  onToggle?: () => void;
  onInspect?: () => void;
}) {
  return <GameCard className="v091-evidence-card" tone="paper" density="compact" data-selected={selected}>
    <CardHeader>
      <div><small>{eyebrow}</small><strong>{title}</strong></div>
      <GameBadge>{selected ? '已选择' : '未选择'}</GameBadge>
    </CardHeader>
    <CardContent><p>{text}</p></CardContent>
    <CardFooter>
      <GameButton className="v091-evidence-card__toggle" variant={selected ? 'evidence' : 'secondary'} size="sm" aria-pressed={selected} onClick={onToggle}>{selected ? '取消选择' : '选择这条'}</GameButton>
      <GameButton className="v091-evidence-card__inspect" variant="ghost" size="sm" onClick={onInspect}>查看详情</GameButton>
    </CardFooter>
  </GameCard>;
}
