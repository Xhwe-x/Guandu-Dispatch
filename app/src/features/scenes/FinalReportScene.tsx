import { useState } from 'react';
import { useGame } from '../../app/GameProvider';
import type { ReportDraft, ReportSubmission } from '../../game/domain';
import { evaluateReport } from '../../game/rules/report';
import type { GameSceneId } from '../../game/scenes';
import { GameBadge } from '../../ui/primitives/GameBadge';
import { SceneFocusHeader } from '../../ui/game/SceneFocusHeader';
import { GameButton as V09Button } from '../../ui/primitives/GameButton';
import { CardContent, CardFooter, CardHeader, GameCard } from '../../ui/primitives/GameCard';
import { GameButton } from '../ui/GameButton';

interface FinalReportSceneProps { onComplete: (nextSceneId: GameSceneId) => void; }
const leakedOptions = [
  { id: 'departureTime', label: '出发时辰' }, { id: 'route', label: '运输路线' }, { id: 'convoyScale', label: '车辆规模' },
];
const methodOptions = [
  { id: 'priceCipher', label: '价格表暗号' }, { id: 'stolenOrder', label: '偷取完整军令' }, { id: 'verbal', label: '口头传话' }, { id: 'sealForgery', label: '伪造军印' },
];
const handlingOptions: { id: ReportSubmission['handling']; label: string; text: string }[] = [
  { id: 'differentiate', label: '区分责任', text: '按证据区分违法、受胁迫与主动通敌。' },
  { id: 'cutOff', label: '先断渠道', text: '优先切断商旅与暗号通道，再追责。' },
  { id: 'arrest', label: '立即拘押', text: '以军法为先，快速控制所有嫌疑人。' },
  { id: 'exploit', label: '继续反用', text: '暂不收网，保留渠道继续喂入假情报。' },
];
const evidenceOrder = ['claim-zhao-copied-order', 'claim-zhao-time', 'claim-zhao-coerced', 'claim-du-route', 'claim-price-cipher', 'claim-du-fodder-pattern', 'claim-lu-no-time', 'claim-zheng-no-route', 'claim-shuoyuan-received'];
function toggle(items: string[], id: string) { return items.includes(id) ? items.filter((item) => item !== id) : [...items, id]; }

export function FinalReportScene({ onComplete }: FinalReportSceneProps) {
  const { content, dispatch, state } = useGame();
  const [step, setStep] = useState(0);
  const draft = state.presentation.reportDraft;
  const people = content.characters;
  const evidence = evidenceOrder.map((id) => content.claims.find((claim) => claim.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item) && state.extractedClaimIds.includes(item!.id));
  const stepOneReady = draft.leakedInfo.length > 0 && draft.sourceCharacterIds.length > 0;
  const stepTwoReady = Boolean(draft.integratorId) && Boolean(draft.transmissionMethod) && draft.evidenceClaimIds.length > 0;
  const ready = stepOneReady && stepTwoReady;

  function update(patch: Partial<ReportDraft>) { dispatch({ type: 'SET_REPORT_DRAFT', reportDraft: { ...draft, ...patch } }); }
  function submit() {
    if (!ready || !draft.integratorId || !draft.transmissionMethod) return;
    const report: ReportSubmission = { leakedInfo: draft.leakedInfo, sourceCharacterIds: draft.sourceCharacterIds, integratorId: draft.integratorId, transmissionMethod: draft.transmissionMethod, evidenceClaimIds: draft.evidenceClaimIds, handling: draft.handling };
    const evaluation = evaluateReport(report, state.baitBand ?? 'noneCore');
    dispatch({ type: 'SUBMIT_REPORT', report, outcome: evaluation.outcome });
    dispatch({ type: 'SET_STAGE', stage: 'report' });
    onComplete('ending');
  }

  return (
    <main className="v09-final-report" aria-labelledby="final-report-title">
      <SceneFocusHeader eyebrow="第七幕 · 最终军机报告" title="把判断写成结论" description="事实、证据链与处置分开填写。没有哪一步可以由系统替你作答。" id="final-report-title" status={<span className="v093-step-counter">第 {step + 1}/3 步</span>} />
      <nav className="v09-final-report__steps" aria-label="报告步骤">{['事实', '证据链', '处置'].map((label, index) => <V09Button key={label} variant={step === index ? 'secondary' : 'ghost'} size="sm" className="v09-final-report__step" aria-pressed={step === index} data-done={index === 0 ? stepOneReady : index === 1 ? stepTwoReady : false} onClick={() => setStep(index)}><i>{index + 1}</i><span>{label}</span></V09Button>)}</nav>

      <GameCard className="v09-final-report__card" density="default" tone={step === 2 ? 'paper' : 'dark'}>
        {step === 0 ? <FactsStep draft={draft} people={people} update={update} /> : null}
        {step === 1 ? <ChainStep draft={draft} people={people} evidence={evidence} content={content} update={update} /> : null}
        {step === 2 ? <HandlingStep draft={draft} update={update} /> : null}
        <CardFooter className="v09-final-report__actions">
          {step > 0 ? <GameButton variant="quiet" onClick={() => setStep((value) => Math.max(0, value - 1))}>上一步</GameButton> : <span />}
          {step < 2 ? <GameButton variant="command" disabled={step === 0 ? !stepOneReady : !stepTwoReady} lockedReason={step === 0 && !stepOneReady ? '至少确认一项泄露信息与一名来源人物' : step === 1 && !stepTwoReady ? '确认拼合者、传递方式，并选择至少一条证据' : undefined} onClick={() => setStep((value) => Math.min(2, value + 1))}>继续</GameButton> : <GameButton variant="command" audioCue="seal" disabled={!ready} lockedReason={!ready ? '先完成事实与证据链' : undefined} onClick={submit} mark="印">封印并呈交</GameButton>}
        </CardFooter>
      </GameCard>
    </main>
  );
}

