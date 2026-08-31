import type {
  ActionOutcome,
  AudioSettings,
  AudienceVisitId,
  CaoCaoAttitude,
  BaitBand,
  BaitOption,
  EnemyReport,
  GameState,
  InterrogationTone,
  PersonState,
  RealConvoyPlan,
  RelationKind,
  Relationship,
  ReportDraft,
  ReportSubmission,
  Stage,
  TutorialStep,
  TruthOwner,
  PresentationSnapshot,
  DialogueHistoryEntry,
  KnowledgeEntry,
  KnowledgeStatus,
  TheoryNode,
  TheoryEdge,
  TheoryEvaluation,
  GuidanceState,
  BaitExperiment,
  EnemyFeedback,
  CoreLoopState,
} from './domain';
import type { GameSceneId } from './scenes';
import { recoverPresentation, snapshotPresentation, storyBeatId } from './presentationRecovery';
import { sanitizeV09Presentation } from './v09PresentationMigration';

const stageOrder: Stage[] = ['documents', 'secrets', 'chain', 'bait', 'report', 'ending'];

export type GameAction =
  | { type: 'READ_DOCUMENT'; documentId: string }
  | { type: 'RECORD_DIALOGUE'; entry: DialogueHistoryEntry }
  | { type: 'EXTRACT_CLAIM'; claimId: string }
  | { type: 'PLACE_RELATIONSHIP'; relationship: Relationship }
  | { type: 'COMPLETE_INVESTIGATION'; investigationId: string; revealClaimIds: string[] }
  | { type: 'SET_PERSON_STATE'; characterId: string; state: PersonState }
  | { type: 'SELECT_BAIT'; baitId: string; channel: BaitOption['channel'] }
  | { type: 'SUBMIT_REPORT'; report: ReportSubmission; outcome: ActionOutcome }
  | { type: 'CHOOSE_TRUTH_OWNER'; owner: TruthOwner }
  | { type: 'USE_HINT'; topic: string; level: 1 | 2 | 3 }
  | { type: 'CONFIRM_ADVANCE' }
  | { type: 'SET_TUTORIAL_STEP'; step: TutorialStep }
  | { type: 'RESET_TUTORIAL' }
  | { type: 'SET_TUTORIAL_ENABLED'; enabled: boolean }
  | { type: 'MARK_TUTORIAL_LESSON'; lessonId: string }
  | { type: 'SET_AUDIO_SETTINGS'; settings: Partial<AudioSettings> }
  | { type: 'SET_SCENE'; sceneId: GameSceneId }
  | { type: 'GO_BACK' }
  | { type: 'REPAIR_PRESENTATION' }
  | { type: 'SET_STORY_POSITION'; storySceneId: string; beatIndex: number }
  | { type: 'MARK_DOCUMENT_FINDING'; findingId: string }
  | { type: 'MARK_HANDWRITING_FINDING'; findingId: string }
  | { type: 'SET_INTERROGATION_SELECTION'; evidenceClaimId: string; tone: InterrogationTone }
  | { type: 'RECORD_INTERROGATION_ATTEMPT' }
  | { type: 'SET_DEDUCTION_DRAFT'; fromId?: string; toId?: string; kind?: RelationKind }
  | { type: 'SET_NETWORK_THEORY'; timeSourceId?: string; routeSourceId?: string; transmitterId?: string }
  | { type: 'SET_REPORT_DRAFT'; reportDraft: ReportDraft }
  | { type: 'START_AUDIENCE'; visitId: AudienceVisitId }
  | { type: 'SET_AUDIENCE_SHOT'; shotIndex: number }
  | { type: 'RECORD_AUDIENCE_CHOICE'; choiceId: string; attitude: CaoCaoAttitude }
  | { type: 'RESOLVE_BAIT'; realPlan: RealConvoyPlan; baitBand: BaitBand; enemyReport: EnemyReport }
  | { type: 'SET_STAGE'; stage: Stage }
  | { type: 'APPLY_RULE_STATE'; state: GameState }
  | { type: 'UPSERT_KNOWLEDGE'; entry: KnowledgeEntry }
  | { type: 'SET_KNOWLEDGE_STATUS'; knowledgeId: string; status: KnowledgeStatus; at: number }
  | { type: 'SET_OBJECTIVE'; objectiveId: string }
  | { type: 'SET_THEORY_GRAPH'; nodes: TheoryNode[]; edges: TheoryEdge[]; evaluation: TheoryEvaluation }
  | { type: 'SET_GUIDANCE_STATE'; guidance: GuidanceState }
  | { type: 'UPSERT_BAIT_EXPERIMENT'; experiment: BaitExperiment }
  | { type: 'ADD_ENEMY_FEEDBACK'; feedback: EnemyFeedback }
  | { type: 'SET_DOSSIER_TARGET'; target?: CoreLoopState['selectedDossierTarget'] }
  | { type: 'RESTORE_STATE'; state: GameState };

