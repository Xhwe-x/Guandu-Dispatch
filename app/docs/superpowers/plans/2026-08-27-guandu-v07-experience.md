# Guandu Dispatch v0.7 Experience Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade v0.6 with a reusable Cao Cao audience sequence, embedded tutorial, dead-end prevention/navigation, audio/voice cues, and stronger character-task-evidence binding while preserving the complete playable case flow.

**Architecture:** Keep the existing scene/state/rules architecture. Add a small presentation layer for global case navigation, tutorial lessons and audio; add `audience` as a reusable scene family driven by content data; use derived objectives rather than branching the core rules. No external runtime dependencies are required.

**Tech Stack:** React 19, TypeScript 6, CSS, Web Audio API, SpeechSynthesis API, existing reducer/persistence/content model.

**Spec:** `../../官渡密报_产品与技术设计草案_v0.3.md`

## Global Constraints

- Visual direction: Three Kingdoms historical atmosphere + modern game readability.
- Cao Cao persona: dignified + shrewd + restrained.
- Audience interaction: between light interactive briefing and strategic interactive briefing.
- Cao Cao is a recurring stage evaluator, not a one-off cutscene.
- Every non-title gameplay scene must provide an escape route or clear next action.
- Tutorial guidance must be embedded in real actions and remain dismissible/replayable.
- Audio must degrade gracefully when browser audio/TTS is unavailable.
- Existing v3 save files must remain loadable.

---

### Task 1: Global navigation and anti-dead-end safety
**Files:** create `src/features/scenes/CaseNavigator.tsx`, `src/features/scenes/caseObjectives.ts`; modify `GameShell.tsx`, `domain.ts`, `initialState.ts`, `reducer.ts`, `contentSchema.ts`, `scenes.css`.
- [ ] Add regression assertions for history navigation and current-objective derivation.
- [ ] Add scene history + return action without rewinding evidence/progress.
- [ ] Add global Return / Case File / Current Task / Hint controls and modal case journal.
- [ ] Ensure every gameplay scene exposes at least one path out.

### Task 2: Embedded tutorial
**Files:** create `TutorialOverlay.tsx`, `tutorialLessons.ts`; modify scene components and tutorial state.
- [ ] Test lesson derivation for document, handwriting, interrogation, deduction and network stages.
- [ ] Show one-time contextual tutorial cards with skip/replay support.
- [ ] Add a Tutorial section in the case journal with detailed core-loop guidance.

### Task 3: Cao Cao audience system
**Files:** create `AudienceScene.tsx`, `audiences.ts`; modify `scenes.ts`, `GameShell.tsx`, `CharacterPortrait.tsx`, `domain.ts`, `reducer.ts`, `contentSchema.ts`, `scenes.css`.
- [ ] Add render/choice tests for the audience scene.
- [ ] Implement eight-shot audience presentation with two decision rounds and attitude feedback.
- [ ] Connect first audience after first-fold summary and a final audience before report/ending.
- [ ] Persist Cao Cao attitude and chosen briefing styles.

### Task 4: Audio / short voice cue layer
**Files:** create `src/features/audio/GameAudio.tsx`, `src/features/audio/audioCues.ts`; modify buttons/dialogue/audience/navigation.
- [ ] Test cue mapping and audio setting reducer behavior.
- [ ] Implement Web Audio UI cues and optional SpeechSynthesis key-line voice cues.
- [ ] Add mute/voice controls to the case journal and audience UI.

### Task 5: Character-evidence-task binding
**Files:** create `src/content/guandu/taskLinks.ts`; modify network investigation, case journal, final report.
- [ ] Test every core character has linked documents, claims and objectives.
- [ ] Surface character dossier cards showing person → documents → suspicions → next tasks.
- [ ] Make stage objectives name the relevant character and evidence source.

### Task 6: Documentation, verification and packaging
**Files:** modify project/root README, HANDOFF, product/technical design draft, verification scripts, package version.
- [ ] Synchronize design draft with v0.7 tutorial, audience, navigation, sound and task-link systems.
- [ ] Run TypeScript compile and v0.7 verification/playthrough.
- [ ] Run build/test/lint if platform-native dependencies are available; otherwise document the exact environment blocker.
- [ ] Remove `node_modules`/build caches and produce `Guandu-Dispatch-v0.7.zip`.
