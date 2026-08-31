import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../app/GameProvider';
import { guanduGuidanceCues, objectiveById } from '../../content/guandu/coreLoop';
import { guanduCharacterTaskLinks } from '../../content/guandu/taskLinks';
import {
  guanduGeographyNotes,
  historicalDocumentLexicon,
  historicalRoleNotes,
  historicalTransmissionMethods,
} from '../../content/guandu/historicalContext';
import {
  selectCurrentObjectiveId,
  selectInvestigableDirectionCount,
} from '../../game/coreLoopSelectors';
import type { EntityId, KnowledgeEntry } from '../../game/domain';
import {
  dismissCue,
  guidanceText,
  markCueShown,
  nextProactiveCue,
  requestManualHint,
  resolveGuidanceForProgress,
  selectManualGuidanceCue,
} from '../../game/rules/guidance';
import type { GameSceneId } from '../../game/scenes';
import { tutorialLessons } from '../tutorial/tutorialLessons';
import { CharacterPortrait } from './CharacterPortrait';
import { dialogueCharacterFor } from './dialogueCharacters';
import { caseObjectiveForScene, suggestedHintForScene } from './caseObjectives';
import { SceneHeader } from '../../ui/game/SceneHeader';
import { GameButton } from '../../ui/primitives/GameButton';
import { CardContent, CardFooter, CardHeader, GameCard } from '../../ui/primitives/GameCard';
import { GameBadge } from '../../ui/primitives/GameBadge';
import { DossierSheet } from '../../ui/game/DossierSheet';
import { HintPanel } from '../../ui/game/HintPanel';
import { KnowledgeStatusBadge } from '../../ui/game/KnowledgeStatusBadge';
import { ObjectiveRail } from '../../ui/game/ObjectiveRail';
import { TaskChip } from '../../ui/game/TaskChip';
import { AnimatedList } from '../../ui/motion/AnimatedList';

interface CaseNavigatorProps {
  sceneId: GameSceneId;
  onBack: () => void;
  onSafeReturn: (sceneId: GameSceneId) => void;
}

type JournalTab = 'task' | 'people' | 'intel' | 'evidence' | 'reasoning' | 'enemy' | 'history' | 'tutorial' | 'settings';

const safeReturnMap: Partial<Record<GameSceneId, GameSceneId>> = {
  'first-evidence': 'opening',
  'first-deduction': 'first-evidence',
  interrogation: 'first-deduction',
  deduction: 'interrogation',
  story: 'title',
  camp: 'story',
  document: 'camp',
  dialogue: 'document',
  investigation: 'dialogue',
  'case-summary': 'interrogation',
  audience: 'enemy-report',
  'network-investigation': 'case-summary',
  'network-deduction': 'network-investigation',
  bait: 'network-deduction',
  'enemy-report': 'bait',
  'final-report': 'enemy-report',
  ending: 'final-report',
};

const sceneLabels: Partial<Record<GameSceneId, { chapter: string; title: string }>> = {
  'first-evidence': { chapter: '第一折', title: '核对赵简口供' },
  'first-deduction': { chapter: '第一折', title: '第一条推断' },
  interrogation: { chapter: '第一折', title: '再问赵简' },
  deduction: { chapter: '第一折', title: '矛盾确认' },
  'case-summary': { chapter: '第一幕', title: '粮道疑云' },
  audience: { chapter: '第六幕', title: '回中军复命' },
  'network-investigation': { chapter: '第二幕', title: '人人有隐情' },
  'network-deduction': { chapter: '第三幕', title: '碎片成军情' },
  bait: { chapter: '第五幕', title: '将计就计' },
  'enemy-report': { chapter: '第六幕', title: '敌军回声' },
  'final-report': { chapter: '第七幕', title: '最终军机报告' },
  ending: { chapter: '尾声', title: '案卷结语' },
  document: { chapter: '案桌', title: '军报核验' },
  dialogue: { chapter: '第一折', title: '人物问询' },
  investigation: { chapter: '文书房', title: '证据核验' },
  camp: { chapter: '中军', title: '军机交办' },
  story: { chapter: '序章', title: '粮道夜袭' },
};

const journalTabs: { id: JournalTab; label: string }[] = [
  { id: 'task', label: '当前目标' },
  { id: 'people', label: '人物' },
  { id: 'intel', label: '文书' },
  { id: 'evidence', label: '线索 / 事实' },
  { id: 'reasoning', label: '泄密链' },
  { id: 'enemy', label: '敌军回声' },
  { id: 'history', label: '历史' },
  { id: 'tutorial', label: '教程' },
  { id: 'settings', label: '设置' },
];

