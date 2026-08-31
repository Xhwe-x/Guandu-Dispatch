import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  it('opens on the v0.9.5 title without resuming any save automatically', () => {
    localStorage.clear();
    render(<App />);

    expect(screen.getByRole('heading', { name: '官渡密报' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '开始新案' })).toBeEnabled();
    expect(screen.getByText(/GUANDU DISPATCH · v0\.9\.5/)).toBeInTheDocument();
    // 启动不等于读档：不得出现任何残留的旧情报匣或自动恢复提示。
    expect(screen.queryByRole('region', { name: '情报匣' })).not.toBeInTheDocument();
    expect(screen.queryByText(/剩余.*(?:分钟|秒)/)).not.toBeInTheDocument();
  });

  it('routes a new case through the save screen into the v0.9 opening', async () => {
    const user = userEvent.setup();
    localStorage.clear();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '开始新案' }));
    expect(screen.getByRole('heading', { name: '选择存档' })).toBeVisible();

    await user.click(screen.getAllByRole('button', { name: '新建存档' })[0]);

    expect(document.querySelector('[data-current-scene="opening"]')).not.toBeNull();
    expect(screen.getByText(/建安五年。曹袁相持于官渡/)).toBeVisible();
  });
});
