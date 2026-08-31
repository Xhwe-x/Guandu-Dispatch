import { z } from 'zod';
import type { CoreLoopState, GameContent, GameState, KnowledgeEntry, TheoryEdge, TheoryGap } from './domain';
import { createInitialState } from './initialState';
import { recoverPresentation } from './presentationRecovery';
import { migrateV4PresentationToV09, sanitizeV09Presentation } from './v09PresentationMigration';

const Id = z.string().min(1);
const CharacterSchema = z.object({
  id: Id,
  name: z.string().min(1),
  role: z.string().min(1),
  access: z.array(z.string()),
  secret: z.string(),
  responsibility: z.string(),
});
const DocumentSchema = z.object({
  id: Id,
  title: z.string().min(1),
  category: z.enum(['report', 'ledger', 'statement', 'repair', 'trade', 'map']),
  body: z.string().min(1),
  claimIds: z.array(Id),
});
const ClaimProvenanceSchema = z.object({
  kind: z.enum(['document', 'investigation', 'interrogation']),
  sourceId: Id,
});
const ClaimSchema = z.object({
  id: Id,
  text: z.string().min(1),
  sourceDocumentId: Id,
  provenance: ClaimProvenanceSchema,
  tags: z.array(z.string()),
});
const RelationshipSchema = z.object({
  fromId: Id,
  toId: Id,
  kind: z.enum(['supports', 'refutes', 'sourceOf', 'accessedBy', 'infers', 'transmitsTo']),
  slot: z.enum(['leakedInfo', 'source', 'actor', 'method', 'enemyConclusion']),
});
const InvestigationSchema = z.object({
  id: Id,
  title: z.string().min(1),
  cost: z.literal(1),
  revealClaimIds: z.array(Id),
});
const InterrogationRuleSchema = z.object({
  id: Id,
  characterId: Id,
  statementClaimId: Id,
  evidenceClaimId: Id,
  revealClaimIds: z.array(Id),
  responseKeys: z.object({
    calm: z.string(),
    threaten: z.string(),
    empathize: z.string(),
    misdirect: z.string(),
  }),
});
const BaitOptionSchema = z.object({
  id: Id,
  channel: z.enum(['lu', 'zheng', 'zhao', 'du']),
  payload: z.string(),
  signal: z.string(),
  requiredClaimIds: z.array(Id),
  core: z.boolean(),
});

export const GameContentSchema = z.object({
  id: z.literal('guandu'),
  characters: z.array(CharacterSchema),
  documents: z.array(DocumentSchema),
  claims: z.array(ClaimSchema),
  investigations: z.array(InvestigationSchema),
  interrogations: z.array(InterrogationRuleSchema),
  baits: z.array(BaitOptionSchema),
  relationshipPermissions: z.array(RelationshipSchema),
  hints: z.record(z.string(), z.tuple([z.string(), z.string(), z.string()])),
  epilogueFragments: z.record(z.string(), z.string()),
});

export const TutorialStepSchema = z.enum([
  'notStarted',
  'introIdentity',
  'introIncident',
  'introObjective',
  'openAmbushReport',
  'extractAmbushClaim',
  'openZhaoStatement',
  'extractZhaoDenial',
  'investigateHandwriting',
  'interrogateZhao',
  'placeContradiction',
  'completed',
  'skipped',
]);

export const TutorialStateSchema = z.object({
  step: TutorialStepSchema,
  startedAtLeastOnce: z.boolean(),
  enabled: z.boolean().default(true),
  seenLessonIds: z.array(Id).default([]),
});

const GameSceneIdSchema = z.enum([
  'title',
  'opening',
  'story',
  'camp',
  'audience',
  'first-evidence',
  'first-deduction',
  'document',
  'investigation',
  'dialogue',
  'interrogation',
  'deduction',
  'case-summary',
  'network-investigation',
  'network-deduction',
  'bait',
  'enemy-report',
  'final-report',
  'ending',
]);

const PresentationSnapshotSchema = z.object({
  sceneId: GameSceneIdSchema,
  storySceneId: z.string().min(1),
  beatIndex: z.number().int().min(0),
  dialogueNodeId: Id.optional(),
});

