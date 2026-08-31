import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../app/GameProvider';
import { finalAudienceChoices, firstAudienceRoundOne, firstAudienceRoundTwo, type AudienceChoice } from '../../content/guandu/audiences';
import type { CaoCaoAttitude } from '../../game/domain';
import type { GameSceneId } from '../../game/scenes';
import { GameBadge } from '../../ui/primitives/GameBadge';
import { useGameAudio } from '../audio/GameAudio';
import { GameButton } from '../ui/GameButton';
import { ChoiceStrip } from '../ui/ChoiceStrip';

interface AudienceSceneProps { onComplete: (nextSceneId: GameSceneId) => void; }

type AudiencePhase = 'arrival' | 'salute' | 'question' | 'choice-one' | 'response-one' | 'evidence' | 'choice-two' | 'response-two' | 'order';

const phaseOrder: AudiencePhase[] = ['arrival', 'salute', 'question', 'choice-one', 'response-one', 'evidence', 'choice-two', 'response-two', 'order'];
const attitudeLabel: Record<CaoCaoAttitude, string> = { observing: '审视', calm: '平静', approving: '认可', displeased: '不悦' };

export function AudienceScene({ onComplete }: AudienceSceneProps) {
  const { dispatch, state } = useGame();
  const { play, speak, stopVoice } = useGameAudio();
  const audience = state.presentation.audience ?? { visitId: 'first-report' as const, shotIndex: 0, attitude: 'observing' as const, choiceIds: [] as string[] };
  const finalVisit = audience.visitId === 'final-report';
  const [response, setResponse] = useState('');
  const [selectedOne, setSelectedOne] = useState<AudienceChoice | null>(null);
  const [selectedTwo, setSelectedTwo] = useState<AudienceChoice | null>(null);
  const finalPhases: AudiencePhase[] = ['arrival', 'salute', 'question', 'choice-one', 'response-one', 'order'];
  const phase = finalVisit
    ? finalPhases[Math.min(audience.shotIndex, finalPhases.length - 1)]
    : phaseOrder[Math.min(audience.shotIndex, phaseOrder.length - 1)];

  useEffect(() => () => stopVoice(), [stopVoice]);

  // 台词延迟播报的定时器在卸载时统一清理，避免离开场景后仍然出声。
  const pendingVoices = useRef<number[]>([]);
  useEffect(() => () => { pendingVoices.current.forEach((timer) => window.clearTimeout(timer)); }, []);
  function speakLater(text: string, voice: Parameters<typeof speak>[1], delayMs: number) {
    pendingVoices.current.push(window.setTimeout(() => speak(text, voice), delayMs));
  }

  const summaryClaims = useMemo(() => [
    ['时辰渠道', state.extractedClaimIds.includes('claim-zhao-time') ? '赵简已承认接触并泄出时辰' : '仍待确认'],
    ['路线渠道', state.extractedClaimIds.includes('claim-du-route') ? '杜衡可从物资与道路迹象推出路线' : '尚未查明'],
    ['信息合流', state.extractedClaimIds.includes('claim-du-route') ? '碎片情报最终在杜衡一侧完成拼合' : '尚未成立'],
    ['敌军回声', state.enemyReport ? '投饵后敌军行动已形成反证' : '尚未投饵验证'],
  ], [state.enemyReport, state.extractedClaimIds]);

  function next() {
    play(phase === 'order' ? 'seal' : 'paper-open');
    dispatch({ type: 'SET_AUDIENCE_SHOT', shotIndex: audience.shotIndex + 1 });
  }

  function choose(choice: AudienceChoice, round: 1 | 2) {
    dispatch({ type: 'RECORD_AUDIENCE_CHOICE', choiceId: choice.id, attitude: choice.attitude });
    setResponse(choice.response);
    if (round === 1) setSelectedOne(choice); else setSelectedTwo(choice);
    if (choice.playerVoice) speak(choice.playerVoice, 'officer');
    if (choice.caocaoVoice) speakLater(choice.caocaoVoice, 'caocao', 420);
    dispatch({ type: 'SET_AUDIENCE_SHOT', shotIndex: audience.shotIndex + 1 });
  }

  function finish() {
    play('task-unlock');
    speak('臣领命。', 'officer');
    dispatch({ type: 'SET_AUDIENCE_SHOT', shotIndex: 0 });
    onComplete(finalVisit ? 'final-report' : 'bait');
  }

  const firstChoices = finalVisit ? finalAudienceChoices : firstAudienceRoundOne;
  const secondChoices = firstAudienceRoundTwo;
  const orderVoice = finalVisit
    ? '把事实、责任与处置分开写。孤不要一个替死鬼，也不要一张糊涂军报。'
    : '你既已把碎片链拼出来，就别只会收网。说说看，这条线能不能反过来为我所用。';

  useEffect(() => {
    if (phase === 'order') speak(orderVoice, 'caocao');
  }, [orderVoice, phase, speak]);

  const currentLine = audienceLineForPhase({ phase, finalVisit, response, selectedOne, selectedTwo });

  return (
    <main className="v09-audience" aria-labelledby="audience-title" data-phase={phase} data-visit={audience.visitId}>
      <section className="v09-audience__stage" aria-label="中军大帐">
        <img src="/assets/cg/audience-caocao.png" alt="曹操在中军大帐听取查案官复命" />
        <div className="v09-audience__shade" aria-hidden="true" />
        <header className="v09-audience__meta">
          <div>
            <span>{finalVisit ? '终局复命' : '第四幕 · 觐见曹操'}</span>
            <h1 id="audience-title">中军大帐</h1>
          </div>
          <GameBadge data-attitude={audience.attitude}>主公 · {attitudeLabel[audience.attitude]}</GameBadge>
        </header>

        {phase === 'evidence' ? (
          <aside className="v09-audience__evidence" aria-label="本次复命证据摘要">
            <span>案卷摘要</span>
            <div>{summaryClaims.slice(0, 3).map(([label, value]) => <p key={label}><small>{label}</small><strong>{value}</strong></p>)}</div>
          </aside>
        ) : null}

        <section className="v09-audience__dialogue" aria-live="polite">
          {phase === 'arrival' ? (
            <>
              <p className="v09-audience__narration">夜色压营。军图未卷，曹操已在灯下等候。你将案袋收入袖下，随侍卫入帐。</p>
              <div className="v09-audience__action"><GameButton variant="command" audioCue="tent-enter" mark="›" onClick={() => { play('tent-enter'); next(); }}>入帐觐见</GameButton></div>
            </>
          ) : null}

          {phase === 'salute' ? (
            <>
              <DialogueExchange lines={[['查案官', '臣参见主公。'], ['曹操', '起身，坐前回话。']]} />
              <div className="v09-audience__action"><GameButton variant="command" audioCue="ui-confirm" mark="›" onClick={() => { speak('参见主公。', 'officer'); speakLater('起身，坐前回话。', 'caocao', 650); next(); }}>坐前回话</GameButton></div>
            </>
          ) : null}

          {phase !== 'arrival' && phase !== 'salute' && phase !== 'choice-one' && phase !== 'choice-two' ? (
            <>
              {currentLine ? <DialogueExchange lines={[currentLine]} /> : null}
              {phase === 'evidence' ? <p className="v09-audience__support">主公不问“谁最可疑”，只问每一段情报分别从哪里来，又如何拼成敌军能用的军情。</p> : null}
              {phase === 'order' ? (
                <div className="v09-audience__order"><span>中军手令</span><strong>{finalVisit ? '据敌军回声，完成最终军机结案。' : '按已查明的渠道分别投饵，用敌军行动反证泄密链。'}</strong></div>
              ) : null}
              <AudienceNextAction
                phase={phase}
                finalVisit={finalVisit}
                onNext={next}
                onFinish={finish}
                onQuestionVoice={() => { if (!finalVisit) speak('你查到什么，便说什么。', 'caocao'); }}
              />
            </>
          ) : null}

          {phase === 'choice-one' ? <AudienceChoices choices={firstChoices} state={state} onChoose={(choice) => choose(choice, 1)} /> : null}
          {phase === 'choice-two' && !finalVisit ? <AudienceChoices choices={secondChoices} state={state} onChoose={(choice) => choose(choice, 2)} /> : null}
        </section>
      </section>
    </main>
  );
}

