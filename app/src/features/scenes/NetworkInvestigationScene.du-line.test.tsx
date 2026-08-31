import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderGame } from '../../test/renderGame';
import { NetworkInvestigationScene } from './NetworkInvestigationScene';

// 回归：杜衡线曾经只有“以价格暗号对质”一个入口，而该突破要求草料知识先达到
// supported，UI 却没有任何按钮能完成这一步，玩家会在第二幕永久卡死。
describe('second-act Du Heng route-inference line', () => {
  it('resolves the route through the two-step confrontation without a dead end', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderGame(<NetworkInvestigationScene onComplete={onComplete} />, {
      extractedClaimIds: ['claim-lu-no-time', 'claim-lu-relief-motive', 'claim-zheng-no-route'],
    });

    await user.click(screen.getByRole('button', { name: /叁 · 杜衡/ }));
    await user.click(screen.getByRole('button', { name: /开始核对/ }));
    await user.click(screen.getByRole('button', { name: '查出入簿与商路图' }));
    await user.click(screen.getByRole('button', { name: /深查采购与价格 · 耗1令/ }));

    const fodderConfront = screen.getByRole('button', { name: /以草料数量对质/ });
    expect(fodderConfront).toBeEnabled();
    await user.click(fodderConfront);
    expect(screen.getByRole('button', { name: /以草料数量对质/ })).toBeDisabled();

    const priceConfront = screen.getByRole('button', { name: /以价格暗号对质杜衡/ });
    expect(priceConfront).toBeEnabled();
    await user.click(priceConfront);

    const toTheory = screen.getByRole('button', { name: /把四匣移上推演板/ });
    expect(toTheory).toBeEnabled();
    await user.click(toTheory);
    expect(onComplete).toHaveBeenCalledWith('network-deduction');
  });

  it('locks the price confrontation behind the fodder basis and says why', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderGame(<NetworkInvestigationScene onComplete={onComplete} />, {
      extractedClaimIds: [
        'claim-lu-no-time', 'claim-lu-relief-motive', 'claim-zheng-no-route',
        'claim-du-denial', 'claim-south-ford-open', 'claim-west-ridge-light',
        'claim-du-fodder-pattern', 'claim-price-cipher',
      ],
    });

    await user.click(screen.getByRole('button', { name: /叁 · 杜衡/ }));

    // 草料知识仍停在 observed：价格暗号按钮禁用，并且把原因直接写给玩家。
    const priceConfront = screen.getByRole('button', { name: /以价格暗号对质杜衡/ });
    expect(priceConfront).toBeDisabled();
    expect(screen.getByText(/先用草料数量钉死他的推算基础/)).toBeVisible();
    expect(screen.getByRole('button', { name: /把四匣移上推演板/ })).toBeDisabled();
    expect(onComplete).not.toHaveBeenCalled();

    // 补上草料对质这一步之后，同一条价格暗号才能形成突破并解锁推演板。
    await user.click(screen.getByRole('button', { name: /以草料数量对质/ }));
    const unlockedPrice = screen.getByRole('button', { name: /以价格暗号对质杜衡/ });
    expect(unlockedPrice).toBeEnabled();
    await user.click(unlockedPrice);
    expect(screen.getByRole('button', { name: /把四匣移上推演板/ })).toBeEnabled();
  });
});