const PresentationCoreFields = {
  sceneId: GameSceneIdSchema,
  storySceneId: z.string().min(1),
  beatIndex: z.number().int().min(0),
  dialogueNodeId: Id.optional(),
};

const PresentationStateSchema = z.object({
  ...PresentationCoreFields,
  sceneHistory: z.array(PresentationSnapshotSchema).default([]),
  documentFindingIds: z.array(Id),
  handwritingFindingIds: z.array(Id),
  interrogation: z.object({
    evidenceClaimId: Id,
    tone: z.enum(['calm', 'threaten', 'empathize', 'misdirect']),
    attempts: z.number().int().min(0),
  }),
  deduction: z.object({
    fromId: Id.optional(),
    toId: Id.optional(),
    kind: z.enum(['supports', 'refutes', 'sourceOf', 'accessedBy', 'infers', 'transmitsTo']).optional(),
  }),
  networkTheory: z.object({
    timeSourceId: Id.optional(),
    routeSourceId: Id.optional(),
    transmitterId: Id.optional(),
  }),
  reportDraft: z.object({
    leakedInfo: z.array(z.string()),
    sourceCharacterIds: z.array(Id),
    integratorId: Id.optional(),
    transmissionMethod: z.string().min(1).optional(),
    evidenceClaimIds: z.array(Id),
    handling: z.enum(['arrest', 'cutOff', 'exploit', 'differentiate']),
  }),
  audience: z.object({
    visitId: z.enum(['first-report', 'final-report']),
    shotIndex: z.number().int().min(0),
    attitude: z.enum(['observing', 'calm', 'approving', 'displeased']),
    choiceIds: z.array(Id),
  }).default({ visitId: 'first-report', shotIndex: 0, attitude: 'observing', choiceIds: [] }),
});

const LegacyPresentationStateV3Schema = z.object({
  sceneId: GameSceneIdSchema,
  sceneHistory: z.array(GameSceneIdSchema).default([]),
  storySceneId: z.string().min(1),
  beatIndex: z.number().int().min(0),
  documentFindingIds: z.array(Id),
  handwritingFindingIds: z.array(Id),
  interrogation: z.object({
    evidenceClaimId: Id,
    tone: z.enum(['calm', 'threaten', 'empathize', 'misdirect']),
    attempts: z.number().int().min(0),
  }),
  deduction: z.object({
    fromId: Id.optional(), toId: Id.optional(),
    kind: z.enum(['supports', 'refutes', 'sourceOf', 'accessedBy', 'infers', 'transmitsTo']).optional(),
  }),
  networkTheory: z.object({ timeSourceId: Id.optional(), routeSourceId: Id.optional(), transmitterId: Id.optional() }),
  reportDraft: z.object({
    leakedInfo: z.array(z.string()), sourceCharacterIds: z.array(Id), integratorId: Id.optional(),
    transmissionMethod: z.string().min(1).optional(), evidenceClaimIds: z.array(Id),
    handling: z.enum(['arrest', 'cutOff', 'exploit', 'differentiate']),
  }),
  audience: z.object({
    visitId: z.enum(['first-report', 'final-report']), shotIndex: z.number().int().min(0),
    attitude: z.enum(['observing', 'calm', 'approving', 'displeased']), choiceIds: z.array(Id),
  }).default({ visitId: 'first-report', shotIndex: 0, attitude: 'observing', choiceIds: [] }),
});

const GameStateFields = {
  audio: z.object({
    enabled: z.boolean(),
    voiceEnabled: z.boolean(),
    volume: z.number().min(0).max(1),
  }).default({ enabled: true, voiceEnabled: true, volume: 0.72 }),
  stage: z.enum(['documents', 'secrets', 'chain', 'bait', 'report', 'ending']),
  investigationPoints: z.number().int().min(0).max(3),
  readDocumentIds: z.array(Id),
  extractedClaimIds: z.array(Id),
  relationships: z.array(RelationshipSchema),
  completedInvestigationIds: z.array(Id),
  personStates: z.record(Id, z.enum(['cooperative', 'guarded', 'hostile'])),
  selectedBaitIds: z.array(Id),
  realPlan: z.object({ route: z.string(), time: z.string() }).optional(),
  baitBand: z.enum(['bothCore', 'oneCore', 'noneCore']).optional(),
  enemyReport: z.object({ route: z.string(), time: z.string() }).optional(),
  report: z.object({
    leakedInfo: z.array(z.string()),
    sourceCharacterIds: z.array(Id),
    integratorId: Id,
    transmissionMethod: z.string(),
    evidenceClaimIds: z.array(Id),
    handling: z.enum(['arrest', 'cutOff', 'exploit', 'differentiate']),
  }).optional(),
  actionOutcome: z.enum(['networkClosed', 'convoySavedIncomplete', 'ambushedAgain']).optional(),
  truthOwner: z.enum(['canghe', 'shuoyuan', 'lishe', 'destroyed']).optional(),
  hintUsage: z.record(z.string(), z.number().int().min(0)),
  dialogueHistory: z.array(z.object({ id: Id, speakerId: Id.optional(), speakerName: z.string(), text: z.string() })).default([]),
};


