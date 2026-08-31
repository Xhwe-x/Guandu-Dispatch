import { useGame } from '../../app/GameProvider';
import { composeEpilogue } from '../../game/rules/ending';
import { evaluateReport } from '../../game/rules/report';
import { GameButton as V09Button } from '../../ui/primitives/GameButton';
import { SceneFocusHeader } from '../../ui/game/SceneFocusHeader';
import { CardContent, CardFooter, CardHeader, GameCard } from '../../ui/primitives/GameCard';
import { AnimatedList } from '../../ui/motion/AnimatedList';
import { GameButton } from '../ui/GameButton';

const owners = [
  { id: 'canghe' as const, name: '交给曹军', mark: '军', text: '让中军掌握完整证据，换取最彻底的纪律追查。' },
  { id: 'shuoyuan' as const, name: '转交袁军', mark: '敌', text: '以真相换取新的政治位置，也意味着背离当前阵营。' },
  { id: 'lishe' as const, name: '留给官渡里社', mark: '里', text: '让地方保存证据，优先保护被战争裹挟的人。' },
  { id: 'destroyed' as const, name: '销毁关键卷宗', mark: '火', text: '不让任何势力独占真相，也放弃继续追责的凭据。' },
];
const outcomeLabels = { networkClosed: '封网成功', convoySavedIncomplete: '保粮未封网', ambushedAgain: '再次遇伏' } as const;

export function EndingScene() {
  const { content, dispatch, state, startNewCase } = useGame();
  if (!state.report || !state.baitBand || !state.actionOutcome) {
    return <main className="v09-ending"><SceneFocusHeader eyebrow="结案" title="真相归属" description="最终报告尚未形成，无法生成结局。" /></main>;
  }
  const evaluation = evaluateReport(state.report, state.baitBand);
  const epilogue = state.truthOwner ? composeEpilogue(content, { owner: state.truthOwner, report: evaluation, personStates: state.personStates }) : undefined;

  return (
    <main className="v09-ending" aria-labelledby="ending-title" data-outcome={state.actionOutcome}>
      <SceneFocusHeader eyebrow="官渡密报 · 结案" title="真相归属" description={`${outcomeLabels[state.actionOutcome]}。行动结果已经发生，最后一个选择只决定谁拥有完整证据。`} id="ending-title" />
      {!epilogue ? (
        <GameCard className="v09-ending__choice-card" density="default" tone="dark">
          <CardHeader><div><small>最后选择</small><h2>这份真相交给谁？</h2><p>政治选择不会修正之前的错误推理，只会改变证据归属与人物命运。</p></div></CardHeader>
          <CardContent><div className="v09-ending__choices">{owners.map((owner) => <V09Button key={owner.id} variant="secondary" size="lg" className="v09-ending__choice" onClick={() => { dispatch({ type: 'CHOOSE_TRUTH_OWNER', owner: owner.id }); dispatch({ type: 'SET_STAGE', stage: 'ending' }); }}><span><b>{owner.mark}</b><span><strong>{owner.name}</strong><small>{owner.text}</small></span></span></V09Button>)}</div></CardContent>
        </GameCard>
      ) : (
        <GameCard className="v09-ending__epilogue" density="default" tone="paper">
          <CardHeader><div><small>{outcomeLabels[epilogue.outcome]}</small><h2>{owners.find((owner) => owner.id === epilogue.owner)?.name}</h2></div></CardHeader>
          <CardContent><AnimatedList>{epilogue.paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 8)}`}><span>{String(index + 1).padStart(2, '0')}</span>{paragraph}</p>)}</AnimatedList></CardContent>
          <CardFooter><blockquote>“没有一份军令写出全部真相。真正危险的，是有人知道怎样把碎片拼起来。”</blockquote><GameButton variant="command" audioCue="paper-open" onClick={startNewCase} mark="↺">重新开案</GameButton></CardFooter>
        </GameCard>
      )}
    </main>
  );
}
