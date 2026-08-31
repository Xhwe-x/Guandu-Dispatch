import type { GameSceneId } from './scenes';
export type EntityId = string;
export type Stage = 'documents' | 'secrets' | 'chain' | 'bait' | 'report' | 'ending';
export type RelationKind = 'supports' | 'refutes' | 'sourceOf' | 'accessedBy' | 'infers' | 'transmitsTo';
export type LogicSlot = 'leakedInfo' | 'source' | 'actor' | 'method' | 'enemyConclusion';
export type PersonState = 'cooperative' | 'guarded' | 'hostile';
export type InterrogationTone = 'calm' | 'threaten' | 'empathize' | 'misdirect';
export type TruthOwner = 'canghe' | 'shuoyuan' | 'lishe' | 'destroyed';
export type ActionOutcome = 'networkClosed' | 'convoySavedIncomplete' | 'ambushedAgain';
export type BaitBand = 'bothCore' | 'oneCore' | 'noneCore';
export type TutorialStep =
  | 'notStarted'
  | 'introIdentity'
  | 'introIncident'
  | 'introObjective'
  | 'openAmbushReport'
  | 'extractAmbushClaim'
  | 'openZhaoStatement'
  | 'extractZhaoDenial'
  | 'investigateHandwriting'
  | 'interrogateZhao'
  | 'placeContradiction'
  | 'completed'
  | 'skipped';

export interface TutorialState {
  step: TutorialStep;
  startedAtLeastOnce: boolean;
  enabled?: boolean;
  seenLessonIds?: string[];
}

export type CaoCaoAttitude = 'observing' | 'calm' | 'approving' | 'displeased';
export type AudienceVisitId = 'first-report' | 'final-report';

export interface DialogueHistoryEntry {
  id: string;
  speakerId?: EntityId;
  speakerName: string;
  text: string;
}

export interface AudioSettings {
  enabled: boolean;
  voiceEnabled: boolean;
  volume: number;
}

export interface Character {
  id: EntityId;
  name: string;
  role: string;
  access: string[];
  secret: string;
  responsibility: string;
}

export interface Document {
  id: EntityId;
  title: string;
  category: 'report' | 'ledger' | 'statement' | 'repair' | 'trade' | 'map';
  body: string;
  claimIds: EntityId[];
}

export interface Claim {
  id: EntityId;
  text: string;
  sourceDocumentId: EntityId;
  provenance: {
    kind: 'document' | 'investigation' | 'interrogation';
    sourceId: EntityId;
  };
  tags: string[];
}

export interface Relationship {
  fromId: EntityId;
  toId: EntityId;
  kind: RelationKind;
  slot: LogicSlot;
}

export interface Investigation {
  id: EntityId;
  title: string;
  cost: 1;
  revealClaimIds: EntityId[];
}

export interface InterrogationRule {
  id: EntityId;
  characterId: EntityId;
  statementClaimId: EntityId;
  evidenceClaimId: EntityId;
  revealClaimIds: EntityId[];
  responseKeys: Record<InterrogationTone, string>;
}

export interface BaitOption {
  id: EntityId;
  channel: 'lu' | 'zheng' | 'zhao' | 'du';
  payload: string;
  signal: string;
  requiredClaimIds: EntityId[];
  core: boolean;
}

export interface ReportSubmission {
  leakedInfo: string[];
  sourceCharacterIds: EntityId[];
  integratorId: EntityId;
  transmissionMethod: string;
  evidenceClaimIds: EntityId[];
  handling: 'arrest' | 'cutOff' | 'exploit' | 'differentiate';
}

export interface ReportDraft {
  leakedInfo: string[];
  sourceCharacterIds: EntityId[];
  integratorId?: EntityId;
  transmissionMethod?: string;
  evidenceClaimIds: EntityId[];
  handling: ReportSubmission['handling'];
}

export interface RealConvoyPlan {
  route: string;
  time: string;
}

export interface EnemyReport {
  route: string;
  time: string;
}

export interface GameContent {
  id: 'guandu';
  characters: Character[];
  documents: Document[];
  claims: Claim[];
  investigations: Investigation[];
  interrogations: InterrogationRule[];
  baits: BaitOption[];
  relationshipPermissions: Relationship[];
  hints: Record<string, [string, string, string]>;
  epilogueFragments: Record<string, string>;
}



export type KnowledgeStatus = 'unknown' | 'observed' | 'suspected' | 'contradicted' | 'supported' | 'verified' | 'excluded';

export interface KnowledgeEntry {
  id: EntityId;
  kind: 'claim' | 'person' | 'document' | 'relationship' | 'enemy-feedback';
  status: KnowledgeStatus;
  sourceIds: EntityId[];
  relatedPersonIds: EntityId[];
  relatedDocumentIds: EntityId[];
  lastUpdatedAt: number;
}

export interface CaseObjective {
  id: EntityId;
  title: string;
  question: string;
  requiredKnowledgeIds: EntityId[];
  optionalKnowledgeIds: EntityId[];
  completion: 'manual' | 'all-required-supported' | 'theory-supported' | 'theory-verified';
  nextObjectiveId?: EntityId;
}