const KnowledgeStatusSchema = z.enum(['unknown', 'observed', 'suspected', 'contradicted', 'supported', 'verified', 'excluded']);
const KnowledgeEntrySchema = z.object({
  id: Id,
  kind: z.enum(['claim', 'person', 'document', 'relationship', 'enemy-feedback']),
  status: KnowledgeStatusSchema,
  sourceIds: z.array(Id),
  relatedPersonIds: z.array(Id),
  relatedDocumentIds: z.array(Id),
  lastUpdatedAt: z.number(),
});
const TheoryNodeSchema = z.object({
  id: Id,
  kind: z.enum(['person', 'claim', 'document', 'information', 'method', 'enemy']),
  sourceId: Id,
  label: z.string().min(1),
});
const TheoryEdgeSchema = z.object({
  id: Id,
  fromId: Id,
  toId: Id,
  relation: z.enum(['supports', 'refutes', 'sourceOf', 'accessedBy', 'infers', 'transmitsTo']),
  status: z.enum(['proposed', 'supported', 'verified', 'rejected']),
});
const TheoryGapSchema = z.object({
  id: Id,
  kind: z.enum(['missing-source', 'missing-route', 'missing-transmitter', 'unsupported-edge', 'conflict']),
  title: z.string(),
  description: z.string(),
  relatedKnowledgeIds: z.array(Id),
  suggestedPersonIds: z.array(Id),
  suggestedDocumentIds: z.array(Id),
});
const TheoryEvaluationSchema = z.object({
  status: z.enum(['incomplete', 'conflicted', 'supported', 'verified']),
  gaps: z.array(TheoryGapSchema),
  supportedEdgeIds: z.array(Id),
  rejectedEdgeIds: z.array(Id),
});
const GuidanceStateSchema = z.object({
  currentObjectiveId: Id,
  cueStates: z.record(Id, z.enum(['unseen', 'shown', 'dismissed', 'resolved'])),
  manualHintLevels: z.record(Id, z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])),
  lastProgressAt: z.number(),
  invalidTheoryAttempts: z.number().int().min(0),
  unusedEvidenceIds: z.array(Id),
});
const BaitExperimentSchema = z.object({
  id: Id,
  theoryEdgeIds: z.array(Id),
  baitIds: z.array(Id),
  hypothesis: z.string(),
  expectedSignals: z.array(z.string()),
  status: z.enum(['draft', 'deployed', 'observed', 'resolved']),
});
const EnemyFeedbackSchema = z.object({
  id: Id,
  source: z.enum(['scout', 'market', 'intercept', 'no-response']),
  text: z.string(),
  relatedBaitIds: z.array(Id),
  supportsTheoryEdgeIds: z.array(Id),
  contradictsTheoryEdgeIds: z.array(Id),
});
const CoreLoopStateSchema = z.object({
  knowledge: z.record(Id, KnowledgeEntrySchema),
  theoryNodes: z.array(TheoryNodeSchema),
  theoryEdges: z.array(TheoryEdgeSchema),
  theoryEvaluation: TheoryEvaluationSchema,
  guidance: GuidanceStateSchema,
  baitExperiments: z.array(BaitExperimentSchema),
  enemyFeedback: z.array(EnemyFeedbackSchema),
  selectedDossierTarget: z.object({
    kind: z.enum(['person', 'document', 'knowledge', 'gap']),
    id: Id,
  }).optional(),
});

