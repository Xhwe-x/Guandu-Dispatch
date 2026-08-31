import { useState } from 'react';
import { useGame } from '../../app/GameProvider';
import type { GameSceneId } from '../../game/scenes';
import { EvidenceCard } from '../../ui/game/EvidenceCard';
import { SceneFocusHeader } from '../../ui/game/SceneFocusHeader';
import { GameButton } from '../../ui/primitives/GameButton';
import { GameDialog } from '../../ui/primitives/GameDialog';

const evidence = {
  'claim-zhao-denial': {
    eyebrow: '赵简口供',
    title: '不知道集合时辰',
    text: '赵简声称自己只负责誊写，不知道粮队真正集合的时辰。',
    detail: '口供重点不在“他是否撒谎”，而在他声称自己接触不到最终集合时辰。先把这句话作为待核事实。',
  },
  'claim-zhao-copied-order': {
    eyebrow: '集合记录',
    title: '由赵简誊写',
    text: '集合文书上记有时辰，誊写署名与赵简一致；这说明他至少接触过该信息。',
    detail: '这份记录只能证明赵简接触过带时辰的集合文书，不能单独证明他向敌军泄密。它的价值在于与口供对照。',
  },
} as const;

type EvidenceId = keyof typeof evidence;

export function FirstEvidenceScene({ onComplete }: { onComplete:(sceneId:GameSceneId)=>void }) {
  const { dispatch } = useGame();
  const [selected, setSelected] = useState<EvidenceId[]>([]);
  const [inspectId, setInspectId] = useState<EvidenceId | null>(null);
  const toggle = (id: EvidenceId) => setSelected((items) => items.includes(id) ? items.filter((x) => x !== id) : [...items, id]);
  const ready = (Object.keys(evidence) as EvidenceId[]).every((id) => selected.includes(id));
  const missing = 2 - selected.length;

  function compare() {
    if (!ready) return;
    dispatch({type:'READ_DOCUMENT',documentId:'statement-zhao'});
    dispatch({type:'EXTRACT_CLAIM',claimId:'claim-zhao-denial'});
    dispatch({type:'EXTRACT_CLAIM',claimId:'claim-zhao-copied-order'});
    dispatch({type:'SET_TUTORIAL_STEP',step:'placeContradiction'});
    onComplete('first-deduction');
  }

  return <main className="v09-guided-scene v091-evidence-scene">
    <section className="v09-guided-scene__body">
      <SceneFocusHeader eyebrow="第一次证据比较 · 步骤 1 / 3" title="只看这两条信息" description="先分别选择两条信息。查看详情只会打开弹层，不会改变卡片大小或页面排版。" status={<span className="v093-step-counter">{selected.length}/2 已选</span>} />
      <div className="v09-evidence-pair">
        {(Object.entries(evidence) as Array<[EvidenceId, (typeof evidence)[EvidenceId]]>).map(([id, item]) => <EvidenceCard key={id} {...item} selected={selected.includes(id)} onToggle={() => toggle(id)} onInspect={() => setInspectId(id)} />)}
      </div>
      <footer className="v09-guided-scene__footer v091-evidence-footer">
        <div className="v091-evidence-status">
          <strong>{ready ? '两条信息已选齐' : `已选择 ${selected.length} / 2`}</strong>
          <span>{ready ? '现在可以比较它们之间的关系。' : `还需选择 ${missing} 条信息。`}</span>
        </div>
        <div className="v091-evidence-actions">
          <GameButton variant="ghost" size="md" disabled={selected.length === 0} onClick={() => setSelected([])}>重置选择</GameButton>
          <GameButton variant="primary" size="lg" audioCue="evidence-place" disabled={!ready} title={!ready ? `还需选择 ${missing} 条信息` : undefined} onClick={compare}>比较这两条信息</GameButton>
        </div>
      </footer>
    </section>
    <GameDialog
      open={inspectId !== null}
      title={inspectId ? evidence[inspectId].title : '证据详情'}
      description={inspectId ? evidence[inspectId].eyebrow : undefined}
      onClose={() => setInspectId(null)}
      footer={<GameButton variant="primary" onClick={() => setInspectId(null)}>看完了</GameButton>}
    >
      {inspectId ? <div className="v091-evidence-detail"><p>{evidence[inspectId].text}</p><hr/><p>{evidence[inspectId].detail}</p></div> : null}
    </GameDialog>
  </main>;
}
