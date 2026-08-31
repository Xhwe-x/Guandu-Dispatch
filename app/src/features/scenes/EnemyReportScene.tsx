import { useState } from 'react';
import { useGame } from '../../app/GameProvider';
import { guanduObjectives } from '../../content/guandu/coreLoop';
import { applyEnemyFeedbackResolution } from '../../game/rules/enemyFeedback';
import type { GameSceneId } from '../../game/scenes';
import { GameBadge } from '../../ui/primitives/GameBadge';
import { CardContent, CardHeader, GameCard } from '../../ui/primitives/GameCard';
import { AnimatedList } from '../../ui/motion/AnimatedList';
import { GameButton } from '../ui/GameButton';
import { SceneFocusHeader } from '../../ui/game/SceneFocusHeader';
import { WarMapBackdrop } from '../../ui/game/WarMapBackdrop';

interface EnemyReportSceneProps { onComplete: (nextSceneId: GameSceneId) => void; }
const routes: Record<string, string> = { northBridge: '北桥', southFord: '南渡', westRidge: '西岭' };
const times: Record<string, string> = { zi: '子时', chou: '丑时', yin: '寅时' };

export function EnemyReportScene({ onComplete }: EnemyReportSceneProps) {
  const { dispatch, state } = useGame();
  const enemy = state.enemyReport;
  const real = state.realPlan;
  const band = state.baitBand;
  const experiment = state.coreLoop.baitExperiments.at(-1);
  const alreadyReviewed = Boolean(experiment && state.coreLoop.enemyFeedback.some((item) => item.id.startsWith(experiment.id)));
  const [message, setMessage] = useState('先把敌军行动与实验预期逐项对照。只有两个核心渠道同时出现回声，才把整条理论升级为“已验证”。');
  const theoryVerified = state.coreLoop.theoryEvaluation.status === 'verified';
  const reflectedChannels = !enemy || !real
    ? []
    : [enemy.time !== real.time ? 'zhao' : undefined, enemy.route !== real.route ? 'du' : undefined].filter((item): item is 'zhao' | 'du' => Boolean(item));
  const verdict = band === 'bothCore'
    ? '赵简渠道的假时辰与杜衡渠道的假路线同时出现在袁军行动里。两条核心边可以互相校验。'
    : band === 'oneCore'
      ? '只出现一条核心回声。另一条链仍未验证；这不是失败结算，应回案卷补查或重新设计实验。'
      : '核心假情报没有改变敌军行动。没有反应也是证据，但单次无响应不足以直接推翻整条理论。';
  const findings = [
    enemy ? `袁军集结方向：${routes[enemy.route] ?? enemy.route}` : '尚未收到敌军方向',
    enemy ? `袁军准备时刻：${times[enemy.time] ?? enemy.time}` : '尚未收到敌军时刻',
    verdict,
  ];

  function reviewFeedback() {
    if (!enemy || !real || !band || !experiment) {
      setMessage('实验记录或敌军回报不完整，不能生成验证结论。可以回案卷继续调查。');
      return;
    }
    const resolution = {
      credibleBaitIds: [...experiment.baitIds],
      reflectedChannels,
      enemyReport: enemy,
      baitBand: band,
    };
    const applied = applyEnemyFeedbackResolution(state, experiment, resolution, guanduObjectives, Date.now());
    if (applied.verified) {
      setMessage('双核心回声吻合：敌军行动验证了时辰渠道与路线/价格暗号渠道。泄密链已升级为“已验证”。');
    } else {
      setMessage(band === 'oneCore' ? '只验证到一侧。另一条链仍未验证，案卷保持开放。' : '本轮没有核心回声。保留现有理论为“有证”，回调查寻找新的验证方式。');
    }
    dispatch({ type: 'APPLY_RULE_STATE', state: applied.state });
  }

  const reviewed = alreadyReviewed || theoryVerified;
  return (
    <main className="v09-enemy-report" aria-labelledby="enemy-report-title">
      <WarMapBackdrop />
      <SceneFocusHeader
        eyebrow="第六幕 · 敌军回声"
        title="让敌军行动成为新证据"
        description="回声可以验证，也可以让你重新怀疑某一段关系。没有反应同样收入案卷。"
        id="enemy-report-title"
        status={<GameBadge>{theoryVerified ? '泄密链 · 已验证' : band === 'bothCore' ? '双核心回声' : band === 'oneCore' ? '单核心回声' : '回声不足'}</GameBadge>}
      />
      <GameCard className="v09-enemy-report__scroll" density="default" tone="paper">
        <CardHeader><div><small>戌后急报</small><h2>袁军骑队重新集结</h2></div><b>急</b></CardHeader>
        <CardContent>
          <p>“前锋探马反复试探桥渡，并按新的时刻校正火把与马料。其集结方向与时刻如下。”</p>
          <div className="v09-enemy-report__coordinates"><div><small>方向</small><strong>{enemy ? routes[enemy.route] ?? enemy.route : '尚未回报'}</strong></div><span>·</span><div><small>时刻</small><strong>{enemy ? times[enemy.time] ?? enemy.time : '尚未回报'}</strong></div></div>
        </CardContent>
      </GameCard>
      <section className="v09-enemy-report__comparison">
        <GameBadge>真实计划 · {real ? `${routes[real.route] ?? real.route} / ${times[real.time] ?? real.time}` : '未记录'}</GameBadge>
        <AnimatedList>{findings.map((text, index) => <p key={`${index}-${text}`}>{text}</p>)}</AnimatedList>
      </section>
      <div className="v095-enemy-analysis" role="status">{message}</div>
      <footer className="v09-enemy-report__footer">
        {!reviewed ? <GameButton variant="command" audioCue="seal" disabled={!enemy || !band || !experiment} lockedReason={!experiment ? '缺少投饵实验记录' : !enemy || !band ? '等待完整斥候回报' : undefined} onClick={reviewFeedback} mark="验">分析敌军回声</GameButton> : null}
        {reviewed && !theoryVerified ? <>
          <GameButton variant="secondary" audioCue="paper-open" onClick={() => onComplete('network-investigation')}>回案卷继续调查</GameButton>
          <GameButton variant="secondary" audioCue="seal" onClick={() => onComplete('bait')}>重新设计投饵</GameButton>
        </> : null}
        {theoryVerified ? <GameButton variant="command" audioCue="tent-enter" onClick={() => onComplete('final-report')} mark="›">回中军复命</GameButton> : null}
      </footer>
    </main>
  );
}