export const LegacyGameStateV1Schema = z.object({
  version: z.literal(1),
  ...GameStateFields,
});

export const LegacyGameStateV2Schema = z.object({
  version: z.literal(2),
  tutorial: TutorialStateSchema,
  ...GameStateFields,
});

export const LegacyGameStateV3Schema = z.object({
  version: z.literal(3),
  tutorial: TutorialStateSchema,
  presentation: LegacyPresentationStateV3Schema,
  ...GameStateFields,
});

export const LegacyGameStateV4Schema = z.object({
  version: z.literal(4),
  tutorial: TutorialStateSchema,
  presentation: PresentationStateSchema,
  ...GameStateFields,
});

export const LegacyGameStateV5Schema = z.object({
  version: z.literal(5),
  tutorial: TutorialStateSchema,
  presentation: PresentationStateSchema,
  ...GameStateFields,
});

export const GameStateSchema = z.object({
  version: z.literal(6),
  tutorial: TutorialStateSchema,
  presentation: PresentationStateSchema,
  ...GameStateFields,
  coreLoop: CoreLoopStateSchema,
});

function assertUnique(label: string, ids: string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`Duplicate ${label} ID: ${id}`);
    }
    seen.add(id);
  }
}

function assertClaimReference(claimIds: Set<string>, id: string) {
  if (!claimIds.has(id)) {
    throw new Error(`Missing claim reference: ${id}`);
  }
}

export function validateGameContent(input: unknown): GameContent {
  const content = GameContentSchema.parse(input);
  const characterIds = new Set(content.characters.map((item) => item.id));
  const documentIds = new Set(content.documents.map((item) => item.id));
  const claimIds = new Set(content.claims.map((item) => item.id));
  const investigationIds = new Set(content.investigations.map((item) => item.id));
  const interrogationIds = new Set(content.interrogations.map((item) => item.id));

  assertUnique('character', content.characters.map((item) => item.id));
  assertUnique('document', content.documents.map((item) => item.id));
  assertUnique('claim', content.claims.map((item) => item.id));
  assertUnique('investigation', content.investigations.map((item) => item.id));
  assertUnique('interrogation', content.interrogations.map((item) => item.id));
  assertUnique('bait', content.baits.map((item) => item.id));
  assertUnique('relationship permission', content.relationshipPermissions.map((item) => (
    `${item.fromId}\u0000${item.toId}\u0000${item.kind}\u0000${item.slot}`
  )));

  const claimsById = new Map(content.claims.map((claim) => [claim.id, claim]));
  for (const claim of content.claims) {
    if (!documentIds.has(claim.sourceDocumentId)) {
      throw new Error(`Missing document reference: ${claim.sourceDocumentId}`);
    }
    const source = content.documents.find((item) => item.id === claim.sourceDocumentId)!;
    if (!source.claimIds.includes(claim.id)) {
      throw new Error(`Document ${source.id} does not list claim: ${claim.id}`);
    }
    const provenanceIds = claim.provenance.kind === 'document'
      ? documentIds
      : claim.provenance.kind === 'investigation'
        ? investigationIds
        : interrogationIds;
    if (!provenanceIds.has(claim.provenance.sourceId)) {
      throw new Error(`Missing ${claim.provenance.kind} provenance: ${claim.provenance.sourceId}`);
    }
  }
  for (const document of content.documents) {
    for (const claimId of document.claimIds) {
      const claim = claimsById.get(claimId);
      if (!claim) {
        throw new Error(`Missing claim reference: ${claimId}`);
      }
      if (claim.sourceDocumentId !== document.id) {
        throw new Error(`Claim ${claimId} does not identify document: ${document.id}`);
      }
    }
  }
  for (const investigation of content.investigations) {
    for (const id of investigation.revealClaimIds) {
      assertClaimReference(claimIds, id);
    }
  }
  for (const interrogation of content.interrogations) {
    if (!characterIds.has(interrogation.characterId)) {
      throw new Error(`Missing character reference: ${interrogation.characterId}`);
    }
    assertClaimReference(claimIds, interrogation.statementClaimId);
    assertClaimReference(claimIds, interrogation.evidenceClaimId);
    for (const id of interrogation.revealClaimIds) {
      assertClaimReference(claimIds, id);
    }
  }
  for (const bait of content.baits) {
    for (const id of bait.requiredClaimIds) {
      assertClaimReference(claimIds, id);
    }
  }
  for (const claim of content.claims) {
    const provenanceListsClaim = claim.provenance.kind === 'document'
      ? content.documents.find((item) => item.id === claim.provenance.sourceId)!.claimIds.includes(claim.id)
      : claim.provenance.kind === 'investigation'
        ? content.investigations.find((item) => item.id === claim.provenance.sourceId)!.revealClaimIds.includes(claim.id)
        : content.interrogations.find((item) => item.id === claim.provenance.sourceId)!.revealClaimIds.includes(claim.id);
    if (!provenanceListsClaim) {
      throw new Error(`Claim ${claim.id} is not revealed by provenance source: ${claim.provenance.sourceId}`);
    }
  }
  const entityIds = new Set([...characterIds, ...documentIds, ...claimIds]);
  for (const permission of content.relationshipPermissions) {
    if (!entityIds.has(permission.fromId)) {
      throw new Error(`Missing relationship permission source: ${permission.fromId}`);
    }
    if (!entityIds.has(permission.toId)) {
      throw new Error(`Missing relationship permission target: ${permission.toId}`);
    }
  }

  return content as GameContent;
}

