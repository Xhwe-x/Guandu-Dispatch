import type {
  ActionOutcome,
  BaitBand,
  EnemyReport,
  GameState,
  PresentationState,
  Relationship,
  ReportSubmission,
  Stage,
  TruthOwner,
} from './domain';
import type { GameSceneId } from './scenes';

export interface V09PresentationMigrationContext {
  presentation: PresentationState;
  stage: Stage;
  readDocumentIds: string[];
  extractedClaimIds: string[];
  relationships: Relationship[];
  completedInvestigationIds: string[];
  selectedBaitIds: string[];
  baitBand?: BaitBand;
  enemyReport?: EnemyReport;
  report?: ReportSubmission;
  actionOutcome?: ActionOutcome;
  truthOwner?: TruthOwner;
}

export const V09_SAFE_SCENES = new Set<GameSceneId>([
  'title',
  'opening',
  'first-evidence',
  'first-deduction',
  'interrogation',
  'case-summary',
  'network-investigation',
  'network-deduction',
  'audience',
  'bait',
  'enemy-report',
  'final-report',
  'ending',
]);

function hasRelationship(
  relationships: Relationship[],
  fromId: string,
  toId: string,
  kind: Relationship['kind'],
) {
  return relationships.some((item) => item.fromId === fromId && item.toId === toId && item.kind === kind);
}

function chooseLegacyScene(context: V09PresentationMigrationContext): GameSceneId {
  const { presentation, stage } = context;

  // Legacy story shells are deliberately reset into the progressive v0.9 opening.
  if (presentation.sceneId === 'dialogue' || presentation.sceneId === 'story' || presentation.sceneId === 'camp') {
    return 'opening';
  }

  // Scenes that already exist in v0.9 can stay where the player left them.
  if (V09_SAFE_SCENES.has(presentation.sceneId)) {
    return presentation.sceneId;
  }

  if (context.truthOwner || stage === 'ending') return 'ending';
  if (context.report || stage === 'report') return 'final-report';
  if (context.enemyReport && context.baitBand) return 'audience';
  if (context.selectedBaitIds.length > 0 || stage === 'bait') return 'bait';

  const claims = new Set(context.extractedClaimIds);
  const hasCoreNetworkClaims = [
    'claim-zhao-time',
    'claim-du-route',
    'claim-price-cipher',
  ].every((id) => claims.has(id));
  const hasCoreNetworkRelations =
    hasRelationship(context.relationships, 'claim-zhao-time', 'zhao', 'accessedBy')
    && hasRelationship(context.relationships, 'claim-du-route', 'du', 'infers')
    && hasRelationship(context.relationships, 'claim-price-cipher', 'claim-shuoyuan-received', 'supports');

  if (stage === 'chain' && hasCoreNetworkRelations) return 'audience';
  if (stage === 'chain' || hasCoreNetworkClaims) return 'network-deduction';

  const hasNetworkInvestigationProgress = context.completedInvestigationIds?.length
    || [...claims].some((id) => id.startsWith('claim-lu-') || id.startsWith('claim-zheng-') || id.startsWith('claim-du-'));
  if (stage === 'secrets' || hasNetworkInvestigationProgress) return 'network-investigation';

  if (claims.has('claim-zhao-time')) return 'case-summary';

  const hasFirstContradiction = hasRelationship(
    context.relationships,
    'claim-zhao-copied-order',
    'claim-zhao-denial',
    'refutes',
  );
  if (hasFirstContradiction) return 'interrogation';

  if (claims.has('claim-zhao-denial') && claims.has('claim-zhao-copied-order')) return 'first-deduction';
  if (
    claims.has('claim-zhao-denial')
    || claims.has('claim-zhao-copied-order')
    || context.readDocumentIds.includes('statement-zhao')
    || context.readDocumentIds.includes('report-ambush')
  ) return 'first-evidence';

  return 'opening';
}


export function isV09SafeScene(sceneId: GameSceneId): boolean {
  return V09_SAFE_SCENES.has(sceneId);
}

