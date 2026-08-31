import { ErrorBoundary } from './ErrorBoundary';
import { ExperienceRouter } from './ExperienceRouter';
import { GameProvider } from './GameProvider';

export function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <ExperienceRouter />
      </GameProvider>
    </ErrorBoundary>
  );
}
