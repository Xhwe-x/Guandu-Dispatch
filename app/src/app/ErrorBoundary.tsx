import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  render() {
    if (this.state.error !== null) {
      return (
        <main className="app-error" role="alert">
          <h1>界面暂时无法载入</h1>
          <p>这是程序错误，不代表调查失败。</p>
          <p>故障详情：{this.state.error.message}</p>
        </main>
      );
    }

    return this.props.children;
  }
}
