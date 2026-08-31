import { screen } from '@testing-library/react';
import { useGame } from '../app/GameProvider';
import type { GameState } from '../game/domain';

export function GameStateProbe() {
  const { state } = useGame();
  return <output data-testid="game-state">{JSON.stringify(state)}</output>;
}

// oxlint-disable-next-line react/only-export-components -- test probe and its reader form one test helper.
export function readGameState(): GameState {
  return JSON.parse(screen.getByTestId('game-state').textContent ?? 'null') as GameState;
}
