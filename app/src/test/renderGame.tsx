import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GameProvider } from '../app/GameProvider';
import { guanduCase } from '../content/guandu';
import type { GameState } from '../game/domain';
import { createInitialState } from '../game/initialState';

export function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

interface RenderGameOptions {
  storage?: Storage;
}

export function renderGame(
  ui: ReactNode,
  overrides: Partial<GameState> = {},
  { storage = createMemoryStorage() }: RenderGameOptions = {},
) {
  const initialState = { ...createInitialState(), ...overrides };
  return render(
    <GameProvider content={guanduCase} initialState={initialState} storage={storage}>
      {ui}
    </GameProvider>,
  );
}
