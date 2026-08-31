import type { GameState } from './domain';

export function createInitialState(): GameState {
  return {
    version: 6,
    tutorial: {
      step: 'notStarted',
      startedAtLeastOnce: false,
      enabled: true,
      seenLessonIds: [],
    },
    audio: { enabled: true, voiceEnabled: true, volume: 0.72 },
    presentation: {
      sceneId: 'title',
      sceneHistory: [],
      storySceneId: 'prologue-background',
      beatIndex: 0,
      documentFindingIds: [],
      handwritingFindingIds: [],
      interrogation: {
        evidenceClaimId: 'claim-shuoyuan-received',
        tone: 'calm',
        attempts: 0,
      },
      deduction: {},
      networkTheory: {},
      reportDraft: {
        leakedInfo: [],
        sourceCharacterIds: [],
        evidenceClaimIds: [],
        handling: 'differentiate',
      },
      audience: {
        visitId: 'first-report',
        shotIndex: 0,
        attitude: 'observing',
        choiceIds: [],
      },
    },
    stage: 'documents',
    investigationPoints: 3,
    readDocumentIds: [],
    extractedClaimIds: [],
    relationships: [],
    completedInvestigationIds: [],
    personStates: {
      lu: 'cooperative',
      zheng: 'cooperative',
      zhao: 'cooperative',
      du: 'cooperative',
    },
    selectedBaitIds: [],
    hintUsage: {},
    dialogueHistory: [],
    coreLoop: {
      knowledge: {},
      theoryNodes: [],
      theoryEdges: [],
      theoryEvaluation: { status: 'incomplete', gaps: [], supportedEdgeIds: [], rejectedEdgeIds: [] },
      guidance: {
        currentObjectiveId: 'objective-time-leak',
        cueStates: {},
        manualHintLevels: {},
        lastProgressAt: 0,
        invalidTheoryAttempts: 0,
        unusedEvidenceIds: [],
      },
      baitExperiments: [],
      enemyFeedback: [],
    },
  };
}
