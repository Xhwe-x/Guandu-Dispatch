import { migrateGameState } from './contentSchema';
import type { GameState } from './domain';

export type LoadResult =
  | { kind: 'empty' }
  | { kind: 'ok'; state: GameState }
  | { kind: 'recovered'; state: GameState }
  | { kind: 'unsupported'; version: number }
  | { kind: 'corrupt'; message: string };

export type SnapshotLoadResult = Extract<LoadResult, { kind: 'empty' | 'ok' | 'corrupt' }>;

const CURRENT_KEY = 'guandu.current';
const SNAPSHOT_KEY = 'guandu.stage-snapshot';

class UnsupportedSaveVersionError extends Error {
  readonly version: number;

  constructor(version: number) {
    super('unsupported');
    this.version = version;
  }
}

function parseState(raw: string): GameState {
  const parsed: unknown = JSON.parse(raw);

  if (
    typeof parsed === 'object'
    && parsed !== null
    && 'version' in parsed
    && typeof parsed.version === 'number'
    && parsed.version !== 1
    && parsed.version !== 2
    && parsed.version !== 3
    && parsed.version !== 4
    && parsed.version !== 5
    && parsed.version !== 6
  ) {
    throw new UnsupportedSaveVersionError(parsed.version);
  }

  return migrateGameState(parsed);
}

export function saveGame(storage: Storage, state: GameState): void {
  storage.setItem(CURRENT_KEY, JSON.stringify(state));
}

export function saveStageSnapshot(storage: Storage, state: GameState): void {
  storage.setItem(SNAPSHOT_KEY, JSON.stringify(state));
}

export function loadGame(storage: Storage): LoadResult {
  const current = storage.getItem(CURRENT_KEY);
  if (current === null) {
    return { kind: 'empty' };
  }

  try {
    return { kind: 'ok', state: parseState(current) };
  } catch (error) {
    if (error instanceof UnsupportedSaveVersionError) {
      return { kind: 'unsupported', version: error.version };
    }

    const snapshot = storage.getItem(SNAPSHOT_KEY);
    if (snapshot !== null) {
      try {
        return { kind: 'recovered', state: parseState(snapshot) };
      } catch {
        // Recovery must not modify the original current save or snapshot.
      }
    }

    return { kind: 'corrupt', message: '当前存档已损坏，且没有可恢复的有效关卡快照。' };
  }
}

export function restoreStageSnapshot(storage: Storage): SnapshotLoadResult {
  const snapshot = storage.getItem(SNAPSHOT_KEY);
  if (snapshot === null) {
    return { kind: 'empty' };
  }

  try {
    return { kind: 'ok', state: parseState(snapshot) };
  } catch {
    return { kind: 'corrupt', message: '关卡快照已损坏，无法恢复。' };
  }
}
