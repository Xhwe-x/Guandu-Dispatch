import { useMemo, useState } from 'react';
import { useGame } from '../../app/GameProvider';
import { guanduObjectives } from '../../content/guandu/coreLoop';
import { gameReducer } from '../../game/reducer';
import { evaluateBaitExperiment } from '../../game/rules/bait';
import { syncObjectivesUntilStable } from '../../game/rules/knowledge';
import type { GameSceneId } from '../../game/scenes';
import { GameBadge } from '../../ui/primitives/GameBadge';
import { GameButton } from '../../ui/primitives/GameButton';
import { CardContent, CardFooter, CardHeader, GameCard } from '../../ui/primitives/GameCard';
import { SceneFocusHeader } from '../../ui/game/SceneFocusHeader';
import { WarMapBackdrop } from '../../ui/game/WarMapBackdrop';

interface BaitSceneProps { onComplete: (nextSceneId: GameSceneId) => void; }
type ChannelId = 'lu' | 'zheng' | 'zhao' | 'du';

const coreChannels: ChannelId[] = ['zhao', 'du'];
const controlChannels: ChannelId[] = ['lu', 'zheng'];
const channelMeta: Record<ChannelId, { name: string; seal: string; purpose: string; tier: 'core' | 'control' }> = {
  zhao: { name: '赵简', seal: '令', purpose: '改变集合时辰，验证“时辰泄露”这一边。', tier: 'core' },
  du: { name: '杜衡', seal: '商', purpose: '改变物流/路线迹象，验证“路线推断 + 价格暗号传递”这一边。', tier: 'core' },
  lu: { name: '陆淳', seal: '驿', purpose: '对照：观察正式邮驿调度是否会被敌军采用。', tier: 'control' },
  zheng: { name: '郑禾', seal: '粮', purpose: '对照：观察车马规模噪声是否会影响敌军。', tier: 'control' },
};
const routeLabels: Record<string, string> = { northBridge: '北桥', southFord: '南渡', westRidge: '西岭' };
const timeLabels: Record<string, string> = { zi: '子时', chou: '丑时', yin: '寅时' };