function audienceLineForPhase({ phase, finalVisit, response, selectedOne, selectedTwo }: {
  phase: AudiencePhase;
  finalVisit: boolean;
  response: string;
  selectedOne: AudienceChoice | null;
  selectedTwo: AudienceChoice | null;
}): [string, string] | null {
  if (phase === 'question') return ['曹操', finalVisit ? '假令已经放出，敌军也动了。孤只问你：这条泄密链，查活了没有？' : '粮道三遭扰袭，不会只是敌骑侥幸。你既已查到碎片成链，就把证据说清楚。'];
  if (phase === 'response-one') return ['曹操', response || selectedOne?.response || '说下去。'];
  if (phase === 'evidence') return ['曹操', '既然没有一人掌握完整粮道，你凭什么断定时辰来自赵简、路线由杜衡推出，又凭什么认定碎片最终在杜衡手里合流？'];
  if (phase === 'response-two') return ['曹操', response || selectedTwo?.response || '孤听着。'];
  if (phase === 'order') return ['曹操', finalVisit ? '把事实、责任与处置分开写。孤不要一个替死鬼，也不要一张糊涂军报。' : '你既已把碎片链拼出来，就别只会收网。按渠道分别投饵，用敌军的行动来替你验最后一遍。'];
  return null;
}