export function CaseNavigator({ sceneId, onBack, onSafeReturn }: CaseNavigatorProps) {
  const { content, state, dispatch, activeSaveSlotId } = useGame();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<JournalTab>('task');
  const [hintLevel, setHintLevel] = useState(0);
  const [manualCueId, setManualCueId] = useState<string | undefined>();
  const [activeCueId, setActiveCueId] = useState<string | undefined>();

  const legacyObjective = caseObjectiveForScene(sceneId, state);
  const currentObjectiveId = selectCurrentObjectiveId(state);
  const coreObjective = objectiveById(currentObjectiveId);
  const hint = suggestedHintForScene(sceneId, state);
  const canBack = (state.presentation.sceneHistory?.length ?? 0) > 0;
  const safeScene = safeReturnMap[sceneId];
  const directionCount = selectInvestigableDirectionCount(state);
  const people = useMemo(
    () => guanduCharacterTaskLinks.map((link) => ({
      link,
      person: content.characters.find((person) => person.id === link.characterId)!,
    })),
    [content.characters],
  );
  const readDocs = content.documents.filter((doc) => state.readDocumentIds.includes(doc.id));
  const knownClaims = content.claims.filter((claim) => state.extractedClaimIds.includes(claim.id));
  const label = sceneLabels[sceneId] ?? { chapter: legacyObjective.chapter, title: legacyObjective.title };
  // 最后一环目标完成后目标栏会一直停留在该目标；验证已成立时把问题替换成明确的下一步指引。
  const verifyNetworkDone = coreObjective?.id === 'objective-verify-network' && state.coreLoop.theoryEvaluation.status === 'verified';
  const railQuestion = verifyNetworkDone
    ? '泄密链已被敌军回声验证。回中军复命，把事实、证据链与处置写成最终军机报告。'
    : coreObjective?.question ?? legacyObjective.detail;
  const railAction = verifyNetworkDone
    ? '回中军复命，完成最终军机报告。'
    : legacyObjective.action;

  // Obra Dinn 式的阶段转换反馈：目标链推进时明确播报“上一环完成、下一环是什么”，
  // 避免目标静默切换让玩家不知道自己刚做对了什么。
  const [objectiveAnnounce, setObjectiveAnnounce] = useState<{ title: string; question: string } | null>(null);
  const prevObjectiveRef = useRef(coreObjective?.id);
  useEffect(() => {
    const prev = prevObjectiveRef.current;
    prevObjectiveRef.current = coreObjective?.id;
    if (!prev || !coreObjective || prev === coreObjective.id) return;
    setObjectiveAnnounce({ title: coreObjective.title, question: coreObjective.question });
    const timer = window.setTimeout(() => setObjectiveAnnounce(null), 8000);
    return () => window.clearTimeout(timer);
  }, [coreObjective]);

  useEffect(() => {
    if (state.coreLoop.selectedDossierTarget?.kind !== 'gap') return;
    setTab('reasoning');
    setOpen(true);
    dispatch({ type: 'SET_DOSSIER_TARGET', target: undefined });
  }, [dispatch, state.coreLoop.selectedDossierTarget]);

  useEffect(() => {
    const progressed = resolveGuidanceForProgress(state, guanduGuidanceCues);
    if (progressed !== state) {
      dispatch({ type: 'APPLY_RULE_STATE', state: progressed });
      if (activeCueId && progressed.coreLoop.guidance.cueStates[activeCueId] === 'resolved') setActiveCueId(undefined);
      return;
    }
    if (activeCueId) return;
    const cue = nextProactiveCue(state, guanduGuidanceCues, Date.now());
    if (!cue) return;
    setActiveCueId(cue.id);
    dispatch({ type: 'APPLY_RULE_STATE', state: markCueShown(state, cue.id) });
  }, [activeCueId, dispatch, state]);

  const openAt = (next: JournalTab) => {
    setTab(next);
    setOpen(true);
  };
  const legacyHintText = hintLevel === 1
    ? hint
    : hintLevel === 2
      ? `${hint} 再查看与当前人物直接相关的文书或口供。`
      : `${hint} 若仍无法推进，打开案卷的“线索 / 事实”页核对已经确认的信息。`;
  const manualCue = manualCueId ? guanduGuidanceCues.find((cue) => cue.id === manualCueId) : undefined;
  const manualLevel = manualCueId ? state.coreLoop.guidance.manualHintLevels[manualCueId] ?? 0 : 0;
  const hintPanelLevel = manualCue ? manualLevel : hintLevel;
  const hintPanelText = manualCue ? guidanceText(manualCue, manualLevel) : legacyHintText;
  const highlightedTargetIds = manualCue && manualLevel >= 2 ? [...manualCue.relatedPersonIds, ...manualCue.relatedDocumentIds] : [];
  const relatedHintText = manualCue && manualLevel >= 2
    ? `关联：${manualCue.relatedPersonIds.map((id) => content.characters.find((person) => person.id === id)?.name ?? id).join('、') || '无特定人物'}${manualCue.relatedDocumentIds.length ? ` · ${manualCue.relatedDocumentIds.length} 份相关文书` : ''}`
    : undefined;
  const activeCue = activeCueId ? guanduGuidanceCues.find((cue) => cue.id === activeCueId) : undefined;

  const requestHint = () => {
    const cue = selectManualGuidanceCue(state, guanduGuidanceCues);
    if (!cue) {
      setManualCueId(undefined);
      setHintLevel((value) => Math.min(3, value + 1));
      return;
    }
    const next = requestManualHint(state, cue.id);
    const level = next.coreLoop.guidance.manualHintLevels[cue.id] || 1;
    setManualCueId(cue.id);
    setHintLevel(0);
    dispatch({ type: 'APPLY_RULE_STATE', state: next });
    dispatch({ type: 'USE_HINT', topic: cue.id, level });
  };
  const dismissActiveCue = () => {
    if (!activeCueId) return;
    dispatch({ type: 'APPLY_RULE_STATE', state: dismissCue(state, activeCueId) });
    setActiveCueId(undefined);
  };

  const goToPerson = (personId: EntityId) => {
    dispatch({ type: 'SET_DOSSIER_TARGET', target: { kind: 'person', id: personId } });
    setOpen(false);
    onSafeReturn(personId === 'zhao' ? 'interrogation' : 'network-investigation');
  };
  const addTargetToTheory = (kind: 'person' | 'document' | 'knowledge', id: EntityId) => {
    dispatch({ type: 'SET_DOSSIER_TARGET', target: { kind, id } });
    setOpen(false);
    onSafeReturn('network-deduction');
  };
  const showSourceDocument = (documentId: EntityId) => {
    dispatch({ type: 'SET_DOSSIER_TARGET', target: { kind: 'document', id: documentId } });
    setTab('intel');
  };
  const showRelatedPeople = (claimId: EntityId) => {
    dispatch({ type: 'SET_DOSSIER_TARGET', target: { kind: 'knowledge', id: claimId } });
    setTab('people');
  };

  return <>
    <SceneHeader
      chapter={label.chapter}
      title={label.title}
      onBack={canBack ? onBack : safeScene ? () => onSafeReturn(safeScene) : undefined}
      right={<>
        {activeSaveSlotId ? <span className="scene-header__slot">存档 {activeSaveSlotId.slice(-1)} · 自动保存</span> : null}
        <GameButton variant="secondary" size="sm" audioCue="paper-open" onClick={() => openAt('task')}>当前目标</GameButton>
        <GameButton variant="secondary" size="sm" audioCue="paper-open" onClick={() => openAt('people')}>案卷</GameButton>
        <TaskChip count={Math.max(1, directionCount)} onClick={() => openAt('task')} />
      </>}
    />
    <ObjectiveRail
      title={coreObjective?.title ?? legacyObjective.title}
      question={railQuestion}
      action={railAction}
      directionCount={directionCount}
      onOpenDossier={() => openAt('task')}
      activeCue={activeCue ? { id: activeCue.id, text: activeCue.level1, onDismiss: dismissActiveCue } : undefined}
      onRequestHint={requestHint}
    />
    {objectiveAnnounce ? <div className="v095-objective-toast" role="status">
      <small>阶段目标完成</small>
      <strong>新目标：{objectiveAnnounce.title}</strong>
      <p>{objectiveAnnounce.question}</p>
      <GameButton variant="ghost" size="sm" onClick={() => setObjectiveAnnounce(null)}>知道了</GameButton>
    </div> : null}
    <HintPanel level={hintPanelLevel} text={hintPanelText} relatedText={relatedHintText} onMore={requestHint} onClose={() => { setHintLevel(0); setManualCueId(undefined); }} />
    <DossierSheet open={open} onClose={() => setOpen(false)}>
      <nav className="v09-dossier-tabs" aria-label="案卷分页">
        {journalTabs.map((item) => <GameButton
          key={item.id}
          variant={tab === item.id ? 'secondary' : 'ghost'}
          size="sm"
          aria-pressed={tab === item.id}
          onClick={() => setTab(item.id)}
        >{item.label}</GameButton>)}
      </nav>
      <div className="v09-dossier-page">
        {tab === 'task' && <TaskPage objective={coreObjective} legacyObjective={legacyObjective} state={state} hint={hint} content={content} />}
        {tab === 'people' && <PeoplePage
          people={people}
          content={content}
          state={state}
          onGoPerson={goToPerson}
          onAddToTheory={(id) => addTargetToTheory('person', id)}
          onOpenDocuments={() => setTab('intel')}
          highlightIds={highlightedTargetIds}
        />}
        {tab === 'intel' && <IntelPage
          docs={readDocs}
          total={content.documents.length}
          selectedDocumentId={state.coreLoop.selectedDossierTarget?.kind === 'document' ? state.coreLoop.selectedDossierTarget.id : undefined}
          onGoPerson={goToPerson}
          onAddToTheory={(id) => addTargetToTheory('document', id)}
          highlightIds={highlightedTargetIds}
        />}
        {tab === 'evidence' && <EvidencePage
          claims={knownClaims}
          knowledge={state.coreLoop.knowledge}
          onShowSource={showSourceDocument}
          onShowPeople={showRelatedPeople}
          onAddToTheory={(id) => addTargetToTheory('knowledge', id)}
        />}
        {tab === 'reasoning' && <ReasoningPage state={state} content={content} onGoPerson={goToPerson} onShowSource={showSourceDocument} />}
        {tab === 'enemy' && <EnemyFeedbackPage state={state} />}
        {tab === 'history' && <HistoryPage items={state.dialogueHistory} />}
        {tab === 'tutorial' && <TutorialPage state={state} dispatch={dispatch} />}
        {tab === 'settings' && <SettingsPage state={state} dispatch={dispatch} />}
      </div>
    </DossierSheet>
  </>;
}