export function BaitScene({ onComplete }: BaitSceneProps) {
  const { content, dispatch, state } = useGame();
  const realPlan = { route: 'northBridge', time: 'zi' } as const;
  const hasControlSelection = state.selectedBaitIds.some((id) => id.startsWith('bait-lu-') || id.startsWith('bait-zheng-'));
  const [showControls, setShowControls] = useState(hasControlSelection);
  const [activeChannel, setActiveChannel] = useState<ChannelId>('zhao');
  const [message, setMessage] = useState('先分别给时辰渠道和路线渠道放入可区分的假信息。陆淳、郑禾只作为可选对照，不再强制四路齐填。');
  const visibleChannels = showControls ? [...coreChannels, ...controlChannels] : coreChannels;
  const selectedByChannel = useMemo(() => Object.fromEntries(
    (['lu', 'zheng', 'zhao', 'du'] as ChannelId[]).map((channel) => [channel, state.selectedBaitIds.find((id) => id.startsWith(`bait-${channel}-`))]),
  ) as Record<ChannelId, string | undefined>, [state.selectedBaitIds]);
  const supportedTheoryEdgeIds = state.coreLoop.theoryEdges
    .filter((edge) => edge.status === 'supported' || edge.status === 'verified')
    .map((edge) => edge.id);
  const theoryReady = state.coreLoop.theoryEvaluation.status === 'supported' || state.coreLoop.theoryEvaluation.status === 'verified';
  const coreSelected = Boolean(selectedByChannel.zhao && selectedByChannel.du);
  const latestExperiment = state.coreLoop.baitExperiments.at(-1);
  const deployed = Boolean(latestExperiment && state.enemyReport && state.baitBand);
  const options = content.baits.filter((bait) => bait.channel === activeChannel);
  const selectedBaits = state.selectedBaitIds.map((id) => content.baits.find((bait) => bait.id === id)).filter(Boolean);

  const hypothesis = latestExperiment?.hypothesis
    ?? '如果赵简负责时辰泄露、杜衡负责路线推断与价格暗号传递，那么袁军应同时响应“赵简假时辰”和“杜衡假路线”；对照渠道不应决定核心行动。';
  const previewSignals = [
    selectedByChannel.zhao ? `时辰回声：${timeLabels[content.baits.find((bait) => bait.id === selectedByChannel.zhao)?.signal ?? ''] ?? content.baits.find((bait) => bait.id === selectedByChannel.zhao)?.signal}` : '时辰回声：尚未设置',
    selectedByChannel.du ? `路线回声：${routeLabels[content.baits.find((bait) => bait.id === selectedByChannel.du)?.signal ?? ''] ?? content.baits.find((bait) => bait.id === selectedByChannel.du)?.signal}` : '路线回声：尚未设置',
  ];

  function selectBait(baitId: string) {
    dispatch({ type: 'SELECT_BAIT', baitId, channel: activeChannel });
    if (activeChannel === 'zhao' && !selectedByChannel.du) setActiveChannel('du');
    setMessage('诱饵已写入实验草案。确认两个核心渠道都可区分后再部署。');
  }

  function submit() {
    if (!theoryReady) {
      setMessage('泄密链还没有达到“有证”。先回推演板补齐链条，再部署投饵。');
      return;
    }
    if (!coreSelected) {
      setMessage('完整验证实验至少需要赵简的时辰渠道和杜衡的路线渠道各一条诱饵。');
      return;
    }
    try {
      const result = evaluateBaitExperiment(content, {
        knownClaimIds: state.extractedClaimIds,
        theoryEdgeIds: supportedTheoryEdgeIds,
        baitIds: state.selectedBaitIds,
        realPlan,
      });
      let next = gameReducer(state, { type: 'RESOLVE_BAIT', realPlan, baitBand: result.resolution.baitBand, enemyReport: result.resolution.enemyReport });
      next = gameReducer(next, { type: 'UPSERT_BAIT_EXPERIMENT', experiment: result.experiment });
      next = { ...next, stage: 'bait' };
      next = syncObjectivesUntilStable(next, guanduObjectives);
      dispatch({ type: 'APPLY_RULE_STATE', state: next });
      setMessage('实验已部署。现在不要继续猜人，去看敌军是否同时响应这两块假信息。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '投饵实验无法执行。');
    }
  }

  return (
    <main className="v095-bait-experiment" aria-labelledby="bait-scene-title">
      <WarMapBackdrop />
      <SceneFocusHeader
        eyebrow="第五幕 · 反情报实验"
        title="你正在验证什么？"
        description="投饵不再是四渠道填表。每条假消息都要对应一条已经有证的理论关系，并预先写清预期敌军回声。"
        id="bait-scene-title"
        status={<GameBadge>{theoryReady ? '泄密链 · 有证' : '理论尚未就绪'}</GameBadge>}
      />

      <GameCard className="v095-bait-hypothesis" density="compact" tone="dark">
        <CardHeader><div><small>实验假设</small><h2>{hypothesis}</h2></div></CardHeader>
        <CardContent><div className="v095-bait-signals">{previewSignals.map((signal) => <span key={signal}>{signal}</span>)}</div></CardContent>
      </GameCard>

      <section className="v095-bait-layout">
        <nav className="v095-bait-channels" aria-label="投饵渠道">
          {visibleChannels.map((channel) => <GameButton
            key={channel}
            variant={activeChannel === channel ? 'secondary' : 'ghost'}
            size="lg"
            aria-pressed={activeChannel === channel}
            onClick={() => setActiveChannel(channel)}
          ><span><i>{channelMeta[channel].seal}</i><strong>{channelMeta[channel].name}</strong><small>{channelMeta[channel].tier === 'core' ? '核心验证' : '对照渠道'}{selectedByChannel[channel] ? ' · 已选' : ''}</small></span></GameButton>)}
          <GameButton variant="ghost" size="sm" onClick={() => setShowControls((value) => !value)}>{showControls ? '收起对照渠道' : '＋ 加入对照渠道'}</GameButton>
        </nav>

        <GameCard className="v095-bait-options" density="compact" tone="dark">
          <CardHeader><div><small>{channelMeta[activeChannel].tier === 'core' ? '核心渠道' : '对照渠道'}</small><h2>{channelMeta[activeChannel].name}</h2><p>{channelMeta[activeChannel].purpose}</p></div><GameBadge>{selectedByChannel[activeChannel] ? '已选诱饵' : '待选择'}</GameBadge></CardHeader>
          <CardContent><div className="v095-bait-option-grid">{options.map((bait) => {
            const knownCount = bait.requiredClaimIds.filter((id) => state.extractedClaimIds.includes(id)).length;
            const credible = knownCount === bait.requiredClaimIds.length;
            const selected = selectedByChannel[activeChannel] === bait.id;
            const distinguishable = bait.channel === 'zhao'
              ? bait.signal !== realPlan.time
              : bait.channel === 'du'
                ? bait.signal !== realPlan.route
                : true;
            return <GameButton key={bait.id} variant={selected ? 'evidence' : 'secondary'} size="lg" disabled={deployed || !distinguishable} lockedReason={!distinguishable ? '这条信息与真实计划相同，无法作为验证诱饵' : undefined} aria-pressed={selected} onClick={() => selectBait(bait.id)}>
              <span><strong>{bait.payload}</strong><small>{!distinguishable ? '与真实计划相同 · 无法形成可区分回声' : credible ? '现有案卷能支撑这条假消息的可信度' : `依据 ${knownCount}/${bait.requiredClaimIds.length} · 可能产生弱回声`}</small></span>
            </GameButton>;
          })}</div></CardContent>
          <CardFooter><div className="v095-bait-summary">{selectedBaits.map((bait) => bait ? <span key={bait.id}><b>{channelMeta[bait.channel].name}</b>{bait.payload}</span> : null)}</div></CardFooter>
        </GameCard>
      </section>

      <div className="v095-bait-status" role="status">{message}</div>
      <footer className="v095-bait-actions">
        <GameButton variant="command" audioCue="seal" disabled={!theoryReady || !coreSelected || deployed} lockedReason={!theoryReady ? '先让理论达到“有证”' : !coreSelected ? '先设置赵简与杜衡两个核心渠道' : undefined} onClick={submit} mark="印">部署验证实验</GameButton>
        <GameButton variant="secondary" audioCue="task-unlock" disabled={!deployed} onClick={() => onComplete('enemy-report')}>查看敌军回声</GameButton>
      </footer>
    </main>
  );
}