export function validateGameState(input: unknown): GameState {
  return GameStateSchema.parse(input) as GameState;
}

type LegacyV5State = z.infer<typeof LegacyGameStateV5Schema>;

const migrationTheoryNodes: CoreLoopState['theoryNodes'] = [
  { id: 'info-time', kind: 'information', sourceId: 'claim-zhao-time', label: '集合时辰' },
  { id: 'person-zhao', kind: 'person', sourceId: 'zhao', label: '赵简' },
  { id: 'info-route-fragments', kind: 'information', sourceId: 'claim-du-fodder-pattern', label: '草料 / 车辆 / 道路碎片' },
  { id: 'person-du', kind: 'person', sourceId: 'du', label: '杜衡' },
  { id: 'method-price-cipher', kind: 'method', sourceId: 'claim-price-cipher', label: '价格暗号' },
  { id: 'enemy-yuan', kind: 'enemy', sourceId: 'claim-shuoyuan-received', label: '袁军' },
];

const migrationClaimDocuments: Record<string, string> = {
  'claim-zhao-time': 'statement-zhao',
  'claim-du-fodder-pattern': 'station-entry',
  'claim-du-route': 'station-entry',
  'claim-price-cipher': 'trade-prices',
  'claim-shuoyuan-received': 'report-ambush',
};

function inferPersonIds(claimId: string): string[] {
  if (claimId.includes('zhao')) return ['zhao'];
  if (claimId.includes('du-') || claimId === 'claim-price-cipher') return ['du'];
  if (claimId.includes('lu-')) return ['lu'];
  if (claimId.includes('zheng-')) return ['zheng'];
  return [];
}

function hasLegacyRelationship(
  legacy: LegacyV5State,
  fromId: string,
  toId: string,
  kind: TheoryEdge['relation'],
): boolean {
  return legacy.relationships.some((edge) => edge.fromId === fromId && edge.toId === toId && edge.kind === kind);
}

