import { describe, expect, it } from 'vitest';
import { createMemoryStorage } from '../test/renderGame';
import { createInitialState } from './initialState';
import { migrateLegacyCurrentSave, listSaveSlots, loadSaveSlot, saveToSlot, deleteSaveSlot } from './saveSlots';

function progressedState() {
  const state = createInitialState();
  state.stage = 'chain';
  state.presentation.sceneId = 'network-deduction';
  state.extractedClaimIds = ['claim-zhao-denial', 'claim-zhao-copied-order'];
  return state;
}

describe('v0.9.1 save slots', () => {
  it('stores three independent local slots with readable progress summaries', () => {
    const storage = createMemoryStorage();
    saveToSlot(storage, 'slot-2', progressedState(), '第二次试玩');
    const slot = loadSaveSlot(storage, 'slot-2');
    expect(slot).toMatchObject({ id: 'slot-2', name: '第二次试玩', chapterLabel: '第三幕 · 碎片成军情', sceneLabel: '还原双渠道泄密链' });
    expect(listSaveSlots(storage)[0]).toBeNull();
    expect(listSaveSlots(storage)[1]?.progress).toBeGreaterThan(0);
  });


  it('loads a legacy v5 slot as v6 without dropping the saved scene or claims', () => {
    const storage = createMemoryStorage();
    const current = createInitialState();
    const legacy = {
      ...current,
      version: 5,
      coreLoop: undefined,
      extractedClaimIds: ['claim-zhao-time'],
      presentation: { ...current.presentation, sceneId: 'network-investigation' as const },
    };
    storage.setItem('guandu.save.slot-1', JSON.stringify({
      format: 1,
      id: 'slot-1',
      name: 'v5 旧档',
      createdAt: '2026-08-29T00:00:00.000Z',
      updatedAt: '2026-08-29T00:00:00.000Z',
      state: legacy,
    }));

    const slot = loadSaveSlot(storage, 'slot-1');
    expect(slot?.state.version).toBe(6);
    expect(slot?.state.extractedClaimIds).toEqual(['claim-zhao-time']);
    expect(slot?.state.presentation.sceneId).toBe('network-investigation');
    expect(slot?.state.coreLoop.knowledge['claim-zhao-time']?.status).toBe('observed');
  });

  it('imports the legacy current save only once into slot 1', () => {
    const storage = createMemoryStorage();
    storage.setItem('guandu.current', JSON.stringify(progressedState()));
    migrateLegacyCurrentSave(storage);
    expect(loadSaveSlot(storage, 'slot-1')?.name).toBe('旧版自动存档');
    deleteSaveSlot(storage, 'slot-1');
    migrateLegacyCurrentSave(storage);
    expect(loadSaveSlot(storage, 'slot-1')).toBeNull();
  });
});
