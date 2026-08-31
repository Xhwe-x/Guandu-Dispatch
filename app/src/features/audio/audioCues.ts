export type AudioCueId =
  | 'ui-click'
  | 'ui-confirm'
  | 'ui-back'
  | 'journal-tab'
  | 'paper-open'
  | 'paper-close'
  | 'seal'
  | 'tent-enter'
  | 'character-enter'
  | 'evidence-place'
  | 'deduction-link'
  | 'warning'
  | 'task-unlock';

export interface ToneCue {
  frequency: number;
  duration: number;
  gain: number;
  type: OscillatorType;
  endFrequency?: number;
  secondFrequency?: number;
}

export const audioCues: Record<AudioCueId, ToneCue> = {
  'ui-click': { frequency: 280, duration: 0.045, gain: 0.045, type: 'triangle', endFrequency: 235 },
  'ui-confirm': { frequency: 390, duration: 0.09, gain: 0.055, type: 'sine', endFrequency: 520 },
  'ui-back': { frequency: 250, duration: 0.075, gain: 0.04, type: 'triangle', endFrequency: 170 },
  'journal-tab': { frequency: 330, duration: 0.07, gain: 0.035, type: 'triangle', endFrequency: 300 },
  'paper-open': { frequency: 115, duration: 0.11, gain: 0.035, type: 'triangle', endFrequency: 180 },
  'paper-close': { frequency: 175, duration: 0.09, gain: 0.03, type: 'triangle', endFrequency: 105 },
  seal: { frequency: 92, duration: 0.12, gain: 0.08, type: 'square', endFrequency: 72 },
  'tent-enter': { frequency: 145, duration: 0.18, gain: 0.04, type: 'sine', endFrequency: 105 },
  'character-enter': { frequency: 205, duration: 0.11, gain: 0.032, type: 'triangle', endFrequency: 245 },
  'evidence-place': { frequency: 130, duration: 0.1, gain: 0.055, type: 'triangle', endFrequency: 96 },
  'deduction-link': { frequency: 300, duration: 0.16, gain: 0.045, type: 'sine', endFrequency: 455 },
  warning: { frequency: 150, duration: 0.16, gain: 0.055, type: 'sawtooth', endFrequency: 118 },
  'task-unlock': { frequency: 360, duration: 0.16, gain: 0.05, type: 'sine', endFrequency: 620 },
};

export const keyVoiceLines = new Set([
  '参见主公。', '起身，坐前回话。', '说下去。', '孤要真相。', '臣领命。', '敌袭！', '第三次了。',
  '臣……确曾进去过一次。', '属下不敢隐瞒。',
]);

export const audioCueAssets: Record<AudioCueId, string> = {
  'ui-click': '/assets/audio/ui-click.wav',
  'ui-confirm': '/assets/audio/ui-confirm.wav',
  'ui-back': '/assets/audio/ui-back.wav',
  'journal-tab': '/assets/audio/journal-tab.wav',
  'paper-open': '/assets/audio/paper-open.wav',
  'paper-close': '/assets/audio/paper-close.wav',
  seal: '/assets/audio/seal.wav',
  'tent-enter': '/assets/audio/tent-enter.wav',
  'character-enter': '/assets/audio/character-enter.wav',
  'evidence-place': '/assets/audio/evidence-place.wav',
  'deduction-link': '/assets/audio/deduction-link.wav',
  warning: '/assets/audio/warning.wav',
  'task-unlock': '/assets/audio/task-unlock.wav',
};