function TaskPage({ objective, legacyObjective, hint, state, content }: {
  objective: ReturnType<typeof objectiveById>;
  legacyObjective: ReturnType<typeof caseObjectiveForScene>;
  hint: string;
  state: ReturnType<typeof useGame>['state'];
  content: ReturnType<typeof useGame>['content'];
}) {
  const metrics = [
    ['已读文书', state.readDocumentIds.length],
    ['已录线索', Object.keys(state.coreLoop.knowledge).length],
    ['理论关系', state.coreLoop.theoryEdges.length || state.relationships.length],
    ['调查令', state.investigationPoints],
  ] as const;
  const requiredChecks = (objective?.requiredKnowledgeIds ?? []).map((id) => {
    const status = state.coreLoop.knowledge[id]?.status ?? 'unknown';
    const claim = content.claims.find((item) => item.id === id);
    return { id, label: claim?.text ?? id, known: status === 'supported' || status === 'verified' };
  });
  const optionalChecks = (objective?.optionalKnowledgeIds ?? []).map((id) => {
    const status = state.coreLoop.knowledge[id]?.status ?? 'unknown';
    const claim = content.claims.find((item) => item.id === id);
    return { id, label: claim?.text ?? id, known: status === 'supported' || status === 'verified' };
  });
  return <GameCard className="v09-dossier-task" density="compact" tone="dark">
    <CardHeader><div><small>当前目标</small><h3>{objective?.title ?? legacyObjective.title}</h3><p>{objective?.question ?? legacyObjective.detail}</p></div></CardHeader>
    <CardContent>
      <section className="v09-dossier-order"><small>当前任务</small><strong>{legacyObjective.action}</strong></section>
      {requiredChecks.length ? (
        <section className="v095-objective-checklist" aria-label="目标所需情报核对">
          <small>目标核对清单</small>
          <ul>
            {requiredChecks.map((item) => <li key={item.id} data-known={item.known}><i aria-hidden="true">{item.known ? '✓' : '缺'}</i><span>{item.label}</span></li>)}
          </ul>
          {optionalChecks.length ? <p><b>辅助情报</b>{optionalChecks.map((item) => `${item.known ? '✓' : '○'} ${item.label}`).join('　')}</p> : null}
        </section>
      ) : null}
      <div className="v09-dossier-metrics">{metrics.map(([metricLabel, value]) => <span key={metricLabel}><small>{metricLabel}</small><b>{value}</b></span>)}</div>
    </CardContent>
    <CardFooter><span>卡住时</span><p>{hint}</p></CardFooter>
  </GameCard>;
}

