import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderGame } from '../../test/renderGame';
import { CaseNavigator } from './CaseNavigator';

describe('v0.9.5 dossier core-loop navigation', () => {
  it('keeps the current objective visible and exposes reverse actions from a person entry', async () => {
    const user = userEvent.setup();
    const onSafeReturn = vi.fn();
    renderGame(<CaseNavigator sceneId="network-investigation" onBack={vi.fn()} onSafeReturn={onSafeReturn} />);

    expect(screen.getByLabelText('当前查案目标')).toBeInTheDocument();
    // 目标信息同时出现在顶栏按钮与目标栏中，两处都要保留。
    expect(screen.getAllByText(/当前目标/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: '案卷' }));
    await user.click(screen.getByRole('button', { name: '赵简' }));

    expect(screen.getByRole('button', { name: /前去询问/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /加入推演/ })).toBeInTheDocument();
  });
});
