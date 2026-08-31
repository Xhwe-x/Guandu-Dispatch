import { useEffect } from 'react';
import type { DialogueBeat, StorySceneData } from '../../game/storyTypes';
import { useGameAudio } from '../audio/GameAudio';
import { DialogueBox } from './DialogueBox';
import { DialogueCharacterCard } from './DialogueCharacterCard';
import { dialogueCharacterFor } from './dialogueCharacters';
import { GameButton } from '../ui/GameButton';

interface StorySceneProps {
  beatIndex: number;
  onBeatChange: (nextBeatIndex: number) => void;
  onComplete: (nextSceneId: StorySceneData['nextSceneId']) => void;
  scene: StorySceneData;
}


const cgVariants: Record<string, string> = {
  cg_intro_convoy: 'convoy',
  cg_intro_ambush: 'ambush',
  cg_intro_aftermath: 'aftermath',
};

function dialogueAt(scene: StorySceneData, index: number): DialogueBeat | undefined {
  const beat = scene.beats[index];
  return beat?.type === 'dialogue' ? beat : undefined;
}

function PrologueArt({ variant }: { variant: string }) {
  return (
    <svg className="prologue-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#111a25" />
          <stop offset="0.52" stopColor="#252422" />
          <stop offset="1" stopColor="#090806" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#423526" />
          <stop offset="1" stopColor="#17120d" />
        </linearGradient>
        <radialGradient id="fire" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd28a" stopOpacity=".95" />
          <stop offset=".28" stopColor="#d56636" stopOpacity=".65" />
          <stop offset="1" stopColor="#7b2017" stopOpacity="0" />
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="12" /></filter>
      </defs>
      <rect width="1600" height="900" fill="url(#night)" />
      <circle cx="220" cy="155" r="55" fill="#d8cfad" opacity=".78" />
      <path d="M0 430 L170 290 L320 390 L500 240 L690 390 L840 300 L1020 420 L1250 245 L1600 420 L1600 900 L0 900Z" fill="#12191b" />
      <path d="M0 530 L180 420 L360 500 L570 365 L760 490 L970 390 L1160 505 L1390 385 L1600 500 L1600 900 L0 900Z" fill="#171a18" />
      <path d="M250 900 Q720 585 1420 560 L1600 900Z" fill="url(#road)" />
      <g className="prologue-art__convoy" transform="translate(720 525)">
        <g transform="translate(0 75)">
          <circle cx="25" cy="100" r="31" fill="#15110d" stroke="#866442" strokeWidth="7" />
          <circle cx="185" cy="100" r="31" fill="#15110d" stroke="#866442" strokeWidth="7" />
          <rect x="0" y="18" width="210" height="84" rx="6" fill="#5e452e" />
          <path d="M12 17 H196 L175 -18 H38Z" fill="#7c6644" />
          <path d="M207 55 Q280 40 330 71" stroke="#57432e" strokeWidth="12" fill="none" />
        </g>
        <g transform="translate(-320 140) scale(.78)">
          <circle cx="25" cy="100" r="31" fill="#15110d" stroke="#866442" strokeWidth="7" />
          <circle cx="185" cy="100" r="31" fill="#15110d" stroke="#866442" strokeWidth="7" />
          <rect x="0" y="18" width="210" height="84" rx="6" fill="#4d3928" />
          <path d="M12 17 H196 L175 -18 H38Z" fill="#6b593d" />
        </g>
      </g>
      <g className="prologue-art__torches">
        <circle cx="1040" cy="590" r="150" fill="url(#fire)" />
        <circle cx="540" cy="690" r="110" fill="url(#fire)" opacity=".55" />
      </g>
      {variant !== 'convoy' && (
        <g className="prologue-art__attack">
          <path d="M1310 260 L1020 500" stroke="#cba06b" strokeWidth="5" />
          <path d="M1255 235 L965 475" stroke="#cba06b" strokeWidth="4" />
          <path d="M1385 335 L1115 535" stroke="#cba06b" strokeWidth="4" />
          <circle cx="915" cy="570" r="250" fill="url(#fire)" opacity={variant === 'aftermath' ? '.95' : '.62'} />
          <path d="M870 710 Q930 550 982 710 Q1030 605 1070 730Z" fill="#c24b28" opacity=".9" />
          <path d="M912 705 Q952 610 982 705 Q1010 646 1030 720Z" fill="#ef9c4d" opacity=".9" />
        </g>
      )}
      {variant === 'aftermath' && (
        <g className="prologue-art__smoke" filter="url(#blur)" opacity=".44">
          <ellipse cx="930" cy="430" rx="170" ry="230" fill="#b09a82" />
          <ellipse cx="1090" cy="360" rx="120" ry="210" fill="#7c7269" />
        </g>
      )}
    </svg>
  );
}

export function StoryScene({ beatIndex, onBeatChange, onComplete, scene }: StorySceneProps) {
  const beat = dialogueAt(scene, beatIndex);
  const { play, speak } = useGameAudio();
  const character = dialogueCharacterFor(beat?.speakerId);

  useEffect(() => {
    if (!beat) return;
    if (beat.id === 'intro-attack') { play('warning'); speak('敌袭！', 'soldier'); }
    if (beat.id === 'intro-aftermath') speak('第三次了。', 'officer');
  }, [beat, play, speak]);

  if (!beat) {
    return (
      <main className="story-scene story-scene--missing" aria-labelledby="story-fallback-title">
        <section className="scene-fallback" role="status">
          <p className="scene-kicker">剧情画面</p>
          <h1 id="story-fallback-title">这一幕暂时无法呈现</h1>
          <p>案件进度仍然保留。你可以跳过这一幕，继续进入最近的有效调查节点。</p>
          <GameButton variant="command" audioCue="ui-confirm" mark="›" onClick={() => onComplete(scene.nextSceneId)}>继续调查</GameButton>
        </section>
      </main>
    );
  }

  const assetId = beat.cgId ?? scene.cgId;
  const visualVariant = assetId ? cgVariants[assetId] : 'convoy';
  const isLastBeat = beatIndex === scene.beats.length - 1;
  const advance = () => {
    if (isLastBeat) {
      onComplete(scene.nextSceneId);
      return;
    }
    onBeatChange(beatIndex + 1);
  };

  return (
    <main className={`story-scene story-scene--${visualVariant}`} aria-labelledby="story-scene-title" data-scene-id={scene.id}>
      <h1 className="visually-hidden" id="story-scene-title">粮队伏击</h1>
      <PrologueArt variant={visualVariant} />
      <div className="story-scene__vignette" aria-hidden="true" />
      <div className="story-scene__grain" aria-hidden="true" />
      <div className="story-scene__chapter" aria-hidden="true">
        <span>序 · 粮道夜袭</span><i /><span>{String(beatIndex + 1).padStart(2, '0')}</span>
      </div>
      <div className="story-scene__dialogue story-scene__dialogue--v08">
        {character ? (
          <div className="story-character-beat">
            <DialogueCharacterCard character={character} mood={beat.id === 'intro-attack' ? 'pressured' : beat.id === 'intro-aftermath' ? 'guarded' : character.defaultMood} line={beat.text} />
            <GameButton variant="command" audioCue="ui-confirm" onClick={advance} mark="›">{isLastBeat ? '进入中军帐' : '继续听报'}</GameButton>
          </div>
        ) : (
          <DialogueBox dialogueId={beat.id} text={beat.text} onContinue={advance} continueLabel={isLastBeat ? '进入中军帐' : '继续'} />
        )}
      </div>
    </main>
  );
}