function AudienceNextAction({ phase, finalVisit, onNext, onFinish, onQuestionVoice }: {
  phase: AudiencePhase;
  finalVisit: boolean;
  onNext: () => void;
  onFinish: () => void;
  onQuestionVoice: () => void;
}) {
  if (phase === 'question') return <div className="v09-audience__action"><GameButton variant="command" audioCue="ui-confirm" mark="›" onClick={() => { onQuestionVoice(); onNext(); }}>陈明所查</GameButton></div>;
  if (phase === 'response-one') return <div className="v09-audience__action"><GameButton variant="command" audioCue="paper-open" mark="›" onClick={onNext}>{finalVisit ? '听主公定夺' : '呈上证据'}</GameButton></div>;
  if (!finalVisit && phase === 'evidence') return <div className="v09-audience__action"><GameButton variant="command" audioCue="paper-open" mark="›" onClick={onNext}>组织第二轮汇报</GameButton></div>;
  if (!finalVisit && phase === 'response-two') return <div className="v09-audience__action"><GameButton variant="command" audioCue="ui-confirm" mark="›" onClick={onNext}>请主公下令</GameButton></div>;
  if (phase === 'order') return <div className="v09-audience__action"><GameButton variant="command" audioCue="task-unlock" mark="›" onClick={onFinish}>臣领命</GameButton></div>;
  return null;
}

function DialogueExchange({ lines }: { lines: Array<[string, string]> }) {
  return <div className="v09-audience__exchange">{lines.map(([speaker, text], index) => <div key={`${speaker}-${index}`} data-speaker={speaker === '曹操' ? 'caocao' : 'officer'}><b>{speaker}</b><p>{text}</p></div>)}</div>;
}

function AudienceChoices({ choices, state, onChoose }: { choices: AudienceChoice[]; state: ReturnType<typeof useGame>['state']; onChoose: (choice: AudienceChoice) => void }) {
  const enabledChoices = choices.map((choice) => {
    const locked = choice.requires === 'route-channel' && !state.extractedClaimIds.includes('claim-du-route');
    return { id: choice.id, tag: choice.tag, text: choice.text, lockedReason: locked ? '需先查明第二泄密渠道' : undefined };
  });
  return (
    <div className="v09-audience__choices">
      <span>你的回话</span>
      <ChoiceStrip options={enabledChoices} onChoose={(id) => { const choice = choices.find((item) => item.id === id); if (choice) onChoose(choice); }} />
    </div>
  );
}
