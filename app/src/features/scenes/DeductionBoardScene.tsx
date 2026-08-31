import { useState } from 'react';
import { useGame } from '../../app/GameProvider';
import type { RelationKind, Relationship } from '../../game/domain';
import { validateRelationship } from '../../game/rules/relationships';
import type { GameSceneId } from '../../game/scenes';
import { GameButton } from '../ui/GameButton';

interface DeductionBoardSceneProps {
  onComplete: (nextSceneId: GameSceneId) => void;
}

const contradiction: Relationship = {
  fromId: 'claim-zhao-copied-order',
  toId: 'claim-zhao-denial',
  kind: 'refutes',
  slot: 'leakedInfo',
};

const sourceOptions = [
  { id: 'claim-zhao-copied-order', title: '笔迹核验', note: '集合命令由赵简亲笔誊抄。' },
  { id: 'claim-shuoyuan-received', title: '伏击军报', note: '敌军同时对应北桥与寅时。' },
  { id: 'claim-zhao-time', title: '审讯改口', note: '赵简承认接触并泄露过时辰。' },
];

const targetOptions = [
  { id: 'claim-zhao-denial', title: '赵简原口供', note: '“我并不知道集合时辰。”' },
  { id: 'claim-shuoyuan-received', title: '敌军行动', note: '敌骑在北桥提前布伏。' },
];

const relationOptions: { id: RelationKind; label: string; help: string }[] = [
  { id: 'refutes', label: '相互矛盾', help: '前一条事实能够直接推翻后一条陈述。' },
  { id: 'supports', label: '相互印证', help: '两条事实共同支持同一判断。' },
  { id: 'sourceOf', label: '情报来源', help: '前一项是后一项的信息来源。' },
];

function sameRelationship(left: Relationship, right: Relationship) {
  return left.fromId === right.fromId && left.toId === right.toId && left.kind === right.kind && left.slot === right.slot;
}

export function DeductionBoardScene({ onComplete }: DeductionBoardSceneProps) {
  const { content, dispatch, state } = useGame();
  const [message, setMessage] = useState('');
  const draft = state.presentation.deduction;
  const complete = state.relationships.some((relationship) => sameRelationship(relationship, contradiction));
  const selectedSource = sourceOptions.find((item) => item.id === draft.fromId);
  const selectedTarget = targetOptions.find((item) => item.id === draft.toId);
  const selectedRelation = relationOptions.find((item) => item.id === draft.kind);

  function updateDraft(next: Partial<typeof draft>) {
    dispatch({
      type: 'SET_DEDUCTION_DRAFT',
      fromId: next.fromId ?? draft.fromId,
      toId: next.toId ?? draft.toId,
      kind: next.kind ?? draft.kind,
    });
  }

  function placeRelationship() {
    if (!draft.fromId || !draft.toId || !draft.kind) {
      setMessage('先选择两条案卷事实，再说明它们之间是什么关系。');
      return;
    }
    const relationship: Relationship = { fromId: draft.fromId, toId: draft.toId, kind: draft.kind, slot: 'leakedInfo' };
    const result = validateRelationship(content, relationship);
    if (!result.ok) {
      setMessage('这两条材料暂时不能形成你选择的关系。换一个方向，问自己：哪一条事实直接推翻了哪一句话？');
      return;
    }
    dispatch({ type: 'PLACE_RELATIONSHIP', relationship });
    dispatch({ type: 'SET_TUTORIAL_STEP', step: 'completed' });
    setMessage('矛盾成立：赵简不可能既亲笔誊抄集合命令，又完全不知道集合时辰。');
  }

  return (
    <main className="deduction-scene" aria-labelledby="deduction-scene-title">
      <header className="deduction-scene__heading">
        <div><p className="scene-kicker">军机推演板 · 第一条矛盾</p><h1 id="deduction-scene-title">把事实连起来</h1></div>
        <p>系统不会替你把答案摆好。选两条材料，再判断它们之间的关系。</p>
      </header>

      <section className="deduction-board" data-complete={complete}>
        <div className="deduction-board__column">
          <span className="board-label">前件</span>
          {sourceOptions.map((item) => {
            const locked = !state.extractedClaimIds.includes(item.id);
            return (
              <button key={item.id} type="button" className="board-note" data-audio-cue="evidence-place" data-selected={draft.fromId === item.id} disabled={locked} onClick={() => updateDraft({ fromId: item.id })}>
                <small>{item.title}</small><strong>{item.note}</strong>{locked && <em>未入案</em>}
              </button>
            );
          })}
        </div>

        <div className="deduction-board__relation">
          <div className="cinnabar-thread" aria-hidden="true"><i /><span>{selectedRelation?.label ?? '？'}</span><i /></div>
          {relationOptions.map((item) => (
            <button key={item.id} type="button" className="relation-token" data-audio-cue="deduction-link" data-selected={draft.kind === item.id} onClick={() => updateDraft({ kind: item.id })}>
              <strong>{item.label}</strong><small>{item.help}</small>
            </button>
          ))}
        </div>

        <div className="deduction-board__column">
          <span className="board-label">后件</span>
          {targetOptions.map((item) => {
            const locked = !state.extractedClaimIds.includes(item.id);
            return (
              <button key={item.id} type="button" className="board-note" data-audio-cue="evidence-place" data-selected={draft.toId === item.id} disabled={locked} onClick={() => updateDraft({ toId: item.id })}>
                <small>{item.title}</small><strong>{item.note}</strong>{locked && <em>未入案</em>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="deduction-insight" data-complete={complete}>
        <span>{complete ? '已立' : '待证'}</span>
        <p>{complete ? '赵简的初次口供已被笔迹证据直接推翻。' : selectedSource && selectedTarget ? `${selectedSource.title} → ${selectedTarget.title}` : '选择两端材料，尝试建立第一条矛盾。'}</p>
      </div>
      <p className="slice-scene__status" role="status" aria-live="polite">{message}</p>
      <div className="scene-actions scene-actions--right">
        <GameButton variant="command" audioCue="seal" onClick={placeRelationship} disabled={complete} mark="印">钉入推演板</GameButton>
        <GameButton variant="secondary" audioCue="paper-close" onClick={() => onComplete('case-summary')} disabled={!complete}>收录本折案卷</GameButton>
      </div>
    </main>
  );
}