function inferCoreLoopFromLegacy(legacy: LegacyV5State): CoreLoopState {
  const base = createInitialState().coreLoop;
  const extracted = new Set(legacy.extractedClaimIds);
  const knowledge: Record<string, KnowledgeEntry> = {};

  for (const claimId of legacy.extractedClaimIds) {
    const documentId = migrationClaimDocuments[claimId];
    knowledge[claimId] = {
      id: claimId,
      kind: 'claim',
      status: 'observed',
      sourceIds: documentId ? [documentId] : [],
      relatedPersonIds: inferPersonIds(claimId),
      relatedDocumentIds: documentId ? [documentId] : [],
      lastUpdatedAt: 0,
    };
  }

  const timeSupported = extracted.has('claim-zhao-time')
    && hasLegacyRelationship(legacy, 'claim-zhao-time', 'zhao', 'accessedBy');
  const routeSupported = extracted.has('claim-du-fodder-pattern')
    && extracted.has('claim-du-route')
    && hasLegacyRelationship(legacy, 'claim-du-route', 'du', 'infers');
  const integrationSupported = routeSupported
    && extracted.has('claim-price-cipher');
  const transmissionSupported = extracted.has('claim-price-cipher')
    && extracted.has('claim-shuoyuan-received')
    && (
      hasLegacyRelationship(legacy, 'claim-price-cipher', 'claim-shuoyuan-received', 'supports')
      || hasLegacyRelationship(legacy, 'du', 'claim-shuoyuan-received', 'transmitsTo')
    );

  const edgeSupport: Record<string, boolean> = {
    'edge-time-zhao': timeSupported,
    'edge-route-du': routeSupported,
    'edge-integrate-du': integrationSupported,
    'edge-price-yuan': transmissionSupported,
  };
  const allSupported = Object.values(edgeSupport).every(Boolean);
  const legacyVerified = allSupported && legacy.baitBand === 'bothCore' && Boolean(legacy.enemyReport) && legacy.selectedBaitIds.length >= 2;
  const edgeStatus: TheoryEdge['status'] = legacyVerified ? 'verified' : 'supported';
  const theoryEdges: TheoryEdge[] = [
    { id: 'edge-time-zhao', fromId: 'info-time', toId: 'person-zhao', relation: 'accessedBy', status: edgeSupport['edge-time-zhao'] ? edgeStatus : 'proposed' },
    { id: 'edge-route-du', fromId: 'info-route-fragments', toId: 'person-du', relation: 'infers', status: edgeSupport['edge-route-du'] ? edgeStatus : 'proposed' },
    { id: 'edge-integrate-du', fromId: 'person-du', toId: 'method-price-cipher', relation: 'supports', status: edgeSupport['edge-integrate-du'] ? edgeStatus : 'proposed' },
    { id: 'edge-price-yuan', fromId: 'method-price-cipher', toId: 'enemy-yuan', relation: 'transmitsTo', status: edgeSupport['edge-price-yuan'] ? edgeStatus : 'proposed' },
  ];

  const promote = (ids: string[], status: KnowledgeEntry['status']) => {
    for (const id of ids) {
      const entry = knowledge[id];
      if (entry) knowledge[id] = { ...entry, status };
    }
  };
  if (timeSupported) promote(['claim-zhao-time'], legacyVerified ? 'verified' : 'supported');
  if (routeSupported) promote(['claim-du-fodder-pattern', 'claim-du-route'], legacyVerified ? 'verified' : 'supported');
  if (integrationSupported) promote(['claim-price-cipher'], legacyVerified ? 'verified' : 'supported');
  if (transmissionSupported) promote(['claim-shuoyuan-received'], legacyVerified ? 'verified' : 'supported');

  const supportedEdgeIds = theoryEdges.filter((edge) => edge.status === 'supported' || edge.status === 'verified').map((edge) => edge.id);
  let currentObjectiveId = 'objective-time-leak';
  if (timeSupported) currentObjectiveId = 'objective-route-leak';
  if (routeSupported) currentObjectiveId = 'objective-integration';
  if (routeSupported && integrationSupported) currentObjectiveId = 'objective-transmission';
  if (allSupported) currentObjectiveId = legacy.selectedBaitIds.length > 0 ? 'objective-verify-network' : 'objective-counterintel';
  if (legacyVerified) currentObjectiveId = 'objective-verify-network';

  const baitExperiments: CoreLoopState['baitExperiments'] = legacy.selectedBaitIds.length > 0
    ? [{
        id: 'experiment-legacy-v5',
        theoryEdgeIds: supportedEdgeIds,
        baitIds: [...legacy.selectedBaitIds],
        hypothesis: '由旧版投饵记录迁移：观察敌军是否沿已识别的泄密渠道响应假情报。',
        expectedSignals: legacy.enemyReport ? [`路线回声：${legacy.enemyReport.route}`, `时辰回声：${legacy.enemyReport.time}`] : [],
        status: legacy.enemyReport ? (legacyVerified ? 'resolved' : 'observed') : 'deployed',
      }]
    : [];

  const enemyFeedback: CoreLoopState['enemyFeedback'] = legacy.enemyReport
    ? [{
        id: 'feedback-legacy-v5',
        source: legacy.baitBand === 'noneCore' ? 'no-response' : 'scout',
        text: `由旧版敌军回报迁移：路线 ${legacy.enemyReport.route}，时辰 ${legacy.enemyReport.time}。`,
        relatedBaitIds: [...legacy.selectedBaitIds],
        supportsTheoryEdgeIds: legacyVerified ? theoryEdges.map((edge) => edge.id) : [],
        contradictsTheoryEdgeIds: [],
      }]
    : [];

  const gaps: TheoryGap[] = [];
  if (!timeSupported) {
    gaps.push({
      id: 'gap-time-source',
      kind: 'missing-source',
      title: '时辰来源尚未钉实',
      description: '旧存档里还没有足够关系证据证明集合时辰由赵简泄露。',
      relatedKnowledgeIds: ['claim-zhao-time'],
      suggestedPersonIds: ['zhao'],
      suggestedDocumentIds: ['statement-zhao', 'order-assembly'],
    });
  }
  if (!routeSupported) {
    gaps.push({
      id: 'gap-route',
      kind: 'missing-route',
      title: '具体路线仍没有来源',
      description: '旧存档里还没有足够证据证明杜衡由外围碎片推断出路线。',
      relatedKnowledgeIds: ['claim-du-fodder-pattern', 'claim-du-route'],
      suggestedPersonIds: ['du'],
      suggestedDocumentIds: ['station-entry', 'route-map', 'trade-prices'],
    });
  }
  if (routeSupported && !integrationSupported) {
    gaps.push({
      id: 'gap-integration',
      kind: 'missing-source',
      title: '碎片尚未形成可传递军情',
      description: '旧存档已能解释路线来源，但还没有价格暗号等信息拼合证据。',
      relatedKnowledgeIds: ['claim-du-route', 'claim-price-cipher'],
      suggestedPersonIds: ['du'],
      suggestedDocumentIds: ['trade-prices'],
    });
  }
  if (integrationSupported && !transmissionSupported) {
    gaps.push({
      id: 'gap-transmitter',
      kind: 'missing-transmitter',
      title: '军情如何离开曹营仍未证实',
      description: '旧存档已有路线与暗号线索，但传递到袁军的关系还没有被钉实。',
      relatedKnowledgeIds: ['claim-price-cipher', 'claim-shuoyuan-received'],
      suggestedPersonIds: ['du'],
      suggestedDocumentIds: ['trade-prices', 'report-ambush'],
    });
  }

  return {
    ...base,
    knowledge,
    theoryNodes: migrationTheoryNodes.map((node) => ({ ...node })),
    theoryEdges,
    theoryEvaluation: {
      status: legacyVerified ? 'verified' : allSupported ? 'supported' : 'incomplete',
      gaps,
      supportedEdgeIds,
      rejectedEdgeIds: [],
    },
    guidance: {
      ...base.guidance,
      currentObjectiveId,
      unusedEvidenceIds: legacy.extractedClaimIds.filter((id) => knowledge[id]?.status === 'observed'),
    },
    baitExperiments,
    enemyFeedback,
  };
}

