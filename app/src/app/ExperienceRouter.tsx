import { GameShell } from '../features/scenes/GameShell';

export function ExperienceRouter() {
  // v0.9.1 launcher rule: the application always boots at the title/save flow.
  // A persisted case is only restored after the player explicitly chooses a save slot.
  return <GameShell />;
}
