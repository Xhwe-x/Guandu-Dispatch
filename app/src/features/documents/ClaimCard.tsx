import { useId, useState } from 'react';
import type { Claim } from '../../game/domain';

interface ClaimCardProps {
  claim: Claim;
  sourceTitle: string;
}

const claimTagLabels: Record<string, string> = {
  supports: '支持',
  refutes: '反驳',
  source: '情报来源',
  actor: '接触人物',
  method: '推断方式',
  enemyConclusion: '敌方结论',
};

export function ClaimCard({ claim, sourceTitle }: ClaimCardProps) {
  const sourceDescriptionId = useId();
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="claim-card">
      <button
        type="button"
        aria-describedby={sourceDescriptionId}
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        {claim.text}
      </button>
      <p id={sourceDescriptionId}>来源：{sourceTitle}</p>
      {expanded ? (
        <p>
          标签：{claim.tags.length > 0
            ? claim.tags.map((tag) => claimTagLabels[tag] ?? '其他线索').join('、')
            : '口供记录'}
        </p>
      ) : null}
    </article>
  );
}
