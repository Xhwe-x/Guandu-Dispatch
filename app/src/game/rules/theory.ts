import type { GameState, TheoryEdge, TheoryEvaluation, TheoryGap } from '../domain';

export const frozenCoreTheoryEdges: TheoryEdge[] = [
  { id: 'edge-time-zhao', fromId: 'info-time', toId: 'person-zhao', relation: 'accessedBy', status: 'proposed' },
  { id: 'edge-route-du', fromId: 'info-route-fragments', toId: 'person-du', relation: 'infers', status: 'proposed' },
  { id: 'edge-integrate-du', fromId: 'person-du', toId: 'method-price-cipher', relation: 'supports', status: 'proposed' },
  { id: 'edge-price-yuan', fromId: 'method-price-cipher', toId: 'enemy-yuan', relation: 'transmitsTo', status: 'proposed' },
];

export const optionalTheoryEdges: TheoryEdge[] = [
  { id: 'edge-time-lu', fromId: 'info-time', toId: 'person-lu', relation: 'accessedBy', status: 'proposed' },
  { id: 'edge-route-zheng', fromId: 'info-route-fragments', toId: 'person-zheng', relation: 'infers', status: 'proposed' },
  { id: 'edge-zhao-yuan-direct', fromId: 'person-zhao', toId: 'enemy-yuan', relation: 'transmitsTo', status: 'proposed' },
];

const frozenIds = new Set(frozenCoreTheoryEdges.map((edge) => edge.id));

function isAtLeastSupported(state: GameState, id: string) {
  const status = state.coreLoop.knowledge[id]?.status;
  return status === 'supported' || status === 'verified';
}

function isAtLeastObserved(state: GameState, id: string) {
  const status = state.coreLoop.knowledge[id]?.status;
  return status === 'observed' || status === 'suspected' || status === 'contradicted' || status === 'supported' || status === 'verified';
}

function hasEdge(edges: TheoryEdge[], id: string) {
  return edges.some((edge) => edge.id === id && edge.status !== 'rejected');
}

function gap(input: TheoryGap): TheoryGap {
  return input;
}

export function evaluateTheory(state: GameState, proposedEdges: TheoryEdge[]): TheoryEvaluation {
  const gaps: TheoryGap[] = [];
  const supportedEdgeIds: string[] = [];
  const rejectedEdgeIds: string[] = [];

  const unsupported = proposedEdges.filter((edge) => !frozenIds.has(edge.id));
  if (unsupported.length) {
    rejectedEdgeIds.push(...unsupported.map((edge) => edge.id));
    gaps.push(gap({
      id: 'gap-unsupported-edge',
      kind: 'unsupported-edge',
      title: '这条关系证据不足',
      description: '当前材料还不能证明这条直接关系。保留它不会锁死案件，但需要回案卷找到更具体的来源或传递证据。',
      relatedKnowledgeIds: [],
      suggestedPersonIds: ['zhao', 'du', 'lu', 'zheng'],
      suggestedDocumentIds: ['statement-zhao', 'station-entry', 'route-map', 'trade-prices'],
    }));
  }

  const timeReady = isAtLeastSupported(state, 'claim-zhao-time') && hasEdge(proposedEdges, 'edge-time-zhao');
  if (timeReady) supportedEdgeIds.push('edge-time-zhao');
  else gaps.push(gap({
    id: 'gap-time-source',
    kind: 'missing-source',
    title: '时辰来源尚未钉实',
    description: '先确认谁真正接触并泄露了集合时辰，再把这条来源关系放进泄密链。',
    relatedKnowledgeIds: ['claim-zhao-time'],
    suggestedPersonIds: ['zhao'],
    suggestedDocumentIds: ['statement-zhao', 'order-assembly'],
  }));

  const routeReady = isAtLeastSupported(state, 'claim-du-fodder-pattern')
    && isAtLeastSupported(state, 'claim-du-route')
    && hasEdge(proposedEdges, 'edge-route-du');
  if (routeReady) supportedEdgeIds.push('edge-route-du');
  else gaps.push(gap({
    id: 'gap-route',
    kind: 'missing-route',
    title: '具体路线仍没有来源',
    description: '当前理论最多解释时辰外泄，还不能解释敌军为什么知道北桥、南渡等具体路线信息。',
    relatedKnowledgeIds: ['claim-du-fodder-pattern', 'claim-du-route'],
    suggestedPersonIds: ['du'],
    suggestedDocumentIds: ['station-entry', 'repair-north-bridge', 'route-map', 'trade-prices'],
  }));

  const integrationReady = isAtLeastSupported(state, 'claim-du-route')
    && isAtLeastSupported(state, 'claim-price-cipher')
    && hasEdge(proposedEdges, 'edge-integrate-du');
  if (integrationReady) supportedEdgeIds.push('edge-integrate-du');
  else if (routeReady) gaps.push(gap({
    id: 'gap-integration',
    kind: 'missing-source',
    title: '碎片在哪里被拼成军情？',
    description: '路线碎片已经出现，但还缺少“谁把这些碎片整理成可传递军情”的一环。',
    relatedKnowledgeIds: ['claim-du-route', 'claim-price-cipher'],
    suggestedPersonIds: ['du'],
    suggestedDocumentIds: ['trade-prices'],
  }));

  const transmissionReady = isAtLeastSupported(state, 'claim-price-cipher')
    && isAtLeastObserved(state, 'claim-shuoyuan-received')
    && hasEdge(proposedEdges, 'edge-price-yuan');
  if (transmissionReady) supportedEdgeIds.push('edge-price-yuan');
  else if (integrationReady) gaps.push(gap({
    id: 'gap-transmitter',
    kind: 'missing-transmitter',
    title: '军情如何离开曹营？',
    description: '路线与时辰已经能被拼合，但还没有说明它如何真正送到袁军手里。',
    relatedKnowledgeIds: ['claim-price-cipher', 'claim-shuoyuan-received'],
    suggestedPersonIds: ['du'],
    suggestedDocumentIds: ['trade-prices', 'report-ambush'],
  }));

  const explicitConflict = proposedEdges.some((edge) => edge.status === 'rejected')
    || Object.values(state.coreLoop.knowledge).some((entry) => entry.status === 'excluded' && proposedEdges.some((edge) => edge.fromId.includes(entry.id) || edge.toId.includes(entry.id)));
  if (explicitConflict) {
    gaps.push(gap({
      id: 'gap-conflict',
      kind: 'conflict',
      title: '理论中存在相互冲突的关系',
      description: '至少一条关系已被后续证据排除。移除或替换该关系后再验证，不会损失调查进度。',
      relatedKnowledgeIds: [],
      suggestedPersonIds: [],
      suggestedDocumentIds: [],
    }));
  }

  const fullCore = frozenCoreTheoryEdges.every((edge) => supportedEdgeIds.includes(edge.id));
  const verified = fullCore && frozenCoreTheoryEdges.every((template) => proposedEdges.some((edge) => edge.id === template.id && edge.status === 'verified'));
  return {
    status: explicitConflict ? 'conflicted' : verified ? 'verified' : fullCore ? 'supported' : 'incomplete',
    gaps,
    supportedEdgeIds,
    rejectedEdgeIds,
  };
}
