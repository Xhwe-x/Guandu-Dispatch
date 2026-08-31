import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GameStateProbe, readGameState } from '../../test/GameStateProbe';
import { renderGame } from '../../test/renderGame';
import { GameShell } from './GameShell';

async function advanceOpeningToFirstEvidence(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '开始新案' }));
  await user.click(screen.getAllByRole('button', { name: '新建存档' })[0]);

  // 序章五段共 13 个节拍，全部支持 Enter 推进；进入取证场景后停止。
  for (let i = 0; i < 16; i += 1) {
    if (screen.queryByRole('button', { name: '重置选择' })) return;
    await user.keyboard('{Enter}');
  }
}

describe('v0.9.5 first-fold scene chain', () => {
  it('plays guided evidence, deduction, and evidence-driven interrogation to the first-fold summary', async () => {
    const user = userEvent.setup();
    renderGame(
      <>
        <GameShell />
        <GameStateProbe />
      </>,
    );

    expect(screen.getByRole('heading', { name: '官渡密报' })).toBeVisible();
    await advanceOpeningToFirstEvidence(user);

    expect(screen.getByRole('button', { name: '比较这两条信息' })).toBeDisabled();
    const selects = screen.getAllByRole('button', { name: '选择这条' });
    await user.click(selects[0]);
    await user.click(selects[1]);
    await user.click(screen.getByRole('button', { name: '比较这两条信息' }));

    expect(screen.getByRole('heading', { name: '这两条信息是什么关系？' })).toBeVisible();
    await user.click(screen.getByRole('radio', { name: /存在矛盾/ }));
    await user.click(screen.getByRole('button', { name: '提交推断' }));
    await user.click(screen.getByRole('button', { name: '再次询问赵简' }));

    // 问法只影响气氛；证据决定是否突破。错误证据不应锁死问询。
    await user.click(screen.getByRole('radio', { name: /严词质问/ }));
    await user.click(screen.getByRole('button', { name: /赵简口供/ }));
    await user.click(screen.getByRole('button', { name: '出示所选证据' }));
    expect(await screen.findByText(/它只能说明我不知道/)).toBeVisible();
    expect(readGameState().extractedClaimIds).not.toContain('claim-zhao-time');
    expect(readGameState().personStates.zhao).toBe('cooperative');

    // 出示关键证据后立即形成突破，且不受问法语气影响。
    await user.click(screen.getByRole('button', { name: /集合誊本/ }));
    await user.click(screen.getByRole('button', { name: '出示所选证据' }));
    expect((await screen.findAllByText(/时辰，也是我泄出去的/)).length).toBeGreaterThan(0);
    expect(readGameState().coreLoop.knowledge['claim-zhao-time']?.status).toBe('supported');
    expect(readGameState().presentation.interrogation.attempts).toBe(2);

    await user.click(screen.getByRole('button', { name: '完成本轮问询' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '第一条矛盾成立' })).toBeVisible();
    });
    expect(screen.getByText(/从“谁说谎”转向“每个人究竟知道什么”/)).toBeVisible();
  });
});