type PeopleEntry = {
  link: (typeof guanduCharacterTaskLinks)[number];
  person: ReturnType<typeof useGame>['content']['characters'][number];
};

function PeoplePage({ people, content, state, onGoPerson, onAddToTheory, onOpenDocuments, highlightIds }: {
  people: PeopleEntry[];
  content: ReturnType<typeof useGame>['content'];
  state: ReturnType<typeof useGame>['state'];
  onGoPerson: (id: EntityId) => void;
  onAddToTheory: (id: EntityId) => void;
  onOpenDocuments: () => void;
  highlightIds: EntityId[];
}) {
  const targetPerson = state.coreLoop.selectedDossierTarget?.kind === 'person' ? state.coreLoop.selectedDossierTarget.id : undefined;
  const targetKnowledge = state.coreLoop.selectedDossierTarget?.kind === 'knowledge' ? state.coreLoop.selectedDossierTarget.id : undefined;
  const inferredPerson = targetKnowledge
    ? state.coreLoop.knowledge[targetKnowledge]?.relatedPersonIds[0]
    : undefined;
  const [selected, setSelected] = useState<string>(targetPerson ?? inferredPerson ?? 'caocao');
  const entry = people.find(({ link }) => link.characterId === selected);
  const presentation = selected === 'caocao'
    ? dialogueCharacterFor('caocao')
    : entry ? dialogueCharacterFor(entry.link.characterId) : undefined;
  const known = entry ? entry.link.claimIds.filter((id) => state.extractedClaimIds.includes(id)).length : 0;
  const personKnowledge = entry
    ? entry.link.claimIds.map((id) => state.coreLoop.knowledge[id]).filter(Boolean)
    : [];
  const strongestStatus = personKnowledge.find((item) => item.status === 'verified')?.status
    ?? personKnowledge.find((item) => item.status === 'supported')?.status
    ?? personKnowledge.find((item) => item.status === 'contradicted')?.status
    ?? personKnowledge.find((item) => item.status === 'suspected')?.status
    ?? personKnowledge.find((item) => item.status === 'observed')?.status;

  return <section className="v09-people-browser">
    <nav aria-label="人物索引">
      <GameButton variant={selected === 'caocao' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSelected('caocao')}>曹操</GameButton>
      {people.map(({ person, link }) => <GameButton key={link.characterId} data-guidance-highlight={highlightIds.includes(link.characterId)} variant={selected === link.characterId ? 'secondary' : 'ghost'} size="sm" onClick={() => setSelected(link.characterId)}>{person.name}</GameButton>)}
    </nav>
    <GameCard className="v09-people-browser__detail" density="default" tone="dark">
      <CardContent>
        <div className="v09-people-browser__portrait">{presentation ? <CharacterPortrait
          character={presentation.portrait}
          mood={selected === 'caocao' ? 'thinking' : known >= Math.ceil((entry?.link.claimIds.length ?? 1) / 2) ? 'thinking' : presentation.defaultMood}
          label={selected === 'caocao' ? '曹操' : entry?.person.name ?? ''}
        /> : null}</div>
        {selected === 'caocao' ? <div className="v09-people-browser__copy">
          <header><div><small>司空 · 行车骑将军事</small><h3>曹操</h3></div><GameBadge>阶段评价者</GameBadge></header>
          <p><strong>与你的关系</strong>交办、追问、授权与最终评价，不替你判断案情。</p>
          <p><strong>阶段职责</strong>完整泄密链成立后听取复命；敌军回声后要求提交“事实 / 证据链 / 处置”报告。</p>
          <p><strong>下一步</strong>关键调查节点完成后回中军复命。</p>
        </div> : entry ? <div className="v09-people-browser__copy">
          <header><div><small>{entry.person.role}</small><h3>{entry.person.name}</h3></div>{strongestStatus ? <KnowledgeStatusBadge status={strongestStatus} /> : <GameBadge>待核</GameBadge>}</header>
          <p><strong>当前疑点</strong>{entry.link.suspicion}</p>
          <p><strong>责任边界</strong>{known >= Math.ceil(entry.link.claimIds.length / 2) ? entry.link.verifiedResponsibility : '证据尚不足，不能定性。'}</p>
          <p><strong>下一步</strong>{entry.link.nextAction}</p>
          <p><strong>制度注</strong>{historicalRoleNotes[entry.link.characterId].systemNote}</p>
          <footer>{entry.link.documentIds.map((id) => <span key={id}>{content.documents.find((doc) => doc.id === id)?.title ?? id}</span>)}</footer>
          <div className="v095-dossier-actions">
            <GameButton variant="secondary" size="sm" onClick={() => onGoPerson(entry.link.characterId)}>前去询问</GameButton>
            <GameButton variant="ghost" size="sm" onClick={onOpenDocuments}>查看关联文书</GameButton>
            <GameButton variant="ghost" size="sm" onClick={() => onAddToTheory(entry.link.characterId)}>加入推演</GameButton>
          </div>
        </div> : null}
      </CardContent>
    </GameCard>
  </section>;
}

