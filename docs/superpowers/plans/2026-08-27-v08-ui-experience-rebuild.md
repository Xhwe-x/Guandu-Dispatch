# Guandu Dispatch v0.8 UI & Experience Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade v0.7 into a resilient, character-driven v0.8 with game-native controls, dialogue cards, audio feedback, recovery navigation, and integrated CG presentation.

**Architecture:** Keep the existing React/domain-rule architecture, but add a presentation layer with reusable controls and character cards. Upgrade persistence to state version 4 with full presentation snapshots and self-healing migration; avoid rewriting core investigation/bait/report rules.

**Tech Stack:** React 19, TypeScript, Zod, CSS, Web Audio, static PNG/SVG assets.

**Spec:** `官渡密报_v0.8_全局UI交互与体验重构方案.md`

## Global Constraints

- 三国古代写实国风 + 现代可读性。
- No developer-facing fallback text in normal play.
- Every non-title scene has a safe exit.
- Important dialogue always identifies and visually presents its speaker.
- Keep existing first-case truth/rules compatible.

---

### Task 1: Regression contract and unfinished-work audit
**Files:** Create `app/scripts/verify-v08-structure.cjs`, `UNFINISHED_WORK_REPORT_v0.7.md`; modify `app/package.json`.
- [ ] Add failing assertions for v4 state, snapshot history, recovery scene, dialogue-card files, v0.8 UI primitives, assets, docs.
- [ ] Run and verify failure on v0.7.
- [ ] Write the unfinished-work report from real source status.

### Task 2: Presentation state v4 and self-healing
**Files:** Modify `app/src/game/domain.ts`, `contentSchema.ts`, `initialState.ts`, `reducer.ts`, `persistence.ts`; add `app/src/game/presentationRecovery.ts` and tests/verification.
- [ ] Define `PresentationSnapshot` and v4 state.
- [ ] Add pure scene/story validation and recovery helpers.
- [ ] Migrate v3 to v4 and repair mismatched dialogue/story positions.
- [ ] Upgrade SET_SCENE/GO_BACK to snapshot navigation.

### Task 3: UI control system and recovery screen
**Files:** Create `app/src/features/ui/GameButton.tsx`, `GameIconButton.tsx`, `ChoiceStrip.tsx`, `SceneRecovery.tsx`, `ui.css`; modify GameShell/CaseNavigator.
- [ ] Replace normal fallback with recovery UX.
- [ ] Introduce command/secondary/tool/danger/locked variants.
- [ ] Restyle global navigation and journal tabs.

### Task 4: Character dialogue presentation
**Files:** Create `dialogueCharacters.ts`, `DialogueCharacterCard.tsx`; modify `DialogueScene.tsx`, `DialogueBox.tsx`, `StoryScene.tsx`, content story data.
- [ ] Map all speakers to character presentation metadata.
- [ ] Render one character card per spoken beat and correct narration treatment.
- [ ] Drive entry SFX and key voice from beat metadata.

### Task 5: Character/mission integration
**Files:** Modify CaseNavigator, taskLinks, NetworkInvestigationScene, InterrogationScene.
- [ ] Expand journal into people/intel/evidence/task/tutorial/settings tabs.
- [ ] Show actionable person cards with related documents and evidence.
- [ ] Use game-native interrogation strategy signs and evidence slots.

### Task 6: CG and motion pass
**Files:** Create/update `app/public/assets/cg/*`, `app/src/features/scenes/cg.css`; modify StoryScene, AudienceScene, InterrogationScene, InvestigationScene.
- [ ] Integrate generated concept art crops/reference-derived scene plates plus vector overlays.
- [ ] Add 2.5D pan, candle/fire/smoke overlays, reduced-motion fallback.

### Task 7: Audio system pass
**Files:** Modify `audioCues.ts`, `GameAudio.tsx`, UI components/scenes.
- [ ] Add paper, tab, character-enter, evidence, deduction, danger, back cues.
- [ ] Add semantic `data-audio-cue` support so button type controls sound.
- [ ] Keep key short-voice routing explicit.

### Task 8: Documentation/version/verification
**Files:** Modify README/HANDOFF/product design/package files; add `verify-v08.cjs` if runtime dependencies available.
- [ ] Update product/technical draft to v0.8 implementation reality.
- [ ] Update package version to 0.8.1 reviewed delivery.
- [ ] Run structure verifier, syntax transpile, TypeScript if dependencies resolve, and ZIP integrity.


## Execution review (v0.8.1)

- Tasks 1–5 and 7 are implemented in the playable route.
- Task 6 is **partially complete**: four CG plates are integrated, but full independent 2.5D layer separation is not complete.
- Task 8 documentation, versioning, TypeScript and custom verification are complete; Vitest / Vite production build / Oxlint remain blocked in this container by unavailable Linux native bindings and registry DNS.
- Final facts and user-support needs are tracked in `FINAL_DELIVERY_AUDIT_v0.8.md`.
