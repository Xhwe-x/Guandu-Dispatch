import { describe, expect, it } from 'vitest';
import { tutorialLessons, tutorialLessonForScene } from './tutorialLessons';

describe('v0.8.2 tutorial manual', () => {
  it('contains navigation, Cao Cao briefing and final report guidance without forcing them as modal lessons', () => {
    const ids = tutorialLessons.map((lesson) => lesson.id);
    expect(ids).toEqual(expect.arrayContaining([
      'lesson-navigation',
      'lesson-audience',
      'lesson-final-report',
    ]));
    expect(tutorialLessonForScene('audience')).toBeUndefined();
    expect(tutorialLessonForScene('final-report')).toBeUndefined();
  });
});
