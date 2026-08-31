import type { KnowledgeStatus } from '../../game/domain';
import { GameBadge } from '../primitives/GameBadge';

const labels: Record<KnowledgeStatus, string> = {
  unknown: '未知', observed: '已见', suspected: '推测', contradicted: '矛盾', supported: '有证', verified: '已验证', excluded: '已排除',
};

export function KnowledgeStatusBadge({ status }: { status: KnowledgeStatus }) {
  return <GameBadge className={`v095-knowledge-status v095-knowledge-status--${status}`}>{labels[status]}</GameBadge>;
}
