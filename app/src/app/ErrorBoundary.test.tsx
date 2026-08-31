import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function CrashingDesk(): never {
  throw new Error('desk crashed');
}

describe('ErrorBoundary', () => {
  it('reports a program error without presenting it as a failed investigation', () => {
    render(
      <ErrorBoundary>
        <CrashingDesk />
      </ErrorBoundary>,
      { onCaughtError: () => undefined },
    );

    expect(screen.getByRole('alert')).toHaveTextContent('界面暂时无法载入');
    expect(screen.getByText('这是程序错误，不代表调查失败。')).toBeVisible();
    expect(screen.getByText('故障详情：desk crashed')).toBeVisible();
    expect(screen.queryByText(/Game Over|行动失败/)).not.toBeInTheDocument();
  });
});