export function v09RecoverySceneForState(
  context: Pick<GameState,
    | 'presentation'
    | 'stage'
    | 'readDocumentIds'
    | 'extractedClaimIds'
    | 'relationships'
    | 'completedInvestigationIds'
    | 'selectedBaitIds'
    | 'baitBand'
    | 'enemyReport'
    | 'report'
    | 'actionOutcome'
    | 'truthOwner'>,
): GameSceneId {
  return chooseLegacyScene(context);
}

export function v09ChapterStartForStage(stage: Stage): GameSceneId {
  switch (stage) {
    case 'documents': return 'opening';
    case 'secrets': return 'network-investigation';
    case 'chain': return 'network-deduction';
    case 'bait': return 'bait';
    case 'report': return 'final-report';
    case 'ending': return 'ending';
  }
}

const V09_OPENING_STORY_IDS = new Set([
  'prologue-background',
  'player-identity',
  'basic-onboarding',
  'zhao-first-intro',
  'zhao-first-dialogue',
]);

/**
 * Normalizes already-v5 saves without throwing away valid v0.9 navigation.
 * Legacy scene snapshots are filtered so GO_BACK cannot reopen v0.8 shells.
 */
export function sanitizeV09Presentation(
  context: Pick<GameState,
    | 'presentation'
    | 'stage'
    | 'readDocumentIds'
    | 'extractedClaimIds'
    | 'relationships'
    | 'completedInvestigationIds'
    | 'selectedBaitIds'
    | 'baitBand'
    | 'enemyReport'
    | 'report'
    | 'actionOutcome'
    | 'truthOwner'>,
): PresentationState {
  const sceneId = v09RecoverySceneForState(context);
  if (!isV09SafeScene(context.presentation.sceneId)) {
    return migrateV4PresentationToV09(context);
  }

  const safeHistory = (context.presentation.sceneHistory ?? [])
    .filter((snapshot) => isV09SafeScene(snapshot.sceneId))
    .slice(-24);

  const presentation = {
    ...context.presentation,
    sceneId,
    sceneHistory: safeHistory,
  };

  if (sceneId === 'title') {
    return {
      ...presentation,
      storySceneId: 'prologue-background',
      beatIndex: 0,
      dialogueNodeId: undefined,
    };
  }

  if (sceneId === 'opening' && !V09_OPENING_STORY_IDS.has(presentation.storySceneId)) {
    return {
      ...presentation,
      storySceneId: 'prologue-background',
      beatIndex: 0,
      dialogueNodeId: undefined,
    };
  }

  return presentation;
}

function storyPositionForScene(sceneId: GameSceneId, legacySceneId: GameSceneId) {
  if (sceneId === 'title') {
    return { storySceneId: 'prologue-background', beatIndex: 0 };
  }
  if (sceneId === 'opening') {
    return legacySceneId === 'dialogue'
      ? { storySceneId: 'zhao-first-dialogue', beatIndex: 0 }
      : { storySceneId: 'prologue-background', beatIndex: 0 };
  }
  return { storySceneId: 'case-summary', beatIndex: 0 };
}

/**
 * v0.8.x -> v0.9 presentation reset.
 * Case evidence/progress is preserved by the caller; only presentation location is normalized.
 * Old navigation history is intentionally discarded so GO_BACK cannot reopen legacy scenes.
 */
export function migrateV4PresentationToV09(context: V09PresentationMigrationContext): PresentationState {
  const legacySceneId = context.presentation.sceneId;
  const sceneId = chooseLegacyScene(context);
  const storyPosition = storyPositionForScene(sceneId, legacySceneId);
  const audience = sceneId === 'audience'
    ? {
        ...(context.presentation.audience ?? {
          visitId: context.enemyReport ? 'final-report' as const : 'first-report' as const,
          shotIndex: 0,
          attitude: 'observing' as const,
          choiceIds: [],
        }),
        visitId: context.enemyReport ? 'final-report' as const : (context.presentation.audience?.visitId ?? 'first-report'),
        shotIndex: 0,
      }
    : context.presentation.audience;

  return {
    ...context.presentation,
    ...storyPosition,
    sceneId,
    sceneHistory: [],
    dialogueNodeId: undefined,
    audience,
  };
}
