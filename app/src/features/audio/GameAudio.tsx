import { createContext, useCallback, useContext, useMemo, useRef, type MouseEvent, type ReactNode } from 'react';
import { useGame } from '../../app/GameProvider';
import { audioCueAssets, audioCues, type AudioCueId } from './audioCues';
import { localVoiceAssetFor, type VoicePersona } from './voiceAssets';
export type { VoicePersona } from './voiceAssets';

interface VoiceProfile {
  rate: number;
  pitch: number;
  preferredNames: string[];
}

const voiceProfiles: Record<VoicePersona, VoiceProfile> = {
  caocao: { rate: 0.84, pitch: 0.66, preferredNames: ['Yunjian', 'Yunxi', 'Sin-ji', 'Ting-Ting'] },
  officer: { rate: 0.93, pitch: 0.86, preferredNames: ['Yunxi', 'Xiaoxiao', 'Ting-Ting'] },
  soldier: { rate: 1.04, pitch: 0.88, preferredNames: ['Yunjian', 'Yunyang', 'Yunxi'] },
  zhao: { rate: 0.92, pitch: 0.9, preferredNames: ['Yunxi', 'Xiaoxiao', 'Ting-Ting'] },
  lu: { rate: 0.88, pitch: 0.79, preferredNames: ['Yunjian', 'Yunxi', 'Ting-Ting'] },
  zheng: { rate: 0.9, pitch: 0.93, preferredNames: ['Yunxi', 'Xiaoxiao', 'Ting-Ting'] },
  du: { rate: 0.96, pitch: 0.76, preferredNames: ['Yunjian', 'Yunyang', 'Yunxi'] },
};

interface GameAudioContextValue {
  play: (cueId: AudioCueId) => void;
  speak: (text: string, persona?: VoicePersona) => void;
  stopVoice: () => void;
}

const GameAudioContext = createContext<GameAudioContextValue | null>(null);

function getVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
}

function selectVoice(profile: VoiceProfile) {
  const voices = getVoices();
  const chinese = voices.filter((voice) => /^zh/i.test(voice.lang));
  return profile.preferredNames
    .map((preferred) => chinese.find((voice) => voice.name.toLowerCase().includes(preferred.toLowerCase())))
    .find(Boolean) ?? chinese[0];
}


function speakWithBrowserVoice(text: string, persona: VoicePersona, volume: number) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const profile = voiceProfiles[persona];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.volume = volume;
  utterance.rate = profile.rate;
  utterance.pitch = profile.pitch;
  const voice = selectVoice(profile);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function GameAudioProvider({ children }: { children: ReactNode }) {
  const { state } = useGame();
  const settings = state.audio ?? { enabled: true, voiceEnabled: true, volume: 0.72 };
  const contextRef = useRef<AudioContext | null>(null);
  const voiceAssetRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((cueId: AudioCueId) => {
    if (!settings.enabled || typeof window === 'undefined') return;
    const playFallbackTone = () => {
      const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = contextRef.current ?? new AudioContextCtor();
      contextRef.current = ctx;
      if (ctx.state === 'suspended') void ctx.resume();
      const cue = audioCues[cueId];
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      oscillator.type = cue.type;
      oscillator.frequency.setValueAtTime(cue.frequency, now);
      if (cue.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, cue.endFrequency), now + cue.duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, cue.gain * settings.volume), now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + cue.duration + 0.02);
    };
    if (typeof Audio !== 'undefined') {
      const asset = new Audio(audioCueAssets[cueId]);
      asset.volume = Math.max(0, Math.min(1, settings.volume));
      // jsdom 等环境的 play() 不返回 Promise，统一包一层再降级到合成音。
      Promise.resolve(asset.play?.()).catch(playFallbackTone);
      return;
    }
    playFallbackTone();
  }, [settings.enabled, settings.volume]);

  const stopVoice = useCallback(() => {
    if (voiceAssetRef.current) {
      voiceAssetRef.current.pause();
      voiceAssetRef.current.currentTime = 0;
      voiceAssetRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback((text: string, persona: VoicePersona = 'officer') => {
    if (!settings.enabled || !settings.voiceEnabled || typeof window === 'undefined') return;
    stopVoice();
    const localAsset = localVoiceAssetFor(text, persona);
    if (localAsset && typeof Audio !== 'undefined') {
      const voiceAsset = new Audio(localAsset);
      voiceAssetRef.current = voiceAsset;
      voiceAsset.volume = Math.max(0, Math.min(1, settings.volume));
      voiceAsset.onended = () => { if (voiceAssetRef.current === voiceAsset) voiceAssetRef.current = null; };
      Promise.resolve(voiceAsset.play?.()).catch(() => {
        if (voiceAssetRef.current === voiceAsset) voiceAssetRef.current = null;
        speakWithBrowserVoice(text, persona, settings.volume);
      });
      return;
    }
    speakWithBrowserVoice(text, persona, settings.volume);
  }, [settings.enabled, settings.voiceEnabled, settings.volume, stopVoice]);

  const value = useMemo(() => ({ play, speak, stopVoice }), [play, speak, stopVoice]);

  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    const button = (event.target as HTMLElement).closest('button');
    if (!button || button.disabled) return;
    const explicit = button.dataset.audioCue as AudioCueId | undefined;
    play(explicit ?? (button.classList.contains('scene-button--primary') || button.classList.contains('game-button--command') ? 'ui-confirm' : 'ui-click'));
  }

  return (
    <GameAudioContext.Provider value={value}>
      <div className="game-audio-surface" onClickCapture={onClickCapture}>{children}</div>
    </GameAudioContext.Provider>
  );
}

export function useGameAudio() {
  const value = useContext(GameAudioContext);
  return value ?? { play: () => undefined, speak: () => undefined, stopVoice: () => undefined };
}
