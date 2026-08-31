import { useMemo, useState } from 'react';
import { useGame } from '../../app/GameProvider';
import { guanduObjectives, guanduTheoryNodes } from '../../content/guandu/coreLoop';
import type { EntityId, GameState, Relationship, TheoryEdge } from '../../game/domain';
import { promoteKnowledge, syncObjectivesUntilStable } from '../../game/rules/knowledge';
import { evaluateTheory, frozenCoreTheoryEdges, optionalTheoryEdges } from '../../game/rules/theory';
import type { GameSceneId } from '../../game/scenes';
import { GameBadge } from '../../ui/primitives/GameBadge';
import { GameButton } from '../../ui/primitives/GameButton';
import { SceneFocusHeader } from '../../ui/game/SceneFocusHeader';
import { WarMapBackdrop } from '../../ui/game/WarMapBackdrop';

interface NetworkDeductionSceneProps {
  onComplete: (nextSceneId: GameSceneId) => void;
}

const edgeLabels: Record<string, { title: string; detail: string }> = {
  'edge-time-zhao': { title: '集合时辰 → 赵简', detail: '赵简接触并泄露集合时辰。' },
  'edge-route-du': { title: '物流碎片 → 杜衡', detail: '杜衡从草料、车辆与道路信息推出路线。' },
  'edge-integrate-du': { title: '杜衡 → 价格暗号', detail: '碎片在杜衡一侧被拼合成可传递军情。' },
  'edge-price-yuan': { title: '价格暗号 → 袁军', detail: '价格尾数与地支序号承担传递作用。' },
  'edge-time-lu': { title: '集合时辰 → 陆淳', detail: '陆淳改过粮册，但是否真的掌握最终时辰？' },
  'edge-route-zheng': { title: '物流碎片 → 郑禾', detail: '郑禾掌握车损规模，但能否据此得出最终路线？' },
  'edge-zhao-yuan-direct': { title: '赵简 → 袁军', detail: '这条直连能解释时辰，但能否解释完整路线？' },
};

