import { useEffect, useMemo } from 'react';
import { useGame } from '../../app/GameProvider';
import type { StoryBeat, StorySceneData } from '../../game/storyTypes';
import { useGameAudio } from '../audio/GameAudio';
import { GameButton } from '../../ui/primitives/GameButton';
import { CharacterIntro } from '../../ui/game/CharacterIntro';
import { DialoguePanel } from '../../ui/game/DialoguePanel';
import { BlurFade } from '../../ui/motion/BlurFade';
import './v09.css';

const cgAsset: Partial<Record<string, string>> = {
  cg_intro_convoy: '/assets/cg/night-ambush.png',
  cg_intro_ambush: '/assets/cg/night-ambush.png',
  cg_intro_aftermath: '/assets/cg/interrogation-tent-bg.webp',
  cg_evidence_desk: '/assets/cg/evidence-desk.png',
  cg_audience_caocao: '/assets/cg/audience-caocao.png',
};

const beatVisualMap: Partial<Record<string, keyof typeof cgAsset>> = {
  'bg-guan-du': 'cg_intro_convoy',
  'bg-three-raids': 'cg_intro_ambush',
  'bg-leak': 'cg_intro_aftermath',
  'bg-assignment': 'cg_audience_caocao',
  'identity-card': 'cg_evidence_desk',
  'tutorial-report': 'cg_evidence_desk',
  'tutorial-report-note': 'cg_evidence_desk',
  'tutorial-dossier-open': 'cg_evidence_desk',
  // 人物出场与对白节拍一律用军帐背影做背景：zhao-interrogation.png 是赵简脸部
  // 特写，与左侧立绘同屏会形成“两个赵简”。
  'zhao-reveal': 'cg_intro_aftermath',
  'zhao-first-line': 'cg_intro_aftermath',
  'officer-first-question': 'cg_intro_aftermath',
  'zhao-first-answer': 'cg_intro_aftermath',
  'zhao-first-task': 'cg_evidence_desk',
};

const names: Record<string, { name: string; role: string; persona: 'zhao' | 'officer' | 'soldier' }> = {
  zhao: { name: '赵简', role: '军书佐', persona: 'zhao' },
  officer: { name: '查案官', role: '军机案查验人', persona: 'officer' },
  escort: { name: '押粮军士', role: '', persona: 'soldier' },
};

const openingStageMeta: Record<string, { chapter: string; title: string }> = {
  'prologue-background': { chapter: '序章', title: '粮道疑云' },
  'player-identity': { chapter: '序章', title: '奉命查案' },
  'basic-onboarding': { chapter: '引导', title: '第一次查案' },
  'zhao-first-intro': { chapter: '第一折', title: '第一位涉案人' },
  'zhao-first-dialogue': { chapter: '第一折', title: '听取赵简口供' },
};

function visualForBeat(scene: StorySceneData, beat: StoryBeat) {
  const visualKey = beatVisualMap[beat.id] ?? beat.cgId ?? scene.cgId ?? 'cg_intro_convoy';
  return {
    visualKey,
    asset: cgAsset[visualKey],
  };
}

function OpeningBackdrop({ visualKey, asset }: { visualKey: string; asset?: string }) {
  return (
    <div className="v09-opening__visual v09-opening__visual--swap" data-cg={visualKey} data-visual={visualKey} aria-hidden="true">
      {asset ? <img key={visualKey} src={asset} alt="" /> : null}
      <div className="v09-opening__shade" />
    </div>
  );
}

function OpeningHud({ scene, beatIndex, onBack }: { scene: StorySceneData; beatIndex: number; onBack: () => void }) {
  const meta = openingStageMeta[scene.id] ?? { chapter: '官渡密报', title: '案件推进' };
  return (
    <>
      <div className="v093-opening-nav">
        <div className="v093-opening-hud" aria-label={`${meta.chapter} ${meta.title}`}>
          <span>{meta.chapter}</span>
          <strong>{meta.title}</strong>
          <small>{Math.min(beatIndex + 1, scene.beats.length)} / {scene.beats.length}</small>
        </div>
        <GameButton variant="ghost" size="sm" className="v093-opening-back" onClick={onBack}>← 返回标题</GameButton>
      </div>
      <div className="v093-opening-keyhint" aria-hidden="true">
        <kbd>Enter</kbd>
        <kbd>Space</kbd>
        <span>继续</span>
      </div>
    </>
  );
}