function migrateLegacyV5(
  legacy: LegacyV5State,
  coreLoop: CoreLoopState = inferCoreLoopFromLegacy(legacy),
): GameState {
  const recovered = recoverPresentation(legacy.presentation);
  const presentation = sanitizeV09Presentation({ ...legacy, presentation: recovered });
  return validateGameState({
    ...legacy,
    version: 6,
    presentation,
    coreLoop,
  });
}

export function migrateGameState(input: unknown): GameState {
  const version = z.object({ version: z.number() }).passthrough().parse(input).version;

  if (version === 6) {
    const state = validateGameState(input);
    const recovered = recoverPresentation(state.presentation);
    return validateGameState({ ...state, presentation: sanitizeV09Presentation({ ...state, presentation: recovered }) });
  }

  if (version === 5) {
    const legacy = LegacyGameStateV5Schema.parse(input);
    return migrateLegacyV5(legacy, inferCoreLoopFromLegacy(legacy));
  }

  if (version === 4) {
    const legacy = LegacyGameStateV4Schema.parse(input);
    const presentation = migrateV4PresentationToV09({
      presentation: legacy.presentation,
      stage: legacy.stage,
      readDocumentIds: legacy.readDocumentIds,
      extractedClaimIds: legacy.extractedClaimIds,
      relationships: legacy.relationships,
      completedInvestigationIds: legacy.completedInvestigationIds,
      selectedBaitIds: legacy.selectedBaitIds,
      baitBand: legacy.baitBand,
      enemyReport: legacy.enemyReport,
      report: legacy.report,
      actionOutcome: legacy.actionOutcome,
      truthOwner: legacy.truthOwner,
    });
    return migrateLegacyV5(LegacyGameStateV5Schema.parse({ ...legacy, version: 5, presentation }));
  }

  if (version === 3) {
    const legacy = LegacyGameStateV3Schema.parse(input);
    const history = (legacy.presentation.sceneHistory ?? []).map((sceneId) => ({
      sceneId,
      storySceneId: legacy.presentation.storySceneId,
      beatIndex: legacy.presentation.beatIndex,
    }));
    const legacyPresentation = recoverPresentation({ ...legacy.presentation, sceneHistory: history });
    const presentation = migrateV4PresentationToV09({
      presentation: legacyPresentation,
      stage: legacy.stage,
      readDocumentIds: legacy.readDocumentIds,
      extractedClaimIds: legacy.extractedClaimIds,
      relationships: legacy.relationships,
      completedInvestigationIds: legacy.completedInvestigationIds,
      selectedBaitIds: legacy.selectedBaitIds,
      baitBand: legacy.baitBand,
      enemyReport: legacy.enemyReport,
      report: legacy.report,
      actionOutcome: legacy.actionOutcome,
      truthOwner: legacy.truthOwner,
    });
    return migrateLegacyV5(LegacyGameStateV5Schema.parse({ ...legacy, version: 5, presentation }));
  }

  const defaultPresentation = createInitialState().presentation;

  if (version === 2) {
    const legacy = LegacyGameStateV2Schema.parse(input);
    const legacySceneId = legacy.completedInvestigationIds.includes('investigate-handwriting')
      ? (legacy.extractedClaimIds.includes('claim-zhao-time') ? 'deduction' : 'first-deduction')
      : legacy.extractedClaimIds.includes('claim-zhao-denial')
        ? 'investigation'
        : legacy.extractedClaimIds.includes('claim-shuoyuan-received')
          ? 'dialogue'
          : legacy.readDocumentIds.includes('report-ambush')
            ? 'document'
            : 'title';
    const legacyPresentation = {
      ...defaultPresentation,
      sceneId: legacySceneId,
      storySceneId: legacySceneId === 'dialogue' ? 'zhao-introduction' : 'intro-cg',
      documentFindingIds: legacy.extractedClaimIds.includes('claim-shuoyuan-received')
        ? ['ambush-location', 'ambush-time']
        : [],
      handwritingFindingIds: legacy.completedInvestigationIds.includes('investigate-handwriting')
        ? ['hook-stroke', 'cart-stroke']
        : [],
    } as import('./domain').PresentationState;
    const presentation = migrateV4PresentationToV09({
      presentation: legacyPresentation,
      stage: legacy.stage,
      readDocumentIds: legacy.readDocumentIds,
      extractedClaimIds: legacy.extractedClaimIds,
      relationships: legacy.relationships,
      completedInvestigationIds: legacy.completedInvestigationIds,
      selectedBaitIds: legacy.selectedBaitIds,
      baitBand: legacy.baitBand,
      enemyReport: legacy.enemyReport,
      report: legacy.report,
      actionOutcome: legacy.actionOutcome,
      truthOwner: legacy.truthOwner,
    });
    return migrateLegacyV5(LegacyGameStateV5Schema.parse({ ...legacy, version: 5, presentation }));
  }

  if (version === 1) {
    const legacy = LegacyGameStateV1Schema.parse(input);
    return migrateLegacyV5(LegacyGameStateV5Schema.parse({
      ...legacy,
      version: 5,
      tutorial: { step: 'skipped', startedAtLeastOnce: true, enabled: true, seenLessonIds: [] },
      presentation: defaultPresentation,
    }));
  }

  throw new Error(`Unsupported game state version: ${version}`);
}
