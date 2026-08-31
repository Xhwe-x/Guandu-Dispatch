import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import { guanduCase } from '../content/guandu';
import type { GameContent, GameState } from '../game/domain';
import { createInitialState } from '../game/initialState';
import { loadGame, type LoadResult } from '../game/persistence';
import {
  deleteSaveSlot,
  listSaveSlots,
  loadSaveSlot,
  migrateLegacyCurrentSave,
  saveToSlot,
  type SaveSlotId,
  type SaveSlotSummary,
} from '../game/saveSlots';
import { gameReducer, type GameAction } from '../game/reducer';
import { GameStorageContext } from './GameStorage';

export interface GameContextValue {
  content: GameContent;
  state: GameState;
  dispatch: Dispatch<GameAction>;
  loadResult: LoadResult;
  activeSaveSlotId: SaveSlotId | null;
  saveSlots: Array<SaveSlotSummary | null>;
  openSaveSlot: (id: SaveSlotId) => boolean;
  createSaveSlot: (id: SaveSlotId) => void;
  removeSaveSlot: (id: SaveSlotId) => void;
  refreshSaveSlots: () => void;
  returnToTitle: () => void;
  startNewCase: () => void;
}

export interface GameProviderProps {
  children: ReactNode;
  content?: GameContent;
  initialState?: GameState;
  storage?: Storage;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  children,
  content = guanduCase,
  initialState,
  storage = window.localStorage,
}: GameProviderProps) {
  const loadResult = useMemo(() => loadGame(storage), [storage]);
  const [state, reducerDispatch] = useReducer(gameReducer, initialState ?? createInitialState());
  const [activeSaveSlotId, setActiveSaveSlotId] = useState<SaveSlotId | null>(null);
  const activeSaveSlotRef = useRef<SaveSlotId | null>(null);
  const [saveSlots, setSaveSlots] = useState<Array<SaveSlotSummary | null>>(() => {
    migrateLegacyCurrentSave(storage);
    return listSaveSlots(storage);
  });
  const shouldPersist = useRef(false);

  const refreshSaveSlots = useCallback(() => {
    setSaveSlots(listSaveSlots(storage));
  }, [storage]);

  const dispatch: Dispatch<GameAction> = useCallback((action) => {
    if (activeSaveSlotRef.current !== null) shouldPersist.current = true;
    reducerDispatch(action);
  }, []);

  useEffect(() => {
    if (!activeSaveSlotId || !shouldPersist.current) return;
    shouldPersist.current = false;
    saveToSlot(storage, activeSaveSlotId, state);
    refreshSaveSlots();
  }, [activeSaveSlotId, refreshSaveSlots, state, storage]);

  const openSaveSlot = useCallback((id: SaveSlotId) => {
    const slot = loadSaveSlot(storage, id);
    if (!slot) return false;
    activeSaveSlotRef.current = id;
    setActiveSaveSlotId(id);
    shouldPersist.current = false;
    reducerDispatch({ type: 'RESTORE_STATE', state: slot.state });
    return true;
  }, [storage]);

  const createSaveSlot = useCallback((id: SaveSlotId) => {
    const fresh = createInitialState();
    saveToSlot(storage, id, fresh);
    activeSaveSlotRef.current = id;
    setActiveSaveSlotId(id);
    shouldPersist.current = false;
    reducerDispatch({ type: 'RESTORE_STATE', state: fresh });
    refreshSaveSlots();
  }, [refreshSaveSlots, storage]);

  const removeSaveSlot = useCallback((id: SaveSlotId) => {
    deleteSaveSlot(storage, id);
    if (activeSaveSlotRef.current === id) { activeSaveSlotRef.current = null; setActiveSaveSlotId(null); }
    refreshSaveSlots();
  }, [activeSaveSlotId, refreshSaveSlots, storage]);

  const returnToTitle = useCallback(() => {
    const slotId = activeSaveSlotRef.current;
    if (slotId) {
      saveToSlot(storage, slotId, state);
      refreshSaveSlots();
    }
    activeSaveSlotRef.current = null;
    setActiveSaveSlotId(null);
    shouldPersist.current = false;
    reducerDispatch({ type: 'RESTORE_STATE', state: createInitialState() });
  }, [refreshSaveSlots, state, storage]);

  // 重新开案必须先脱离当前存档槽，否则自动保存会把空白初始态写回已完成的案卷。
  const startNewCase = useCallback(() => {
    activeSaveSlotRef.current = null;
    setActiveSaveSlotId(null);
    shouldPersist.current = false;
    reducerDispatch({ type: 'RESTORE_STATE', state: createInitialState() });
    refreshSaveSlots();
  }, [refreshSaveSlots]);

  const value = useMemo(
    () => ({
      content,
      state,
      dispatch,
      loadResult,
      activeSaveSlotId,
      saveSlots,
      openSaveSlot,
      createSaveSlot,
      removeSaveSlot,
      refreshSaveSlots,
      returnToTitle,
      startNewCase,
    }),
    [
      content,
      state,
      dispatch,
      loadResult,
      activeSaveSlotId,
      saveSlots,
      openSaveSlot,
      createSaveSlot,
      removeSaveSlot,
      refreshSaveSlots,
      returnToTitle,
      startNewCase,
    ],
  );

  return (
    <GameStorageContext.Provider value={storage}>
      <GameContext.Provider value={value}>{children}</GameContext.Provider>
    </GameStorageContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components -- provider consumers share this public hook.
export function useGame(): GameContextValue {
  const game = useContext(GameContext);
  if (game === null) throw new Error('useGame must be used within GameProvider');
  return game;
}
