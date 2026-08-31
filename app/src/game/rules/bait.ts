import type { BaitBand, BaitExperiment, EnemyReport, GameContent, RealConvoyPlan } from '../domain';

export type BaitChannel = 'lu' | 'zheng' | 'zhao' | 'du';

export interface BaitPlanInput {
  knownClaimIds: string[];
  baitIds: string[];
  realPlan: RealConvoyPlan;
}

export interface BaitExperimentInput extends BaitPlanInput {
  theoryEdgeIds: string[];
}

export interface BaitResolution {
  credibleBaitIds: string[];
  reflectedChannels: BaitChannel[];
  enemyReport: EnemyReport;
  baitBand: BaitBand;
}

export interface BaitExperimentResult {
  experiment: BaitExperiment;
  hypothesis: string;
  expectedSignals: string[];
  resolution: BaitResolution;
}

const requiredTheoryEdges = ['edge-time-zhao', 'edge-route-du', 'edge-integrate-du', 'edge-price-yuan'];

function selectedBaits(content: GameContent, baitIds: string[]) {
  const selected = baitIds.map((id) => {
    const bait = content.baits.find((item) => item.id === id);
    if (!bait) throw new Error(`Unknown bait: ${id}`);
    return bait;
  });
  const channels = new Set<string>();
  for (const bait of selected) {
    if (channels.has(bait.channel)) throw new Error('同一渠道不能同时放入两条诱饵');
    channels.add(bait.channel);
  }
  return selected;
}

function resolveSelectedBaits(content: GameContent, input: BaitPlanInput): BaitResolution {
  const selected = selectedBaits(content, input.baitIds);
  if (!selected.length) throw new Error('至少选择一条诱饵');
  const credible = selected.filter((bait) => bait.requiredClaimIds.every((id) => input.knownClaimIds.includes(id)));
  const zhao = credible.find((bait) => bait.channel === 'zhao');
  const du = credible.find((bait) => bait.channel === 'du');
  const coreCount = Number(Boolean(zhao)) + Number(Boolean(du));
  return {
    credibleBaitIds: credible.map((bait) => bait.id),
    reflectedChannels: [zhao ? 'zhao' : undefined, du ? 'du' : undefined].filter((channel): channel is 'zhao' | 'du' => Boolean(channel)),
    enemyReport: {
      route: du?.signal ?? input.realPlan.route,
      time: zhao?.signal ?? input.realPlan.time,
    },
    baitBand: coreCount === 2 ? 'bothCore' : coreCount === 1 ? 'oneCore' : 'noneCore',
  };
}

/** Legacy-compatible resolver. It accepts old four-channel plans, but no longer requires exactly four channels. */
export function evaluateBaitPlan(content: GameContent, input: BaitPlanInput): BaitResolution {
  return resolveSelectedBaits(content, input);
}

export function evaluateBaitExperiment(content: GameContent, input: BaitExperimentInput): BaitExperimentResult {
  if (!requiredTheoryEdges.every((id) => input.theoryEdgeIds.includes(id))) {
    throw new Error('泄密链尚未达到“有证”，不能把投饵当成有效验证实验');
  }
  const selected = selectedBaits(content, input.baitIds);
  const zhao = selected.find((bait) => bait.channel === 'zhao');
  const du = selected.find((bait) => bait.channel === 'du');
  if (!zhao || !du) throw new Error('完整验证实验至少需要赵简的时辰渠道和杜衡的路线渠道各一条诱饵');
  if (zhao.signal === input.realPlan.time || du.signal === input.realPlan.route) {
    throw new Error('核心诱饵必须与真实计划不同，才能形成可区分的敌军回声');
  }

  const resolution = resolveSelectedBaits(content, input);
  const expectedSignals = [
    `若赵简渠道成立，袁军准备时刻应转向“${zhao.signal}”`,
    `若杜衡渠道成立，袁军集结方向应转向“${du.signal}”`,
  ];
  const controls = selected.filter((bait) => bait.channel === 'lu' || bait.channel === 'zheng');
  if (controls.length) expectedSignals.push(`对照渠道：${controls.map((bait) => bait.payload).join('；')}不应成为袁军核心行动依据`);

  const hypothesis = `如果“赵简泄露时辰、杜衡推断并通过价格暗号传递路线”这条理论成立，那么袁军应同时响应赵简的假时辰与杜衡的假路线；陆淳、郑禾只作为可选对照。`;
  const experiment: BaitExperiment = {
    id: `experiment-${input.baitIds.join('-')}`,
    theoryEdgeIds: [...requiredTheoryEdges],
    baitIds: [...input.baitIds],
    hypothesis,
    expectedSignals,
    status: 'deployed',
  };
  return { experiment, hypothesis, expectedSignals, resolution };
}
