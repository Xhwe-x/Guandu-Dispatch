import type { TutorialLesson } from './tutorialLessons';
import { GameButton } from '../ui/GameButton';

interface TutorialOverlayProps {
  lesson: TutorialLesson;
  onClose: () => void;
  onDisable: () => void;
}

export function TutorialOverlay({ lesson, onClose, onDisable }: TutorialOverlayProps) {
  return (
    <aside className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-overlay-title">
      <div className="tutorial-overlay__shade" aria-hidden="true" />
      <section className="tutorial-overlay__card">
        <p className="scene-kicker">{lesson.eyebrow}</p>
        <h2 id="tutorial-overlay-title">{lesson.title}</h2>
        <p>{lesson.body}</p>
        <ol>
          {lesson.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div className="tutorial-overlay__actions">
          <GameButton variant="quiet" audioCue="ui-back" onClick={onDisable}>关闭后续引导</GameButton>
          <GameButton variant="command" audioCue="ui-confirm" onClick={onClose} mark="›">明白，继续查案</GameButton>
        </div>
      </section>
    </aside>
  );
}