const legacyCoreRelationships: Relationship[] = [
  { fromId: 'claim-zhao-time', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
  { fromId: 'claim-du-route', toId: 'du', kind: 'infers', slot: 'method' },
  { fromId: 'du', toId: 'claim-shuoyuan-received', kind: 'transmitsTo', slot: 'enemyConclusion' },
];

function suggestedEdgeIdsForTarget(target: GameState['coreLoop']['selectedDossierTarget']) {
  if (!target) return [];
  if (target.kind === 'person') {
    if (target.id === 'zhao') return ['edge-time-zhao'];
    if (target.id === 'du') return ['edge-route-du'];
  }
  if (target.kind === 'document') {
    if (target.id === 'trade-prices') return ['edge-integrate-du', 'edge-price-yuan'];
    if (target.id === 'route-map' || target.id === 'station-entry') return ['edge-route-du'];
    if (target.id === 'statement-zhao' || target.id === 'order-assembly') return ['edge-time-zhao'];
  }
  if (target.kind === 'knowledge') {
    if (target.id === 'claim-zhao-time') return ['edge-time-zhao'];
    if (target.id === 'claim-du-fodder-pattern' || target.id === 'claim-du-route') return ['edge-route-du'];
    if (target.id === 'claim-price-cipher') return ['edge-integrate-du', 'edge-price-yuan'];
  }
  return [];
}

function addLegacyRelationships(state: GameState) {
  const relationships = [...state.relationships];
  for (const relation of legacyCoreRelationships) {
    if (!relationships.some((item) => item.fromId === relation.fromId && item.toId === relation.toId && item.kind === relation.kind && item.slot === relation.slot)) {
      relationships.push(relation);
    }
  }
  return relationships;
}

export function NetworkDeductionScene({ onComplete }: NetworkDeductionSceneProps) {
  const { content, dispatch, state } = useGame();
  const characterNameFor = (id: string) => content.characters.find((person) => person.id === id)?.name ?? id;
  const existingIds = state.coreLoop.theoryEdges.map((edge) => edge.id);
  const suggestedIds = suggestedEdgeIdsForTarget(state.coreLoop.selectedDossierTarget);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => [...new Set([...existingIds, ...suggestedIds])]);
  const [message, setMessage] = useState('泄密链可以不完整。先把你认为有证据支持的关系放上案板，再让系统指出缺口。');
  const [lastEvaluation, setLastEvaluation] = useState(state.coreLoop.theoryEvaluation);

  const candidates = useMemo(() => [...frozenCoreTheoryEdges, ...optionalTheoryEdges], []);
  const selectedEdges = candidates.filter((edge) => selectedIds.includes(edge.id)).map((edge) => {
    const persisted = state.coreLoop.theoryEdges.find((item) => item.id === edge.id);
    return persisted ?? edge;
  });
  const evaluation = lastEvaluation.status === 'incomplete' && !state.coreLoop.theoryEdges.length
    ? evaluateTheory(state, selectedEdges)
    : lastEvaluation;

  function toggleEdge(id: EntityId) {
    setSelectedIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
    setMessage('关系已调整。点击“验证当前理论”查看现在能解释什么、还缺什么。');
  }

  function validateCurrentTheory() {
    const rawEvaluation = evaluateTheory(state, selectedEdges);
    const nextEdges: TheoryEdge[] = selectedEdges.map((edge) => ({
      ...edge,
      status: edge.status === 'verified'
        ? 'verified'
        : rawEvaluation.supportedEdgeIds.includes(edge.id)
          ? 'supported'
          : 'proposed',
    }));
    let nextState: GameState = {
      ...state,
      relationships: rawEvaluation.status === 'supported' || rawEvaluation.status === 'verified'
        ? addLegacyRelationships(state)
        : state.relationships,
      presentation: rawEvaluation.status === 'supported' || rawEvaluation.status === 'verified'
        ? { ...state.presentation, networkTheory: { timeSourceId: 'zhao', routeSourceId: 'du', transmitterId: 'du' } }
        : state.presentation,
      coreLoop: {
        ...state.coreLoop,
        theoryNodes: guanduTheoryNodes,
        theoryEdges: nextEdges,
        theoryEvaluation: rawEvaluation,
        guidance: {
          ...state.coreLoop.guidance,
          invalidTheoryAttempts: rawEvaluation.status === 'incomplete' || rawEvaluation.status === 'conflicted'
            ? state.coreLoop.guidance.invalidTheoryAttempts + (rawEvaluation.supportedEdgeIds.length <= state.coreLoop.theoryEvaluation.supportedEdgeIds.length ? 1 : 0)
            : state.coreLoop.guidance.invalidTheoryAttempts,
          lastProgressAt: rawEvaluation.supportedEdgeIds.length > state.coreLoop.theoryEvaluation.supportedEdgeIds.length
            ? Date.now()
            : state.coreLoop.guidance.lastProgressAt,
        },
      },
    };
    if (rawEvaluation.status === 'supported' || rawEvaluation.status === 'verified') {
      nextState = promoteKnowledge(nextState, 'claim-shuoyuan-received', 'supported', Date.now());
      nextState = syncObjectivesUntilStable(nextState, guanduObjectives);
      nextState = { ...nextState, stage: 'chain' };
    }
    dispatch({ type: 'APPLY_RULE_STATE', state: nextState });
    setLastEvaluation(rawEvaluation);
    if (rawEvaluation.status === 'supported') {
      setMessage('链条已达到“有证”：赵简解释时辰，杜衡解释路线拼合与价格暗号传递。下一步用投饵让敌军替你验证。');
    } else if (rawEvaluation.status === 'verified') {
      setMessage('敌军回声已经验证这条泄密链。');
    } else {
      setMessage(rawEvaluation.gaps[0]?.description ?? '当前理论仍不完整，但可以继续调整，不会失去调查进度。');
    }
  }

  function openGapInDossier() {
    const current = lastEvaluation.gaps[0] ?? evaluateTheory(state, selectedEdges).gaps[0];
    if (!current) return;
    dispatch({ type: 'SET_DOSSIER_TARGET', target: { kind: 'gap', id: current.id } });
  }

  const currentEvaluation = state.coreLoop.theoryEdges.length ? state.coreLoop.theoryEvaluation : evaluation;
  const canEnterBait = currentEvaluation.status === 'supported' || currentEvaluation.status === 'verified';

  return (
    <main className="v095-theory-workspace" aria-labelledby="network-deduction-title">
      <WarMapBackdrop />
      <SceneFocusHeader
        eyebrow="第三幕 · 泄密链推演"
        title="把军情是怎样形成的连起来"
        description="这不是一次性答题。关系可以先不完整，验证后系统只告诉你缺口，不会用“答错”锁死案件。"
        id="network-deduction-title"
        status={<GameBadge>{currentEvaluation.status === 'verified' ? '已验证' : currentEvaluation.status === 'supported' ? '链条有证' : '仍可补查'}</GameBadge>}
      />

      <section className="v095-theory-layout">
        <aside className="v095-theory-palette" aria-label="可用理论关系">
          <header><small>关系素材</small><h2>选择你认为成立的关系</h2></header>
          {candidates.map((edge) => {
            const label = edgeLabels[edge.id];
            const selected = selectedIds.includes(edge.id);
            const persisted = state.coreLoop.theoryEdges.find((item) => item.id === edge.id);
            return <GameButton key={edge.id} className="v095-theory-edge-option" variant={selected ? 'evidence' : 'ghost'} size="lg" aria-pressed={selected} onClick={() => toggleEdge(edge.id)}>
              <span><strong>{label?.title ?? edge.id}</strong><small>{label?.detail}</small></span>
              {persisted?.status === 'verified' ? <em>已验证</em> : persisted?.status === 'supported' ? <em>有证</em> : null}
            </GameButton>;
          })}
        </aside>

        <section className="v095-theory-board" aria-label="当前泄密链">
          <header><div><small>持续推演板</small><h2>当前理论</h2></div><GameBadge>{selectedEdges.length} 条关系</GameBadge></header>
          <div className="v095-theory-chain">
            {selectedEdges.length ? selectedEdges.map((edge) => <article key={edge.id} data-status={state.coreLoop.theoryEdges.find((item) => item.id === edge.id)?.status ?? 'proposed'}>
              <span>{edgeLabels[edge.id]?.title ?? edge.id}</span>
              <small>{state.coreLoop.theoryEdges.find((item) => item.id === edge.id)?.status === 'verified' ? '敌军回声已验证' : state.coreLoop.theoryEdges.find((item) => item.id === edge.id)?.status === 'supported' ? '现有证据支持' : '等待验证'}</small>
            </article>) : <div className="v095-theory-empty"><strong>案板还是空的</strong><p>可以先放一条关系，再验证它解释了什么。</p></div>}
          </div>
        </section>

        <aside className="v095-theory-gap" aria-label="理论缺口">
          <header><small>系统只指出缺口</small><h2>{currentEvaluation.gaps[0]?.title ?? (canEnterBait ? '链条已经可以用于反情报' : '等待验证')}</h2></header>
          <p>{currentEvaluation.gaps[0]?.description ?? message}</p>
          {currentEvaluation.gaps.length > 1 ? <ul>{currentEvaluation.gaps.slice(1).map((gap) => <li key={gap.id}>{gap.title}</li>)}</ul> : null}
          {currentEvaluation.gaps[0] ? <div className="v095-gap-suggestions">
            {currentEvaluation.gaps[0].suggestedPersonIds.length ? <span>人物：{currentEvaluation.gaps[0].suggestedPersonIds.map((id) => characterNameFor(id)).join('、')}</span> : null}
            {currentEvaluation.gaps[0].suggestedDocumentIds.length ? <span>文书：{currentEvaluation.gaps[0].suggestedDocumentIds.length} 份可回查</span> : null}
          </div> : null}
        </aside>
      </section>

      <div className="v095-theory-status" role="status">{message}</div>
      <footer className="v095-theory-actions">
        <GameButton variant="command" audioCue="seal" disabled={!selectedEdges.length} onClick={validateCurrentTheory} mark="验">验证当前理论</GameButton>
        <GameButton variant="secondary" audioCue="paper-open" disabled={!currentEvaluation.gaps.length} onClick={openGapInDossier}>回案卷查缺口</GameButton>
        <GameButton variant="secondary" audioCue="tent-enter" disabled={!canEnterBait} lockedReason={!canEnterBait ? '泄密链达到“有证”后才能投饵' : undefined} onClick={() => onComplete('bait')}>进入投饵</GameButton>
      </footer>
    </main>
  );
}
