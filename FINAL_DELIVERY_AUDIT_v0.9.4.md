# FINAL DELIVERY AUDIT v0.9.4

## Scope
This pass applies the user's 1–7 UI refinement notes to the existing `app/src/game/` and `app/src/content/`-adjacent front-end implementation already present in the package, focusing on:
- title typography spacing,
- opening-flow back navigation and CG swapping,
- character/text alignment,
- portrait framing,
- higher-contrast controls,
- safer rounded control wrapping,
- stronger paper-card action styling.

## Files touched
- `app/src/features/scenes/OpeningFlowScene.tsx`
- `app/src/features/scenes/GameShell.tsx`
- `app/src/features/scenes/TitleScene.tsx`
- `app/src/features/scenes/NetworkInvestigationScene.tsx`
- `app/src/ui/game/DialoguePanel.tsx`
- `app/src/features/scenes/v09.css`
- `app/src/features/scenes/scenes.css`
- `app/src/ui/game/game.css`
- `app/src/ui/primitives/primitives.css`
- `app/package.json`
- `app/scripts/verify-v094-opening-ui.cjs`
- `app/scripts/verify-v094-controls.cjs`

## Acceptance highlights
1. **Title screen**: main title spacing loosened to reduce the cramped look.
2. **Opening flow**: added a visible back button; Enter/Space hint redesigned into separate key pills; each onboarding beat now swaps to a more specific CG/background with fade-in motion.
3. **Dialogue + character panels**: portrait and text columns are more tightly aligned; dialogue panel action button is more visible.
4. **Portraits**: updated framing safety rules to reduce stretched-looking character presentation.
5. **Controls**: buttons now use stronger contrast, rounded corners, taller multi-line-safe sizing, and better disabled-state readability.
6. **Dossier workbench**: action buttons wrap safely, keep text inside control bounds, and use clearer two-tone contrast on paper panels.
7. **Status feedback**: network investigation status now reflects completion state in styling.

## Verification
- `npm run verify:v094`
- `npm run build`

Both are expected to pass in a clean install environment.