function FactsStep({ draft, people, update }: { draft: ReportDraft; people: ReturnType<typeof useGame>['content']['characters']; update: (patch: Partial<ReportDraft>) => void }) {
  return <><CardHeader><div><small>第一步</small><h2>事实：什么泄露了？谁提供了碎片？</h2></div><GameBadge>{draft.leakedInfo.length + draft.sourceCharacterIds.length} 项已选</GameBadge></CardHeader><CardContent><section className="v09-final-report__group"><h3>泄露信息</h3><div className="v09-final-report__chips">{leakedOptions.map((item) => <V09Button key={item.id} variant={draft.leakedInfo.includes(item.id) ? 'evidence' : 'secondary'} size="md" aria-pressed={draft.leakedInfo.includes(item.id)} onClick={() => update({ leakedInfo: toggle(draft.leakedInfo, item.id) })}>{item.label}</V09Button>)}</div></section><section className="v09-final-report__group"><h3>来源人物</h3><div className="v09-final-report__people">{people.map((person) => <V09Button key={person.id} variant={draft.sourceCharacterIds.includes(person.id) ? 'evidence' : 'secondary'} size="lg" className="v09-final-report__person" aria-pressed={draft.sourceCharacterIds.includes(person.id)} onClick={() => update({ sourceCharacterIds: toggle(draft.sourceCharacterIds, person.id) })}><span><strong>{person.name}</strong><small>{person.role}</small></span></V09Button>)}</div></section></CardContent></>;
}

function ChainStep({ draft, people, evidence, content, update }: { draft: ReportDraft; people: ReturnType<typeof useGame>['content']['characters']; evidence: ReturnType<typeof useGame>['content']['claims']; content: ReturnType<typeof useGame>['content']; update: (patch: Partial<ReportDraft>) => void }) {
  return <><CardHeader><div><small>第二步</small><h2>证据链：谁拼合？如何传出？</h2></div><GameBadge>{draft.evidenceClaimIds.length} 条证据</GameBadge></CardHeader><CardContent><div className="v09-final-report__split"><section className="v09-final-report__group"><h3>拼合者</h3><div className="v09-final-report__chips">{people.map((person) => <V09Button key={person.id} variant={draft.integratorId === person.id ? 'evidence' : 'secondary'} size="md" aria-pressed={draft.integratorId === person.id} onClick={() => update({ integratorId: person.id })}>{person.name}</V09Button>)}</div></section><section className="v09-final-report__group"><h3>传递方式</h3><div className="v09-final-report__chips">{methodOptions.map((item) => <V09Button key={item.id} variant={draft.transmissionMethod === item.id ? 'evidence' : 'secondary'} size="md" aria-pressed={draft.transmissionMethod === item.id} onClick={() => update({ transmissionMethod: item.id })}>{item.label}</V09Button>)}</div></section></div><section className="v09-final-report__group"><h3>钉入报告的证据</h3><div className="v09-final-report__evidence">{evidence.map((claim) => <V09Button key={claim.id} variant={draft.evidenceClaimIds.includes(claim.id) ? 'evidence' : 'secondary'} size="lg" className="v09-final-report__evidence-item" aria-pressed={draft.evidenceClaimIds.includes(claim.id)} onClick={() => update({ evidenceClaimIds: toggle(draft.evidenceClaimIds, claim.id) })}><span><small>{content.documents.find((doc) => doc.id === claim.sourceDocumentId)?.title ?? '案卷'}</small><strong>{claim.text}</strong></span></V09Button>)}</div></section></CardContent></>;
}

function HandlingStep({ draft, update }: { draft: ReportDraft; update: (patch: Partial<ReportDraft>) => void }) {
  return <><CardHeader><div><small>第三步</small><h2>处置：你建议主公怎么做？</h2></div></CardHeader><CardContent><div className="v09-final-report__handling">{handlingOptions.map((item) => <V09Button key={item.id} variant={draft.handling === item.id ? 'evidence' : 'secondary'} size="lg" className="v09-final-report__handling-item" aria-pressed={draft.handling === item.id} onClick={() => update({ handling: item.id })}><span><strong>{item.label}</strong><small>{item.text}</small></span></V09Button>)}</div></CardContent></>;
}