function IntelPage({ docs, total, selectedDocumentId, onGoPerson, onAddToTheory, highlightIds }: {
  docs: ReturnType<typeof useGame>['content']['documents'];
  total: number;
  selectedDocumentId?: EntityId;
  onGoPerson: (id: EntityId) => void;
  onAddToTheory: (id: EntityId) => void;
  highlightIds: EntityId[];
}) {
  const { state } = useGame();
  const defaultId = selectedDocumentId && docs.some((doc) => doc.id === selectedDocumentId) ? selectedDocumentId : docs[0]?.id;
  const [selected, setSelected] = useState<EntityId | undefined>(defaultId);
  const doc = docs.find((item) => item.id === selected);
  const relatedPeople = doc
    ? [...new Set(doc.claimIds.flatMap((claimId) => state.coreLoop.knowledge[claimId]?.relatedPersonIds ?? []))]
    : [];
  return <GameCard className="v09-dossier-list" density="compact" tone="dark">
    <CardHeader><h3>已启封文书</h3><GameBadge>{docs.length}/{total}</GameBadge></CardHeader>
    <CardContent>
      {docs.length ? <>
        <AnimatedList>{docs.map((item) => <article key={item.id} data-guidance-highlight={highlightIds.includes(item.id)}>
          <i>{item.category === 'report' ? '报' : item.category === 'ledger' ? '册' : '牍'}</i>
          <div><strong>{item.title}</strong><p>{item.body.slice(0, 90)}{item.body.length > 90 ? '…' : ''}</p><GameButton variant="ghost" size="sm" onClick={() => setSelected(item.id)}>查看原件</GameButton></div>
        </article>)}</AnimatedList>
        {doc ? <section className="v095-document-detail" aria-label="文书原件">
          <small>文书原件</small><h4>{doc.title}</h4><p>{doc.body}</p>
          <div className="v095-dossier-actions">
            {relatedPeople.map((personId) => <GameButton key={personId} variant="secondary" size="sm" onClick={() => onGoPerson(personId)}>查看关联人物</GameButton>)}
            <GameButton variant="ghost" size="sm" onClick={() => onAddToTheory(doc.id)}>加入推演</GameButton>
          </div>
        </section> : null}
      </> : <p className="v09-dossier-empty">尚未启封任何文书。</p>}
    </CardContent>
  </GameCard>;
}

