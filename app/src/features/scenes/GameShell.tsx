import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useGame } from '../../app/GameProvider';
import { guanduStoryScenes } from '../../content/guandu/story';
import type { GameSceneId } from '../../game/scenes';
import type { StorySceneData } from '../../game/storyTypes';
import { BaitScene } from './BaitScene';
import { GameAudioProvider } from '../audio/GameAudio';
import { AudienceScene } from './AudienceScene';
import { CaseNavigator } from './CaseNavigator';
import { CampScene } from './CampScene';
import { DeductionBoardScene } from './DeductionBoardScene';
import { EndingScene } from './EndingScene';
import { EnemyReportScene } from './EnemyReportScene';
import { FinalReportScene } from './FinalReportScene';
import { DialogueScene } from './DialogueScene';
import { DocumentScene } from './DocumentScene';
import { InterrogationScene } from './InterrogationScene';
import { InvestigationScene } from './InvestigationScene';
import { NetworkDeductionScene } from './NetworkDeductionScene';
import { NetworkInvestigationScene } from './NetworkInvestigationScene';
import { StoryScene } from './StoryScene';
import { OpeningFlowScene } from './OpeningFlowScene';
import { FirstEvidenceScene } from './FirstEvidenceScene';
import { FirstDeductionScene } from './FirstDeductionScene';
import { TitleScene } from './TitleScene';
import { GameButton } from '../ui/GameButton';
import { SceneRecovery } from '../ui/SceneRecovery';
import { CardContent, CardFooter, CardHeader, GameCard } from '../../ui/primitives/GameCard';
import { AnimatedList } from '../../ui/motion/AnimatedList';
import { isStorySceneCompatible } from '../../game/presentationRecovery';
import { v09ChapterStartForStage, v09RecoverySceneForState } from '../../game/v09PresentationMigration';
import './scenes.css';
import '../ui/ui.css';
import './v08.css';
import './v09.css';

interface GameShellProps {
  onPresentationEvent?: (eventId: string) => void;
  onSceneChange?: (nextSceneId: GameSceneId) => void;
  renderFallback?: (sceneId: GameSceneId) => ReactNode;
}

function storySceneById(id: string): StorySceneData | undefined {
  return guanduStoryScenes.find((scene) => scene.id === id);
}

