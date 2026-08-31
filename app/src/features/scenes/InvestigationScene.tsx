import { useState } from 'react';
import { useGame } from '../../app/GameProvider';
import { applyInvestigation } from '../../game/rules/investigation';
import type { GameSceneId } from '../../game/scenes';
import { GameButton } from '../ui/GameButton';

interface InvestigationSceneProps {
  onComplete: (nextSceneId: GameSceneId) => void;
}

const handwritingInvestigationId = 'investigate-handwriting';
const correctFindings = ['hook-stroke', 'cart-stroke'];

const features = [
  { id: 'hook-stroke', glyph: '寅', title: '“寅”字收锋', description: '两份文书末捺都在落笔前回锋，角度一致。', correct: true },
  { id: 'cart-stroke', glyph: '車', title: '“車”字折笔', description: '横折向内收窄，末横略向右上挑。', correct: true },
  { id: 'spacing', glyph: '令', title: '行距偏窄', description: '军令行距更紧，但可能来自纸幅不同，不能单独证明同一人。', correct: false },
];

export function InvestigationScene({ onComplete }: InvestigationSceneProps) {
  const { content, dispatch, state } = useGame();
  const [overlay, setOverlay] = useState(false);
  const [message, setMessage] = useState('');
  const investigation = content.investigations.find((item) => item.id === handwritingInvestigationId);
  const completed = state.completedInvestigationIds.includes(handwritingInvestigationId);
  const marked = state.presentation.handwritingFindingIds;
  const hasEnough = correctFindings.every((id) => marked.includes(id));

  if (!investigation) {
    return <main className="evidence-desk"><p role="alert">笔迹核验资料暂不可用，请稍后重试。</p></main>;
  }

  function markFeature(id: string, correct: boolean) {
    dispatch({ type: 'MARK_HANDWRITING_FINDING', findingId: id });
    setMessage(correct ? '这处特征具有比对价值，再找一处稳定笔势。' : '这处差异可能只是纸幅与排版造成，证据强度不足。');
  }

  function investigate() {
    if (!hasEnough) {
      setMessage('至少确认两处稳定笔势后，才能形成笔迹结论。');
      return;
    }
    try {
      const result = applyInvestigation(content, state, handwritingInvestigationId);
      dispatch({ type: 'APPLY_RULE_STATE', state: result.state });
      dispatch({ type: 'SET_TUTORIAL_STEP', step: 'interrogateZhao' });
      setMessage('核验成立：集合命令与赵简日常誊抄存在两处稳定同源笔势。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '调查未能完成，请稍后重试。');
    }
  }

  return (
    <main className="evidence-desk evidence-desk--handwriting" aria-labelledby="investigation-scene-title">
      <section className="evidence-workspace evidence-workspace--wide">
        <header className="evidence-workspace__heading">
          <div><p className="scene-kicker">文书房 · 笔迹核验</p><h1 id="investigation-scene-title">{investigation.title}</h1></div>
          <p>把集合文书与赵简平日誊抄并置，找出至少两处稳定笔势。调查令只在确认结论时消耗。</p>
        </header>

        <div className="handwriting-bench" data-overlay={overlay}>
          <article className="handwriting-sheet handwriting-sheet--order">
            <small>集合命令 · 抄件</small>
            <strong>寅初集合　車二十四</strong>
            <p>各营辎重，于北栅候令，不得迟误。</p>
            <span className="handwriting-sheet__sig">赵简誊</span>
          </article>
          <div className="handwriting-lens" aria-hidden="true">鉴</div>
          <article className="handwriting-sheet handwriting-sheet--daily">
            <small>值簿 · 日常誊抄</small>
            <strong>寅时校簿　車具点验</strong>
            <p>夜差交替如常，封匣后送中军。</p>
            <span className="handwriting-sheet__sig">赵简</span>
          </article>
        </div>

        <div className="handwriting-tools">
          <button className="scene-button scene-button--quiet" type="button" aria-pressed={overlay} onClick={() => setOverlay((value) => !value)}>
            {overlay ? '退出叠纸比对' : '叠纸透光比对'}
          </button>
          <div className="investigation-tallies" aria-label="调查令">
            {[0, 1, 2].map((index) => (
              <span key={index} aria-label={index >= state.investigationPoints ? '已用调查令' : '未用调查令'} className={index >= state.investigationPoints ? 'investigation-tally investigation-tally--spent' : 'investigation-tally'} />
            ))}
          </div>
        </div>

        <div className="handwriting-findings" role="group" aria-label="笔势特征">
          {features.map((feature) => {
            const selected = marked.includes(feature.id);
            return (
              <button key={feature.id} className="handwriting-feature" data-audio-cue="evidence-place" data-selected={selected} type="button" onClick={() => markFeature(feature.id, feature.correct)}>
                <b>{feature.glyph}</b><span><strong>{feature.title}</strong><small>{feature.description}</small></span>{selected && <i>朱批</i>}
              </button>
            );
          })}
        </div>

        <p className="slice-scene__status" role="status" aria-live="polite">{completed ? '笔迹结论已入案：集合命令确由赵简亲笔誊抄。' : message}</p>
        <div className="scene-actions scene-actions--right">
          <GameButton variant="command" audioCue="seal" onClick={investigate} disabled={completed || state.investigationPoints < investigation.cost || !hasEnough} mark="印">确认笔迹结论</GameButton>
          <GameButton variant="secondary" audioCue="tent-enter" onClick={() => onComplete('interrogation')} disabled={!completed} mark="›">携证回帐质询</GameButton>
        </div>
      </section>
    </main>
  );
}