export interface EvidenceReaction {
  id: EntityId;
  characterId: EntityId;
  evidenceClaimId: EntityId;
  requiredKnowledgeIds?: EntityId[];
  response: string;
  reaction: 'irrelevant' | 'deflect' | 'guarded' | 'contradicted' | 'breakthrough';
  revealClaimIds: EntityId[];
  knowledgeUpdates: Array<{ knowledgeId: EntityId; status: KnowledgeStatus }>;
}

export type TheoryNodeKind = 'person' | 'claim' | 'document' | 'information' | 'method' | 'enemy';
export interface TheoryNode { id: EntityId; kind: TheoryNodeKind; sourceId: EntityId; label: string; }
export interface TheoryEdge { id: EntityId; fromId: EntityId; toId: EntityId; relation: RelationKind; status: 'proposed' | 'supported' | 'verified' | 'rejected'; }

export interface TheoryGap {
  id: EntityId;
  kind: 'missing-source' | 'missing-route' | 'missing-transmitter' | 'unsupported-edge' | 'conflict';
  title: string;
  description: string;
  relatedKnowledgeIds: EntityId[];
  suggestedPersonIds: EntityId[];
  suggestedDocumentIds: EntityId[];
}

export interface TheoryEvaluation {
  status: 'incomplete' | 'conflicted' | 'supported' | 'verified';
  gaps: TheoryGap[];
  supportedEdgeIds: EntityId[];
  rejectedEdgeIds: EntityId[];
}

export type GuidanceStatus = 'unseen' | 'shown' | 'dismissed' | 'resolved';
export interface GuidanceCue {
  id: EntityId;
  objectiveId: EntityId;
  trigger: 'stalled' | 'invalid-theory' | 'unused-evidence' | 'new-gap' | 'manual';
  level1: string;
  level2: string;
  level3: string;
  relatedPersonIds: EntityId[];
  relatedDocumentIds: EntityId[];
}

export interface GuidanceState {
  currentObjectiveId: EntityId;
  cueStates: Record<EntityId, GuidanceStatus>;
  manualHintLevels: Record<EntityId, 0 | 1 | 2 | 3>;
  lastProgressAt: number;
  invalidTheoryAttempts: number;
  unusedEvidenceIds: EntityId[];
}

export interface BaitExperiment {
  id: EntityId;
  theoryEdgeIds: EntityId[];
  baitIds: EntityId[];
  hypothesis: string;
  expectedSignals: string[];
  status: 'draft' | 'deployed' | 'observed' | 'resolved';
}

export interface EnemyFeedback {
  id: EntityId;
  source: 'scout' | 'market' | 'intercept' | 'no-response';
  text: string;
  relatedBaitIds: EntityId[];
  supportsTheoryEdgeIds: EntityId[];
  contradictsTheoryEdgeIds: EntityId[];
}

export interface CoreLoopState {
  knowledge: Record<EntityId, KnowledgeEntry>;
  theoryNodes: TheoryNode[];
  theoryEdges: TheoryEdge[];
  theoryEvaluation: TheoryEvaluation;
  guidance: GuidanceState;
  baitExperiments: BaitExperiment[];
  enemyFeedback: EnemyFeedback[];
  selectedDossierTarget?: { kind: 'person' | 'document' | 'knowledge' | 'gap'; id: EntityId };
}

export interface PresentationSnapshot {
  sceneId: GameSceneId;
  storySceneId: string;
  beatIndex: number;
  dialogueNodeId?: string;
}

export interface PresentationState {
  sceneId: GameSceneId;
  sceneHistory?: PresentationSnapshot[];
  storySceneId: string;
  beatIndex: number;
  dialogueNodeId?: string;
  documentFindingIds: EntityId[];
  handwritingFindingIds: EntityId[];
  interrogation: {
    evidenceClaimId: EntityId;
    tone: InterrogationTone;
    attempts: number;
  };
  deduction: {
    fromId?: EntityId;
    toId?: EntityId;
    kind?: RelationKind;
  };
  networkTheory: {
    timeSourceId?: EntityId;
    routeSourceId?: EntityId;
    transmitterId?: EntityId;
  };
  reportDraft: ReportDraft;
  audience?: {
    visitId: AudienceVisitId;
    shotIndex: number;
    attitude: CaoCaoAttitude;
    choiceIds: string[];
  };
}

export interface GameState {
  version: 6;
  audio?: AudioSettings;
  tutorial: TutorialState;
  presentation: PresentationState;
  stage: Stage;
  investigationPoints: number;
  readDocumentIds: EntityId[];
  extractedClaimIds: EntityId[];
  relationships: Relationship[];
  completedInvestigationIds: EntityId[];
  personStates: Record<EntityId, PersonState>;
  selectedBaitIds: EntityId[];
  realPlan?: RealConvoyPlan;
  baitBand?: BaitBand;
  enemyReport?: EnemyReport;
  report?: ReportSubmission;
  actionOutcome?: ActionOutcome;
  truthOwner?: TruthOwner;
  hintUsage: Record<string, number>;
  dialogueHistory: DialogueHistoryEntry[];
  coreLoop: CoreLoopState;
}