export function GameShell({
  onPresentationEvent,
  onSceneChange,
  renderFallback,
}: GameShellProps) {
  const { dispatch, state } = useGame();
  const { sceneId, storySceneId, beatIndex } = state.presentation;
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    shellRef.current?.focus();
  }, [sceneId, storySceneId, beatIndex]);

  const transitionTo = useCallback((nextSceneId: GameSceneId) => {
    dispatch({ type: 'SET_SCENE', sceneId: nextSceneId });
    onSceneChange?.(nextSceneId);
  }, [dispatch, onSceneChange]);

  const setStoryBeat = useCallback((nextBeatIndex: number) => {
    dispatch({ type: 'SET_STORY_POSITION', storySceneId, beatIndex: nextBeatIndex });
  }, [dispatch, storySceneId]);

  const startInvestigation = () => {
    dispatch({ type: 'SET_TUTORIAL_STEP', step: 'introIdentity' });
    dispatch({ type: 'SET_STORY_POSITION', storySceneId: 'prologue-background', beatIndex: 0 });
    transitionTo('opening');
  };

  const completeStoryScene = (nextSceneId: GameSceneId | undefined) => {
    const currentStory = storySceneById(storySceneId);
    if (currentStory?.nextStorySceneId) {
      dispatch({ type: 'SET_STORY_POSITION', storySceneId: currentStory.nextStorySceneId, beatIndex: 0 });
    }
    transitionTo(nextSceneId ?? 'case-summary');
  };

  const currentStory = storySceneById(storySceneId);
  const storyCompatible = isStorySceneCompatible(sceneId, storySceneId);
  const completeOpeningScene = () => {
    if (!currentStory) return;
    if (currentStory.nextStorySceneId) {
      dispatch({ type: 'SET_STORY_POSITION', storySceneId: currentStory.nextStorySceneId, beatIndex: 0 });
      return;
    }
    transitionTo(currentStory.nextSceneId ?? 'first-evidence');
  };
  let content: ReactNode;

  if (sceneId === 'title') {
    content = (
      <TitleScene onStart={startInvestigation} />
    );
  } else if (sceneId === 'opening' && storyCompatible && currentStory?.sceneId === 'opening') {
    content = <OpeningFlowScene scene={currentStory} beatIndex={beatIndex} onBeatChange={setStoryBeat} onCompleteScene={completeOpeningScene} onBack={() => transitionTo('title')} />;
  } else if (sceneId === 'first-evidence') {
    content = <FirstEvidenceScene onComplete={transitionTo} />;
  } else if (sceneId === 'first-deduction') {
    content = <FirstDeductionScene onComplete={transitionTo} />;
  } else if (sceneId === 'story' && storyCompatible && currentStory?.sceneId === 'story') {
    content = (
      <StoryScene
        beatIndex={beatIndex}
        scene={currentStory}
        onBeatChange={setStoryBeat}
        onComplete={completeStoryScene}
      />
    );
  } else if (sceneId === 'camp' && storyCompatible && currentStory?.sceneId === 'camp') {
    content = (
      <CampScene
        beatIndex={beatIndex}
        scene={currentStory}
        onBeatChange={setStoryBeat}
        onComplete={completeStoryScene}
        onPresentationEvent={onPresentationEvent}
      />
    );
  } else if (sceneId === 'audience') {
    content = <AudienceScene onComplete={transitionTo} />;
  } else if (sceneId === 'document') {
    content = <DocumentScene onComplete={transitionTo} />;
  } else if (sceneId === 'dialogue' && storyCompatible && currentStory?.sceneId === 'dialogue') {
    content = (
      <DialogueScene
        beatIndex={beatIndex}
        scene={currentStory}
        onBeatChange={setStoryBeat}
        onComplete={transitionTo}
        onPresentationEvent={onPresentationEvent}
      />
    );
  } else if (sceneId === 'investigation') {
    content = <InvestigationScene onComplete={transitionTo} />;
  } else if (sceneId === 'interrogation') {
    content = <InterrogationScene onComplete={transitionTo} />;
  } else if (sceneId === 'deduction') {
    content = <DeductionBoardScene onComplete={transitionTo} />;
  } else if (sceneId === 'network-investigation') {
    content = <NetworkInvestigationScene onComplete={transitionTo} />;
  } else if (sceneId === 'network-deduction') {
    content = <NetworkDeductionScene onComplete={transitionTo} />;
  } else if (sceneId === 'bait') {
    content = <BaitScene onComplete={transitionTo} />;
  } else if (sceneId === 'enemy-report') {
    content = <EnemyReportScene onComplete={(nextSceneId) => {
      if (nextSceneId === 'final-report') {
        dispatch({ type: 'START_AUDIENCE', visitId: 'final-report' });
        transitionTo('audience');
        return;
      }
      transitionTo(nextSceneId);
    }} />;
  } else if (sceneId === 'final-report') {
    content = <FinalReportScene onComplete={transitionTo} />;
  } else if (sceneId === 'ending') {
    content = <EndingScene />;
  } else if (sceneId === 'case-summary') {
    const evidenceCount = state.extractedClaimIds.filter((id) => id.startsWith('claim-')).length;
    content = (
      <main className="v09-case-summary" aria-labelledby="case-summary-title">
        <section className="v09-case-summary__intro"><span>第一幕结束</span><h1 id="case-summary-title">第一条矛盾成立</h1><p>赵简确实接触过集合时辰，但这还不足以证明他就是完整泄密链。</p></section>
        <GameCard className="v09-case-summary__card" density="compact" tone="dark">
          <CardHeader><div><small>阶段结论</small><h2>现在要从“谁说谎”转向“每个人究竟知道什么”。</h2></div></CardHeader>
          <CardContent><AnimatedList>{[
            `已记录 ${evidenceCount} 条案卷线索`,
            '赵简口供与集合记录存在直接矛盾',
            '尚不能证明赵简掌握完整路线',
            '下一步：认识陆淳、郑禾与杜衡',
          ].map((item) => <p key={item}>{item}</p>)}</AnimatedList></CardContent>
          <CardFooter><span>调查令余量：{state.investigationPoints}/3</span><GameButton variant="command" audioCue="tent-enter" mark="›" onClick={() => { dispatch({ type: 'SET_STAGE', stage: 'secrets' }); transitionTo('network-investigation'); }}>调查其他信息渠道</GameButton></CardFooter>
        </GameCard>
      </main>
    );
  } else if (renderFallback) {
    content = renderFallback(sceneId);
  } else {
    content = (
      <SceneRecovery
        onRecover={() => dispatch({ type: 'REPAIR_PRESENTATION' })}
        onReturnToCase={() => transitionTo(v09RecoverySceneForState(state))}
        onRestartChapter={() => {
          const restartScene = v09ChapterStartForStage(state.stage);
          if (restartScene === 'opening') {
            dispatch({ type: 'SET_STORY_POSITION', storySceneId: 'prologue-background', beatIndex: 0 });
          }
          transitionTo(restartScene);
        }}
      />
    );
  }

  return (
    <GameAudioProvider>
      <div className="game-shell" ref={shellRef} tabIndex={-1} data-current-scene={sceneId}>
        {sceneId !== 'title' && sceneId !== 'opening' && (
          <CaseNavigator
            sceneId={sceneId}
            onBack={() => dispatch({ type: 'GO_BACK' })}
            onSafeReturn={transitionTo}
          />
        )}
        {content}
      </div>
    </GameAudioProvider>
  );
}