export function OpeningFlowScene({
  scene,
  beatIndex,
  onBeatChange,
  onCompleteScene,
  onBack,
}: {
  scene: StorySceneData;
  beatIndex: number;
  onBeatChange: (n: number) => void;
  onCompleteScene: () => void;
  onBack: () => void;
}) {
  const { dispatch } = useGame();
  const { speak, stopVoice } = useGameAudio();
  const beat: StoryBeat | undefined = scene.beats[beatIndex];
  const isLast = Boolean(beat && beatIndex === scene.beats.length - 1);
  const visual = useMemo(() => (beat ? visualForBeat(scene, beat) : null), [beat, scene]);

  const advance = () => {
    if (!beat) return;
    if (beat.type === 'dialogue') {
      const meta = beat.speakerId ? names[beat.speakerId] : undefined;
      dispatch({ type: 'RECORD_DIALOGUE', entry: { id: `${scene.id}:${beat.id}`, speakerId: beat.speakerId, speakerName: meta?.name ?? '旁白', text: beat.text } });
    }
    if (beat.actionId === 'open-ambush-report') {
      dispatch({ type: 'READ_DOCUMENT', documentId: 'report-ambush' });
      dispatch({ type: 'EXTRACT_CLAIM', claimId: 'claim-shuoyuan-received' });
    }
    if (beat.actionId === 'accept-case') dispatch({ type: 'SET_TUTORIAL_STEP', step: 'openAmbushReport' });
    if (isLast) onCompleteScene(); else onBeatChange(beatIndex + 1);
  };

  useEffect(() => {
    if (beat?.type === 'dialogue' && beat.voiceId && beat.speakerId) {
      const meta = names[beat.speakerId];
      if (meta) speak(beat.text, meta.persona);
    }
    return stopVoice;
  }, [beat, speak, stopVoice]);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('button,input,textarea,select,a')) return;
      event.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  });

  if (!beat || !visual) return null;
  const hud = <OpeningHud scene={scene} beatIndex={beatIndex} onBack={onBack} />;

  if (beat.type === 'character-intro') {
    return (
      <main className="v09-opening v09-opening--character">
        {hud}
        <OpeningBackdrop visualKey={visual.visualKey} asset={visual.asset} />
        <section className="v09-opening__stage-layer v09-opening__stage-layer--character">
          <CharacterIntro characterId={beat.speakerId} title={beat.title} subtitle={beat.subtitle} description={beat.description} onContinue={advance} actionLabel={beat.actionLabel} />
        </section>
      </main>
    );
  }

  if (beat.type === 'dialogue' && beat.speakerId) {
    const meta = names[beat.speakerId] ?? { name: beat.speakerId, role: '', persona: 'officer' as const };
    return (
      <main className="v09-opening v09-opening--dialogue">
        {hud}
        <OpeningBackdrop visualKey={visual.visualKey} asset={visual.asset} />
        <section className="v09-opening__stage-layer v09-opening__stage-layer--dialogue">
          <DialoguePanel speakerId={beat.speakerId === 'officer' ? 'commander' : beat.speakerId} name={meta.name} role={meta.role} text={beat.text} mood={beat.speakerId === 'zhao' ? '戒备' : '平静'} onContinue={advance} actionLabel={beat.actionLabel ?? '继续'} />
        </section>
      </main>
    );
  }

  return (
    <main className="v09-opening">
      {hud}
      <OpeningBackdrop visualKey={visual.visualKey} asset={visual.asset} />
      <BlurFade keyId={beat.id} className="v09-opening__content">
        {beat.type === 'tutorial' ? (
          <section className="v09-opening__tutorial">
            <small>{beat.title}</small>
            <h1>{beat.text}</h1>
            {beat.steps?.length ? <ul>{beat.steps.map((step) => <li key={step}>{step}</li>)}</ul> : null}
            {beat.actionId === 'open-ambush-report' ? (
              <button className="v09-report-object" type="button" data-audio-cue="paper-open" onClick={advance}>
                <span>伏击军报</span>
                <small>军机急件 · 点击展开</small>
                <i aria-hidden="true">报</i>
              </button>
            ) : (
              <GameButton variant="primary" size="lg" audioCue={beat.actionId === 'accept-case' ? 'paper-open' : 'ui-confirm'} onClick={advance}>{beat.actionLabel ?? '继续'}</GameButton>
            )}
          </section>
        ) : (
          <section className="v09-opening__narration">
            <p>{beat.text}</p>
            <GameButton variant="secondary" size="md" audioCue="ui-confirm" onClick={advance}>{beat.actionLabel ?? '继续'} →</GameButton>
          </section>
        )}
      </BlurFade>
      <div className="v09-opening__progress" aria-label="本幕进度">{scene.beats.map((item, index) => <i key={item.id} data-active={index === beatIndex} />)}</div>
    </main>
  );
}