function EvidencePage({ claims, knowledge, onShowSource, onShowPeople, onAddToTheory }: {
  claims: ReturnType<typeof useGame>['content']['claims'];
  knowledge: Record<EntityId, KnowledgeEntry>;
  onShowSource: (id: EntityId) => void;
  onShowPeople: (id: EntityId) => void;
  onAddToTheory: (id: EntityId) => void;
}) {
  return <GameCard className="v09-dossier-list" density="compact" tone="dark">
    <CardHeader><h3>线索 / 事实</h3><GameBadge>{claims.length}</GameBadge></CardHeader>
    <CardContent>{claims.length ? <AnimatedList>{claims.map((claim) => {
      const entry = knowledge[claim.id];
      return <article key={claim.id}>
        <i>证</i>
        <div>
          <div className="v095-evidence-heading"><strong>{claim.text}</strong>{entry ? <KnowledgeStatusBadge status={entry.status} /> : null}</div>
          <p>{claim.tags.join(' · ') || '已收入案卷'}</p>
          <div className="v095-dossier-actions">
            <GameButton variant="ghost" size="sm" onClick={() => onShowSource(claim.sourceDocumentId)}>查看来源</GameButton>
            <GameButton variant="ghost" size="sm" onClick={() => onShowPeople(claim.id)}>找相关人物</GameButton>
            <GameButton variant="secondary" size="sm" onClick={() => onAddToTheory(claim.id)}>加入泄密链</GameButton>
          </div>
        </div>
      </article>;
    })}</AnimatedList> : <p className="v09-dossier-empty">尚未形成可用线索。</p>}</CardContent>
  </GameCard>;
}

