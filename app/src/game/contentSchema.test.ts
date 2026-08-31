import { describe, expect, it } from 'vitest';
import { minimalContent } from './fixtures';
import { createInitialState } from './initialState';
import {
  GameStateSchema,
  LegacyGameStateV1Schema,
  LegacyGameStateV3Schema,
  LegacyGameStateV4Schema,
  migrateGameState,
  validateGameContent,
  validateGameState,
} from './contentSchema';

describe('validateGameContent', () => {
  it('accepts a complete minimal case', () => {
    expect(validateGameContent(minimalContent).id).toBe('guandu');
  });

  it('rejects a claim whose source document does not exist', () => {
    const broken = structuredClone(minimalContent);
    broken.claims[0].sourceDocumentId = 'missing-document';
    expect(() => validateGameContent(broken)).toThrow(/missing-document/);
  });

  it.each([
    ['document', 'missing-provenance-document'],
    ['investigation', 'missing-provenance-investigation'],
    ['interrogation', 'missing-provenance-interrogation'],
  ] as const)('rejects a %s claim provenance whose source does not exist', (kind, sourceId) => {
    const broken = structuredClone(minimalContent);
    broken.claims[0].provenance = { kind, sourceId };
    expect(() => validateGameContent(broken)).toThrow(new RegExp(sourceId));
  });

  it('rejects document provenance that does not contain the claim', () => {
    const broken = structuredClone(minimalContent);
    broken.claims.find((claim) => claim.id === 'claim-zhao-denial')!.provenance = {
      kind: 'document',
      sourceId: 'doc-du',
    };
    expect(() => validateGameContent(broken)).toThrow(/claim-zhao-denial.*doc-du/);
  });

  it('rejects investigation provenance that does not reveal the claim', () => {
    const broken = structuredClone(minimalContent);
    broken.investigations[0].revealClaimIds = [];
    expect(() => validateGameContent(broken)).toThrow(/claim-zhao-coerced.*investigate-zhao-family/);
  });

  it('rejects interrogation provenance that does not reveal the claim', () => {
    const broken = structuredClone(minimalContent);
    broken.interrogations[0].revealClaimIds = [];
    expect(() => validateGameContent(broken)).toThrow(/claim-zhao-time.*interrogate-zhao-time/);
  });

  it('rejects duplicate stable IDs', () => {
    const broken = structuredClone(minimalContent);
    broken.claims.push({ ...broken.claims[0] });
    expect(() => validateGameContent(broken)).toThrow(/Duplicate claim ID/);
  });

  it('rejects a document that lists an unknown claim', () => {
    const broken = structuredClone(minimalContent);
    broken.documents[0].claimIds.push('missing-document-claim');
    expect(() => validateGameContent(broken)).toThrow(/missing-document-claim/);
  });

  it('rejects a document claim attributed to another document', () => {
    const broken = structuredClone(minimalContent);
    broken.documents[0].claimIds.push('claim-du-route');
    expect(() => validateGameContent(broken)).toThrow(/claim-du-route.*doc-zhao/);
  });

  it('rejects an investigation that reveals an unknown claim', () => {
    const broken = structuredClone(minimalContent);
    broken.investigations[0].revealClaimIds = ['missing-investigation-claim'];
    expect(() => validateGameContent(broken)).toThrow(/missing-investigation-claim/);
  });

  it('rejects an interrogation for an unknown character', () => {
    const broken = structuredClone(minimalContent);
    broken.interrogations[0].characterId = 'missing-interrogation-character';
    expect(() => validateGameContent(broken)).toThrow(/missing-interrogation-character/);
  });

  it('rejects an interrogation statement referencing an unknown claim', () => {
    const broken = structuredClone(minimalContent);
    broken.interrogations[0].statementClaimId = 'missing-statement-claim';
    expect(() => validateGameContent(broken)).toThrow(/missing-statement-claim/);
  });

  it('rejects an interrogation evidence referencing an unknown claim', () => {
    const broken = structuredClone(minimalContent);
    broken.interrogations[0].evidenceClaimId = 'missing-evidence-claim';
    expect(() => validateGameContent(broken)).toThrow(/missing-evidence-claim/);
  });

  it('rejects an interrogation reveal referencing an unknown claim', () => {
    const broken = structuredClone(minimalContent);
    broken.interrogations[0].revealClaimIds = ['missing-interrogation-reveal'];
    expect(() => validateGameContent(broken)).toThrow(/missing-interrogation-reveal/);
  });

  it('rejects bait requiring an unknown claim', () => {
    const broken = structuredClone(minimalContent);
    broken.baits[0].requiredClaimIds = ['missing-bait-claim'];
    expect(() => validateGameContent(broken)).toThrow(/missing-bait-claim/);
  });

  it('rejects duplicate relationship permission tuples', () => {
    const broken = structuredClone(minimalContent);
    broken.relationshipPermissions = [
      { fromId: 'claim-zhao-time', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
    ];
    broken.relationshipPermissions.push({ ...broken.relationshipPermissions[0] });
    expect(() => validateGameContent(broken)).toThrow(/Duplicate relationship permission/);
  });

  it('rejects a relationship permission with a missing source entity', () => {
    const broken = structuredClone(minimalContent);
    broken.relationshipPermissions = [
      { fromId: 'missing-permission-source', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
    ];
    expect(() => validateGameContent(broken)).toThrow(/missing-permission-source/);
  });

  it('rejects a relationship permission with a missing target entity', () => {
    const broken = structuredClone(minimalContent);
    broken.relationshipPermissions = [
      { fromId: 'claim-zhao-time', toId: 'missing-permission-target', kind: 'accessedBy', slot: 'actor' },
    ];
    expect(() => validateGameContent(broken)).toThrow(/missing-permission-target/);
  });
});

describe('validateGameState', () => {
  it('accepts every persisted state field', () => {
    const state = validateGameState({
      ...createInitialState(),
      stage: 'ending',
      investigationPoints: 2,
      readDocumentIds: ['doc-zhao'],
      extractedClaimIds: ['claim-zhao-time'],
      relationships: [{ fromId: 'claim-zhao-time', toId: 'zhao', kind: 'supports', slot: 'actor' }],
      completedInvestigationIds: ['investigate-zhao-family'],
      personStates: { zhao: 'guarded' },
      selectedBaitIds: ['bait-zhao-yin'],
      realPlan: { route: '北桥', time: '寅时' },
      baitBand: 'bothCore',
      enemyReport: { route: '北桥', time: '寅时' },
      report: {
        leakedInfo: ['行军路线'],
        sourceCharacterIds: ['zhao', 'du'],
        integratorId: 'zhao',
        transmissionMethod: '价格暗号',
        evidenceClaimIds: ['claim-price-cipher'],
        handling: 'arrest',
      },
      actionOutcome: 'networkClosed',
      truthOwner: 'canghe',
      hintUsage: { timeSource: 1 },
    });
    expect(state.truthOwner).toBe('canghe');
  });

  it('accepts exactly the supported tutorial steps', () => {
    const steps = [
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
    ] as const;

    for (const step of steps) {
      const state = validateGameState({
        ...createInitialState(),
        tutorial: { ...createInitialState().tutorial, step, startedAtLeastOnce: step !== 'notStarted' },
      });

      expect(state.tutorial.step).toBe(step);
    }
  });

  it('accepts current and legacy scene ids so old saves can be parsed before v0.9 normalization', () => {
    const scenes = [
      'title', 'story', 'camp', 'document', 'investigation', 'dialogue', 'interrogation', 'deduction',
      'case-summary', 'audience', 'network-investigation', 'network-deduction', 'bait', 'enemy-report', 'final-report', 'ending',
    ] as const;

    for (const sceneId of scenes) {
      expect(() => validateGameState({
        ...createInitialState(),
        presentation: { ...createInitialState().presentation, sceneId },
      })).not.toThrow();
    }
  });

  it('rejects an unsupported tutorial step', () => {
    expect(() => validateGameState({
      ...createInitialState(),
      tutorial: { ...createInitialState().tutorial, step: 'unknown', startedAtLeastOnce: false },
    })).toThrow();
  });

  it('rejects a non-integer investigation point value', () => {
    expect(() => validateGameState({
      ...createInitialState(),
      investigationPoints: 1.5,
    })).toThrow();
  });
});

describe('migrateGameState', () => {
  it('migrates a valid v1 save and marks onboarding as skipped', () => {
    const legacy = {
      version: 1,
      stage: 'chain',
      investigationPoints: 1,
      readDocumentIds: ['report-ambush'],
      extractedClaimIds: ['claim-shuoyuan-received'],
      relationships: [],
      completedInvestigationIds: [],
      personStates: { zhao: 'guarded' },
      selectedBaitIds: [],
      hintUsage: {},
    };

    expect(migrateGameState(legacy)).toMatchObject({
      ...legacy,
      version: 6,
      tutorial: { step: 'skipped', startedAtLeastOnce: true },
      presentation: { sceneId: 'title', storySceneId: 'prologue-background', beatIndex: 0 },
    });
  });

  it('migrates v2 input into v5 presentation state', () => {
    const current = {
      version: 2,
      tutorial: { step: 'introIncident', startedAtLeastOnce: true },
      stage: 'documents',
      investigationPoints: 3,
      readDocumentIds: [],
      extractedClaimIds: [],
      relationships: [],
      completedInvestigationIds: [],
      personStates: {},
      selectedBaitIds: [],
      hintUsage: {},
    };

    expect(migrateGameState(current)).toMatchObject({
      ...current,
      version: 6,
      presentation: { sceneId: 'title', storySceneId: 'prologue-background', beatIndex: 0 },
    });
  });


  it('migrates a v3 dialogue save into the v0.9 Zhao opening and clears legacy history', () => {
    const base = {
      version: 3,
      tutorial: { step: 'investigateHandwriting', startedAtLeastOnce: true, enabled: true, seenLessonIds: [] },
      audio: { enabled: true, voiceEnabled: true, volume: 0.72 },
      presentation: {
        sceneId: 'dialogue', sceneHistory: ['document'], storySceneId: 'camp-brief', beatIndex: 99,
        documentFindingIds: ['ambush-location', 'ambush-time'], handwritingFindingIds: [],
        interrogation: { evidenceClaimId: 'claim-shuoyuan-received', tone: 'calm', attempts: 0 },
        deduction: {}, networkTheory: {}, reportDraft: { leakedInfo: [], sourceCharacterIds: [], evidenceClaimIds: [], handling: 'differentiate' },
        audience: { visitId: 'first-report', shotIndex: 0, attitude: 'observing', choiceIds: [] },
      },
      stage: 'documents', investigationPoints: 3, readDocumentIds: ['report-ambush'], extractedClaimIds: ['claim-shuoyuan-received'],
      relationships: [], completedInvestigationIds: [], personStates: { zhao: 'cooperative' }, selectedBaitIds: [], hintUsage: {},
    } as const;
    expect(() => LegacyGameStateV3Schema.parse(base)).not.toThrow();
    const migrated = migrateGameState(base);
    expect(migrated.version).toBe(6);
    expect(migrated.presentation.sceneId).toBe('opening');
    expect(migrated.presentation.storySceneId).toBe('zhao-first-dialogue');
    expect(migrated.presentation.sceneHistory).toEqual([]);
  });
  it('migrates a v4 legacy dialogue save to the progressive v0.9 opening without old history', () => {
    const current = migrateGameState({
      version: 1, stage: 'documents', investigationPoints: 3, readDocumentIds: [], extractedClaimIds: [],
      relationships: [], completedInvestigationIds: [], personStates: {}, selectedBaitIds: [], hintUsage: {},
    });
    const legacy = {
      ...current,
      version: 4 as const,
      presentation: {
        ...current.presentation,
        sceneId: 'dialogue' as const,
        storySceneId: 'zhao-introduction',
        sceneHistory: [{ sceneId: 'document' as const, storySceneId: 'intro-cg', beatIndex: 0 }],
      },
    };
    const migrated = migrateGameState(legacy);
    expect(migrated.version).toBe(6);
    expect(migrated.presentation).toMatchObject({ sceneId: 'opening', storySceneId: 'zhao-first-dialogue', beatIndex: 0, sceneHistory: [] });
  });

  it('rejects an unknown state version', () => {
    expect(() => migrateGameState({ version: 99 })).toThrow(/Unsupported game state version: 99/);
  });

  it('exposes v1/v4 legacy schemas and the v6 current schema', () => {
    expect(() => LegacyGameStateV1Schema.parse({
      version: 1,
      stage: 'documents',
      investigationPoints: 3,
      readDocumentIds: [],
      extractedClaimIds: [],
      relationships: [],
      completedInvestigationIds: [],
      personStates: {},
      selectedBaitIds: [],
      hintUsage: {},
    })).not.toThrow();
    expect(() => LegacyGameStateV4Schema.parse({
      ...migrateGameState({
        version: 1, stage: 'documents', investigationPoints: 3, readDocumentIds: [], extractedClaimIds: [],
        relationships: [], completedInvestigationIds: [], personStates: {}, selectedBaitIds: [], hintUsage: {},
      }),
      version: 4,
    })).not.toThrow();
    expect(GameStateSchema.shape.version.value).toBe(6);
  });
});
