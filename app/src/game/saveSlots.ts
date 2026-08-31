import { migrateGameState } from './contentSchema';
import type { GameState, Stage } from './domain';
import type { GameSceneId } from './scenes';

export type SaveSlotId = 'slot-1' | 'slot-2' | 'slot-3';

export const SAVE_SLOT_IDS: SaveSlotId[] = ['slot-1', 'slot-2', 'slot-3'];

export interface SaveSlotRecord {
  format: 1;
  id: SaveSlotId;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: GameState;
}

export interface SaveSlotSummary extends SaveSlotRecord {
  chapterLabel: string;
  sceneLabel: string;
  objective: string;
  progress: number;
}

const MIGRATION_FLAG = 'guandu.save-slots.migrated.v1';
const LEGACY_CURRENT_KEY = 'guandu.current';
const slotKey = (id: SaveSlotId) => `guandu.save.${id}`;

const stageProgress: Record<Stage, number> = {
  documents: 8,
  secrets: 28,
  chain: 50,
  bait: 68,
  report: 86,
  ending: 100,
};

const sceneProgress: Partial<Record<GameSceneId, number>> = {
  title: 0,
  opening: 3,
  'first-evidence': 12,
  'first-deduction': 16,
  interrogation: 22,
  'case-summary': 26,
  'network-investigation': 34,
  'network-deduction': 54,
  audience: 62,
  bait: 72,
  'enemy-report': 82,
  'final-report': 90,
  ending: 100,
};

const chapterByStage: Record<Stage, string> = {
  documents: '第一幕 · 粮道疑云',
  secrets: '第二幕 · 人人有隐情',
  chain: '第三幕 · 碎片成军情',
  bait: '第五幕 · 将计就计',
  report: '第六幕 · 敌军回声',
  ending: '第七幕 · 案卷终章',
};

const sceneLabels: Partial<Record<GameSceneId, string>> = {
  title: '尚未开始',
  opening: '时代背景与身份介绍',
  'first-evidence': '核对赵简口供',
  'first-deduction': '建立第一条矛盾',
  interrogation: '再问赵简',
  'case-summary': '第一条矛盾成立',
  'network-investigation': '调查其他信息渠道',
  'network-deduction': '还原双渠道泄密链',
  audience: '中军复命',
  bait: '分渠道投放假消息',
  'enemy-report': '读取敌军回声',
  'final-report': '提交最终军机报告',
  ending: '案件结局',
};

const objectiveByScene: Partial<Record<GameSceneId, string>> = {
  opening: '了解案情，并接下调查任务。',
  'first-evidence': '选择赵简口供与集合记录，核对两条信息。',
  'first-deduction': '判断两条信息是否存在矛盾。',
  interrogation: '用已掌握证据继续核实赵简的说法。',
  'case-summary': '转向调查其他人物掌握的信息。',
  'network-investigation': '分别了解陆淳、郑禾与杜衡。',
  'network-deduction': '还原时辰、路线与传递方式。',
  audience: '向曹操陈明当前证据链。',
  bait: '针对不同渠道投放不同假信息。',
  'enemy-report': '把敌军行动作为新的反证。',
  'final-report': '区分事实、责任与处置。',
  ending: '查看人物与战局后果。',
};

function summarize(record: SaveSlotRecord): SaveSlotSummary {
  const sceneId = record.state.presentation.sceneId;
  const base = stageProgress[record.state.stage];
  return {
    ...record,
    chapterLabel: chapterByStage[record.state.stage],
    sceneLabel: sceneLabels[sceneId] ?? '案件调查中',
    objective: objectiveByScene[sceneId] ?? '继续当前案件调查。',
    progress: Math.max(base, sceneProgress[sceneId] ?? base),
  };
}

function parseRecord(raw: string): SaveSlotRecord {
  const parsed = JSON.parse(raw) as Partial<SaveSlotRecord>;
  if (parsed.format !== 1 || !SAVE_SLOT_IDS.includes(parsed.id as SaveSlotId) || !parsed.state) {
    throw new Error('invalid save slot');
  }
  return {
    format: 1,
    id: parsed.id as SaveSlotId,
    name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : '官渡案卷',
    createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    state: migrateGameState(parsed.state),
  };
}

export function saveToSlot(storage: Storage, id: SaveSlotId, state: GameState, name?: string): SaveSlotSummary {
  const existingRaw = storage.getItem(slotKey(id));
  let existing: SaveSlotRecord | undefined;
  if (existingRaw) {
    try { existing = parseRecord(existingRaw); } catch { /* replace broken slot explicitly */ }
  }
  const now = new Date().toISOString();
  const record: SaveSlotRecord = {
    format: 1,
    id,
    name: name?.trim() || existing?.name || `案卷 ${SAVE_SLOT_IDS.indexOf(id) + 1}`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    state,
  };
  storage.setItem(slotKey(id), JSON.stringify(record));
  return summarize(record);
}

export function loadSaveSlot(storage: Storage, id: SaveSlotId): SaveSlotSummary | null {
  const raw = storage.getItem(slotKey(id));
  if (!raw) return null;
  try { return summarize(parseRecord(raw)); } catch { return null; }
}

export function listSaveSlots(storage: Storage): Array<SaveSlotSummary | null> {
  return SAVE_SLOT_IDS.map((id) => loadSaveSlot(storage, id));
}

export function deleteSaveSlot(storage: Storage, id: SaveSlotId): void {
  storage.removeItem(slotKey(id));
}

export function migrateLegacyCurrentSave(storage: Storage): void {
  if (storage.getItem(MIGRATION_FLAG) === '1') return;
  storage.setItem(MIGRATION_FLAG, '1');
  if (SAVE_SLOT_IDS.some((id) => storage.getItem(slotKey(id)) !== null)) return;
  const legacy = storage.getItem(LEGACY_CURRENT_KEY);
  if (!legacy) return;
  try {
    const state = migrateGameState(JSON.parse(legacy));
    saveToSlot(storage, 'slot-1', state, '旧版自动存档');
  } catch {
    // Broken legacy data remains untouched. The new slot list starts empty.
  }
}
