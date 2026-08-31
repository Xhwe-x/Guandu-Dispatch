import type { VoicePersona } from '../audio/GameAudio';

export type PortraitCharacterId = 'commander' | 'zhao' | 'caocao' | 'officer' | 'lu' | 'zheng' | 'du';
export type DialogueMood = 'neutral' | 'thinking' | 'guarded' | 'denial' | 'pressured' | 'resolved';

export interface DialogueCharacterPresentation {
  id: string;
  name: string;
  role: string;
  portrait: PortraitCharacterId;
  side: 'left' | 'right' | 'center';
  persona: 'caocao' | 'officer' | 'soldier';
  voice: VoicePersona;
  defaultMood: DialogueMood;
  entryCue: 'character-enter' | 'tent-enter';
}

export const dialogueCharacters: Record<string, DialogueCharacterPresentation> = {
  investigator: { id: 'investigator', name: '查案官', role: '军府案牍吏 · 奉中军令查案', portrait: 'officer', side: 'left', persona: 'officer', voice: 'officer', defaultMood: 'neutral', entryCue: 'character-enter' },
  officer: { id: 'officer', name: '查案官', role: '军府案牍吏 · 奉中军令查案', portrait: 'officer', side: 'left', persona: 'officer', voice: 'officer', defaultMood: 'neutral', entryCue: 'character-enter' },
  commander: { id: 'commander', name: '中军主将', role: '官渡中军', portrait: 'commander', side: 'right', persona: 'officer', voice: 'officer', defaultMood: 'guarded', entryCue: 'character-enter' },
  caocao: { id: 'caocao', name: '曹操', role: '司空 · 行车骑将军事', portrait: 'caocao', side: 'right', persona: 'caocao', voice: 'caocao', defaultMood: 'thinking', entryCue: 'tent-enter' },
  zhao: { id: 'zhao', name: '赵简', role: '军书佐', portrait: 'zhao', side: 'right', persona: 'officer', voice: 'zhao', defaultMood: 'denial', entryCue: 'character-enter' },
  lu: { id: 'lu', name: '陆淳', role: '邮驿主吏', portrait: 'lu', side: 'right', persona: 'officer', voice: 'lu', defaultMood: 'guarded', entryCue: 'character-enter' },
  zheng: { id: 'zheng', name: '郑禾', role: '军粮书佐', portrait: 'zheng', side: 'right', persona: 'officer', voice: 'zheng', defaultMood: 'guarded', entryCue: 'character-enter' },
  du: { id: 'du', name: '杜衡', role: '营外行商', portrait: 'du', side: 'right', persona: 'officer', voice: 'du', defaultMood: 'thinking', entryCue: 'character-enter' },
  escort: { id: 'escort', name: '押粮军士', role: '护送粮队', portrait: 'officer', side: 'right', persona: 'soldier', voice: 'soldier', defaultMood: 'pressured', entryCue: 'character-enter' },
};

export function dialogueCharacterFor(speakerId?: string) {
  return speakerId ? dialogueCharacters[speakerId] : undefined;
}
