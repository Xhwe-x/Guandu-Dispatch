import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderGame } from '../../test/renderGame';
import { AudienceScene } from './AudienceScene';

describe('Cao Cao audience scene', () => {
  it('runs a two-round first briefing and ends with the counterintel bait order', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderGame(<AudienceScene onComplete={onComplete} />, {
      extractedClaimIds: ['claim-zhao-copied-order', 'claim-zhao-time'],
      presentation: {
        sceneId: 'audience', sceneHistory: [{ sceneId: 'case-summary', storySceneId: 'zhao-introduction', beatIndex: 0 }], storySceneId: 'zhao-introduction', beatIndex: 0,
        documentFindingIds: [], handwritingFindingIds: [], interrogation: { evidenceClaimId: 'claim-zhao-copied-order', tone: 'calm', attempts: 1 },
        deduction: {}, networkTheory: {}, reportDraft: { leakedInfo: [], sourceCharacterIds: [], evidenceClaimIds: [], handling: 'differentiate' },
        audience: { visitId: 'first-report', shotIndex: 0, attitude: 'observing', choiceIds: [] },
      },
    });

    await user.click(screen.getByRole('button', { name: '入帐觐见' }));
    await user.click(screen.getByRole('button', { name: '坐前回话' }));
    await user.click(screen.getByRole('button', { name: '陈明所查' }));

    // 第一轮：选择稳妥汇报，曹操要求把链条说清。
    await user.click(screen.getByRole('button', { name: /臣已能解释伏击如何发生/ }));
    expect(screen.getByText(/能分清推断和铁证/)).toBeVisible();

    await user.click(screen.getByRole('button', { name: '呈上证据' }));
    await user.click(screen.getByRole('button', { name: '组织第二轮汇报' }));

    // 第二轮：分责汇报，曹操认可按渠道分别投饵。
    await user.click(screen.getByRole('button', { name: /赵简受胁泄时辰/ }));
    expect(screen.getByText(/责任分开记/)).toBeVisible();

    await user.click(screen.getByRole('button', { name: '请主公下令' }));
    expect(screen.getByText(/按渠道分别投饵/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: '臣领命' }));

    expect(onComplete).toHaveBeenCalledWith('bait');
  });
});