const addOnce = (items: string[], id: string) => (items.includes(id) ? items : [...items, id]);

function sameRelationship(left: Relationship, right: Relationship) {
  return left.fromId === right.fromId
    && left.toId === right.toId
    && left.kind === right.kind
    && left.slot === right.slot;
}

function addRelationshipOnce(items: Relationship[], relationship: Relationship) {
  return items.some((item) => sameRelationship(item, relationship))
    ? items
    : [...items, relationship];
}


function mergeIds(left: string[], right: string[]) {
  return [...new Set([...left, ...right])];
}

function mergeKnowledgeEntry(previous: KnowledgeEntry | undefined, entry: KnowledgeEntry): KnowledgeEntry {
  if (!previous) return entry;
  return {
    ...previous,
    ...entry,
    sourceIds: mergeIds(previous.sourceIds, entry.sourceIds),
    relatedPersonIds: mergeIds(previous.relatedPersonIds, entry.relatedPersonIds),
    relatedDocumentIds: mergeIds(previous.relatedDocumentIds, entry.relatedDocumentIds),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RECORD_DIALOGUE': {
      const exists = state.dialogueHistory.some((item) => item.id === action.entry.id);
      return exists ? state : { ...state, dialogueHistory: [...state.dialogueHistory, action.entry].slice(-80) };
    }
    case 'READ_DOCUMENT': {
      const knowledge = state.coreLoop.knowledge[action.documentId] ?? {
        id: action.documentId,
        kind: 'document' as const,
        status: 'observed' as const,
        sourceIds: [action.documentId],
        relatedPersonIds: [],
        relatedDocumentIds: [action.documentId],
        lastUpdatedAt: Date.now(),
      };
      return {
        ...state,
        readDocumentIds: addOnce(state.readDocumentIds, action.documentId),
        coreLoop: { ...state.coreLoop, knowledge: { ...state.coreLoop.knowledge, [action.documentId]: knowledge } },
      };
    }
    case 'EXTRACT_CLAIM': {
      const inferredPerson = ['zhao', 'du', 'lu', 'zheng'].find((id) => action.claimId.startsWith(`claim-${id}-`));
      const previous = state.coreLoop.knowledge[action.claimId];
      const entry: KnowledgeEntry = previous ?? {
        id: action.claimId,
        kind: 'claim',
        status: 'observed',
        sourceIds: [],
        relatedPersonIds: inferredPerson ? [inferredPerson] : [],
        relatedDocumentIds: [],
        lastUpdatedAt: Date.now(),
      };
      return {
        ...state,
        extractedClaimIds: addOnce(state.extractedClaimIds, action.claimId),
        coreLoop: { ...state.coreLoop, knowledge: { ...state.coreLoop.knowledge, [action.claimId]: entry } },
      };
    }
    case 'PLACE_RELATIONSHIP':
      return { ...state, relationships: addRelationshipOnce(state.relationships, action.relationship) };
    case 'COMPLETE_INVESTIGATION': {
      if (state.investigationPoints <= 0 || state.completedInvestigationIds.includes(action.investigationId)) {
        return state;
      }

      return {
        ...state,
        investigationPoints: state.investigationPoints - 1,
        completedInvestigationIds: addOnce(state.completedInvestigationIds, action.investigationId),
        extractedClaimIds: [...new Set([...state.extractedClaimIds, ...action.revealClaimIds])],
      };
    }
    case 'SET_PERSON_STATE':
      return { ...state, personStates: { ...state.personStates, [action.characterId]: action.state } };
    case 'SELECT_BAIT': {
      const channelPrefix = `bait-${action.channel}-`;
      const otherChannels = state.selectedBaitIds.filter((id) => !id.startsWith(channelPrefix));
      return { ...state, selectedBaitIds: addOnce(otherChannels, action.baitId) };
    }
    case 'SUBMIT_REPORT':
      return { ...state, report: action.report, actionOutcome: action.outcome };
    case 'CHOOSE_TRUTH_OWNER':
      return { ...state, truthOwner: action.owner };
    case 'USE_HINT':
      return { ...state, hintUsage: { ...state.hintUsage, [action.topic]: action.level } };
    case 'CONFIRM_ADVANCE': {
      const index = stageOrder.indexOf(state.stage);
      return { ...state, stage: stageOrder[Math.min(index + 1, stageOrder.length - 1)] };
    }
    case 'SET_TUTORIAL_STEP':
      return {
        ...state,
        tutorial: {
          ...state.tutorial,
          step: action.step,
          startedAtLeastOnce: state.tutorial.startedAtLeastOnce || action.step !== 'notStarted',
        },
      };
    case 'RESET_TUTORIAL':
      return { ...state, tutorial: { ...state.tutorial, step: 'notStarted', startedAtLeastOnce: false, seenLessonIds: [] } };
    case 'SET_TUTORIAL_ENABLED':
      return { ...state, tutorial: { ...state.tutorial, enabled: action.enabled } };
    case 'MARK_TUTORIAL_LESSON':
      return { ...state, tutorial: { ...state.tutorial, seenLessonIds: addOnce(state.tutorial.seenLessonIds ?? [], action.lessonId) } };
    case 'SET_AUDIO_SETTINGS':
      return { ...state, audio: { ...(state.audio ?? { enabled: true, voiceEnabled: true, volume: 0.72 }), ...action.settings, volume: Math.max(0, Math.min(1, action.settings.volume ?? state.audio?.volume ?? 0.72)) } };
    case 'SET_SCENE': {
      if (state.presentation.sceneId === action.sceneId) return state;
      const currentHistory = state.presentation.sceneHistory ?? [];
      const history = state.presentation.sceneId === 'title'
        ? currentHistory
        : [...currentHistory, snapshotPresentation(state.presentation)].slice(-24);
      return {
        ...state,
        presentation: recoverPresentation({ ...state.presentation, sceneId: action.sceneId, sceneHistory: history }),
      };
    }
    case 'REPAIR_PRESENTATION': {
      const recovered = recoverPresentation(state.presentation);
      return { ...state, presentation: sanitizeV09Presentation({ ...state, presentation: recovered }) };
    }
    case 'GO_BACK': {
      const history = state.presentation.sceneHistory ?? [];
      const previous: PresentationSnapshot | undefined = history.at(-1);
      if (!previous) return state;
      return {
        ...state,
        presentation: recoverPresentation({
          ...state.presentation,
          ...previous,
          sceneHistory: history.slice(0, -1),
        }),
      };
    }
    case 'SET_STORY_POSITION': {
      const beatIndex = Math.max(0, action.beatIndex);
      return {
        ...state,
        presentation: {
          ...state.presentation,
          storySceneId: action.storySceneId,
          beatIndex,
          dialogueNodeId: storyBeatId(action.storySceneId, beatIndex),
        },
      };
    }
    case 'MARK_DOCUMENT_FINDING':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          documentFindingIds: addOnce(state.presentation.documentFindingIds, action.findingId),
        },
      };
    case 'MARK_HANDWRITING_FINDING':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          handwritingFindingIds: addOnce(state.presentation.handwritingFindingIds, action.findingId),
        },
      };
    case 'SET_INTERROGATION_SELECTION':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          interrogation: {
            ...state.presentation.interrogation,
            evidenceClaimId: action.evidenceClaimId,
            tone: action.tone,
          },
        },
      };
    case 'RECORD_INTERROGATION_ATTEMPT':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          interrogation: {
            ...state.presentation.interrogation,
            attempts: state.presentation.interrogation.attempts + 1,
          },
        },
      };
    case 'SET_DEDUCTION_DRAFT':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          deduction: {
            fromId: action.fromId,
            toId: action.toId,
            kind: action.kind,
          },
        },
      };
    case 'SET_NETWORK_THEORY':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          networkTheory: {
            timeSourceId: action.timeSourceId,
            routeSourceId: action.routeSourceId,
            transmitterId: action.transmitterId,
          },
        },
      };
    case 'SET_REPORT_DRAFT':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          reportDraft: action.reportDraft,
        },
      };
    case 'START_AUDIENCE':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          audience: { visitId: action.visitId, shotIndex: 0, attitude: 'observing', choiceIds: [] },
        },
      };
    case 'SET_AUDIENCE_SHOT':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          audience: { ...(state.presentation.audience ?? { visitId: 'first-report', shotIndex: 0, attitude: 'observing', choiceIds: [] }), shotIndex: Math.max(0, action.shotIndex) },
        },
      };
    case 'RECORD_AUDIENCE_CHOICE':
      return {
        ...state,
        presentation: {
          ...state.presentation,
          audience: {
            ...(state.presentation.audience ?? { visitId: 'first-report', shotIndex: 0, attitude: 'observing', choiceIds: [] }),
            attitude: action.attitude,
            choiceIds: addOnce(state.presentation.audience?.choiceIds ?? [], action.choiceId),
          },
        },
      };
    case 'RESOLVE_BAIT':
      return {
        ...state,
        realPlan: action.realPlan,
        baitBand: action.baitBand,
        enemyReport: action.enemyReport,
      };
    case 'SET_STAGE':
      return { ...state, stage: action.stage };
    case 'APPLY_RULE_STATE':
      return action.state;
    case 'UPSERT_KNOWLEDGE': {
      const previous = state.coreLoop.knowledge[action.entry.id];
      const entry = mergeKnowledgeEntry(previous, action.entry);
      return { ...state, coreLoop: { ...state.coreLoop, knowledge: { ...state.coreLoop.knowledge, [entry.id]: entry } } };
    }
    case 'SET_KNOWLEDGE_STATUS': {
      const previous = state.coreLoop.knowledge[action.knowledgeId];
      if (!previous) return state;
      return {
        ...state,
        coreLoop: {
          ...state.coreLoop,
          knowledge: {
            ...state.coreLoop.knowledge,
            [action.knowledgeId]: { ...previous, status: action.status, lastUpdatedAt: action.at },
          },
        },
      };
    }
    case 'SET_OBJECTIVE':
      return { ...state, coreLoop: { ...state.coreLoop, guidance: { ...state.coreLoop.guidance, currentObjectiveId: action.objectiveId } } };
    case 'SET_THEORY_GRAPH':
      return { ...state, coreLoop: { ...state.coreLoop, theoryNodes: action.nodes, theoryEdges: action.edges, theoryEvaluation: action.evaluation } };
    case 'SET_GUIDANCE_STATE':
      return { ...state, coreLoop: { ...state.coreLoop, guidance: action.guidance } };
    case 'UPSERT_BAIT_EXPERIMENT': {
      const index = state.coreLoop.baitExperiments.findIndex((item) => item.id === action.experiment.id);
      const baitExperiments = index < 0
        ? [...state.coreLoop.baitExperiments, action.experiment]
        : state.coreLoop.baitExperiments.map((item) => item.id === action.experiment.id ? action.experiment : item);
      return { ...state, coreLoop: { ...state.coreLoop, baitExperiments } };
    }
    case 'ADD_ENEMY_FEEDBACK': {
      const enemyFeedback = state.coreLoop.enemyFeedback.some((item) => item.id === action.feedback.id)
        ? state.coreLoop.enemyFeedback.map((item) => item.id === action.feedback.id ? action.feedback : item)
        : [...state.coreLoop.enemyFeedback, action.feedback];
      return { ...state, coreLoop: { ...state.coreLoop, enemyFeedback } };
    }
    case 'SET_DOSSIER_TARGET':
      return { ...state, coreLoop: { ...state.coreLoop, selectedDossierTarget: action.target } };
    case 'RESTORE_STATE':
      return action.state;
  }
}