function ReasoningPage({ state, content, onGoPerson, onShowSource }: {
  state: ReturnType<typeof useGame>['state'];
  content: ReturnType<typeof useGame>['content'];
  onGoPerson: (id: EntityId) => void;
  onShowSource: (id: EntityId) => void;
}) {
  const labelFor = (id: string) => content.claims.find((claim) => claim.id === id)?.text
    ?? content.characters.find((person) => person.id === id)?.name
    ?? state.coreLoop.theoryNodes.find((node) => node.id === id)?.label
    ?? id;
  const edges = state.coreLoop.theoryEdges;
  const legacyRelationships = state.relationships;
  return <GameCard className="v09-dossier-reasoning" density="compact" tone="dark">
    <CardHeader><div><h3>泄密链</h3><p>可以在链条不完整时反复回来补查。</p></div><GameBadge>{state.coreLoop.theoryEvaluation.status}</GameBadge></CardHeader>
    <CardContent>
      {edges.length ? edges.map((edge) => <div key={edge.id}><span>{labelFor(edge.fromId)}</span><b>{edge.relation === 'transmitsTo' ? '传递' : edge.relation === 'infers' ? '推断' : edge.relation === 'accessedBy' ? '接触' : '关联'}</b><span>{labelFor(edge.toId)}</span></div>)
        : legacyRelationships.length ? legacyRelationships.map((rel, index) => <div key={`${rel.fromId}-${rel.toId}-${index}`}><span>{labelFor(rel.fromId)}</span><b>{rel.kind === 'refutes' ? '矛盾' : rel.kind === 'supports' ? '印证' : rel.kind === 'transmitsTo' ? '传递' : '关联'}</b><span>{labelFor(rel.toId)}</span></div>)
          : <p className="v09-dossier-empty">泄密链尚未建立，可以提前进入推演寻找缺口。</p>}
      {state.coreLoop.theoryEvaluation.gaps.length ? <section className="v095-gap-list" aria-label="当前理论缺口">
        <h4>当前缺口</h4>
        {state.coreLoop.theoryEvaluation.gaps.map((gap) => <article key={gap.id}><div><strong>{gap.title}</strong><p>{gap.description}</p></div><div className="v095-dossier-actions">{gap.suggestedPersonIds.map((id) => <GameButton key={id} size="sm" variant="secondary" onClick={() => onGoPerson(id)}>查相关人物</GameButton>)}{gap.suggestedDocumentIds.map((id) => <GameButton key={id} size="sm" variant="ghost" onClick={() => onShowSource(id)}>查相关文书</GameButton>)}</div></article>)}
      </section> : null}
    </CardContent>
  </GameCard>;
}

function EnemyFeedbackPage({ state }: { state: ReturnType<typeof useGame>['state'] }) {
  return <GameCard className="v09-dossier-list" density="compact" tone="dark">
    <CardHeader><h3>敌军回声</h3><GameBadge>{state.coreLoop.enemyFeedback.length}</GameBadge></CardHeader>
    <CardContent>{state.coreLoop.enemyFeedback.length ? <AnimatedList>{state.coreLoop.enemyFeedback.map((feedback) => <article key={feedback.id}><i>回</i><div><strong>{feedback.source === 'no-response' ? '无明显反应' : feedback.source === 'scout' ? '斥候回报' : feedback.source === 'market' ? '市价回声' : '截获情报'}</strong><p>{feedback.text}</p></div></article>)}</AnimatedList> : <p className="v09-dossier-empty">尚未部署投饵，或还没有收到敌军回声。</p>}</CardContent>
  </GameCard>;
}

