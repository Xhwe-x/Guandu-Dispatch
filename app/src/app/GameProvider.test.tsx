import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../game/initialState';
import { loadSaveSlot, saveToSlot } from '../game/saveSlots';
import { createMemoryStorage } from '../test/renderGame';
import { GameProvider, useGame } from './GameProvider';

function ContextProbe() {
  const { activeSaveSlotId, createSaveSlot, dispatch, openSaveSlot, saveSlots, state } = useGame();
  return <section>
    <p>场景：{state.presentation.sceneId}</p>
    <p>阶段：{state.stage}</p>
    <p>活动存档：{activeSaveSlotId ?? '无'}</p>
    <p>存档数量：{saveSlots.filter(Boolean).length}</p>
    <button onClick={() => createSaveSlot('slot-1')}>新建一档</button>
    <button onClick={() => openSaveSlot('slot-2')}>读取二档</button>
    <button onClick={() => dispatch({ type: 'CONFIRM_ADVANCE' })}>推进</button>
  </section>;
}

describe('GameProvider v0.9.1 launcher persistence', () => {
  it('boots at the title instead of auto-restoring an existing slot', () => {
    const storage = createMemoryStorage();
    const progressed = createInitialState();
    progressed.stage = 'chain';
    progressed.presentation.sceneId = 'network-deduction';
    saveToSlot(storage, 'slot-2', progressed);
    render(<GameProvider storage={storage}><ContextProbe /></GameProvider>);
    expect(screen.getByText('场景：title')).toBeVisible();
    expect(screen.getByText('阶段：documents')).toBeVisible();
    expect(screen.getByText('存档数量：1')).toBeVisible();
  });

  it('restores a slot only after an explicit player action', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const progressed = createInitialState();
    progressed.stage = 'chain';
    progressed.presentation.sceneId = 'network-deduction';
    saveToSlot(storage, 'slot-2', progressed);
    render(<GameProvider storage={storage}><ContextProbe /></GameProvider>);
    await user.click(screen.getByRole('button', { name: '读取二档' }));
    expect(screen.getByText('活动存档：slot-2')).toBeVisible();
    expect(screen.getByText('场景：network-deduction')).toBeVisible();
  });

  it('autosaves state changes into the active slot', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    render(<GameProvider storage={storage}><ContextProbe /></GameProvider>);
    await user.click(screen.getByRole('button', { name: '新建一档' }));
    await user.click(screen.getByRole('button', { name: '推进' }));
    await waitFor(() => expect(loadSaveSlot(storage, 'slot-1')?.state.stage).toBe('secrets'));
  });
});