function HistoryPage({ items }: { items: ReturnType<typeof useGame>['state']['dialogueHistory'] }) {
  return <GameCard className="v09-history-page" density="compact" tone="dark"><CardHeader><h3>对话记录</h3><GameBadge>{items.length}</GameBadge></CardHeader><CardContent>{items.length ? [...items].reverse().map((item) => <article key={item.id}><strong>{item.speakerName}</strong><p>{item.text}</p></article>) : <p className="v09-dossier-empty">关键对白会在这里保留，方便回看。</p>}</CardContent></GameCard>;
}

function TutorialPage({ state, dispatch }: { state: ReturnType<typeof useGame>['state']; dispatch: ReturnType<typeof useGame>['dispatch'] }) {
  return <GameCard className="v09-tutorial-manual" density="compact" tone="dark">
    <CardHeader><div><small>按需学习</small><h3>军机查案教程</h3><p>第一次用什么，才教什么。这里仅用于回看。</p></div></CardHeader>
    <CardContent>
      {tutorialLessons.map((lesson, index) => <details key={lesson.id} open={index === 0}><summary><span>{String(index + 1).padStart(2, '0')}</span><strong>{lesson.title}</strong></summary><p>{lesson.body}</p><ol>{lesson.steps.map((step) => <li key={step}>{step}</li>)}</ol></details>)}
      <details><summary><span>制</span><strong>制度与文书速查</strong></summary><p>角色为架空人物，文书与传递玩法借汉代简牍制度语言表达。</p><ul>{historicalDocumentLexicon.map((item) => <li key={item.term}><b>{item.term}</b><span>{item.note}</span></li>)}</ul><h4>传递方式</h4><ul>{historicalTransmissionMethods.map((item) => <li key={item.term}><b>{item.term}</b><span>{item.note}</span></li>)}</ul></details>
      <details><summary><span>图</span><strong>官渡地理说明</strong></summary><ul>{guanduGeographyNotes.map((note) => <li key={note}>{note}</li>)}</ul></details>
    </CardContent>
    <CardFooter><label><input type="checkbox" checked={state.tutorial.enabled ?? true} onChange={(event) => dispatch({ type: 'SET_TUTORIAL_ENABLED', enabled: event.target.checked })} />首次进入玩法时显示情境教程</label><GameButton variant="ghost" size="sm" audioCue="journal-tab" onClick={() => { dispatch({ type: 'RESET_TUTORIAL' }); dispatch({ type: 'SET_TUTORIAL_ENABLED', enabled: true }); }}>重置教程进度</GameButton></CardFooter>
  </GameCard>;
}

function SettingsPage({ state, dispatch }: { state: ReturnType<typeof useGame>['state']; dispatch: ReturnType<typeof useGame>['dispatch'] }) {
  const { activeSaveSlotId, returnToTitle } = useGame();
  const enabled = state.audio?.enabled ?? true;
  const voice = state.audio?.voiceEnabled ?? true;
  return <GameCard className="v09-settings" density="compact" tone="dark">
    <CardHeader><div><small>声音与辅助</small><h3>游戏设置</h3></div><GameBadge>{activeSaveSlotId ? `存档 ${activeSaveSlotId.slice(-1)}` : '未绑定存档'}</GameBadge></CardHeader>
    <CardContent>
      <div className="v09-settings__row"><span>界面 / 场景音效</span><GameButton variant={enabled ? 'secondary' : 'ghost'} size="sm" onClick={() => dispatch({ type: 'SET_AUDIO_SETTINGS', settings: { enabled: !enabled } })}>{enabled ? '开启' : '关闭'}</GameButton></div>
      <div className="v09-settings__row"><span>关键短句语音</span><GameButton variant={voice ? 'secondary' : 'ghost'} size="sm" disabled={!enabled} onClick={() => dispatch({ type: 'SET_AUDIO_SETTINGS', settings: { voiceEnabled: !voice } })}>{voice ? '开启' : '关闭'}</GameButton></div>
      <label className="v09-settings__row"><span>总体音量</span><input type="range" min="0" max="1" step="0.05" value={state.audio?.volume ?? 0.72} disabled={!enabled} onChange={(event) => dispatch({ type: 'SET_AUDIO_SETTINGS', settings: { volume: Number(event.target.value) } })} /></label>
    </CardContent>
    <CardFooter><p>当前案卷会自动保存。返回标题后可重新进入存档选择页查看其他进度。</p><GameButton variant="ghost" size="sm" onClick={returnToTitle}>保存并返回标题</GameButton></CardFooter>
  </GameCard>;
}
