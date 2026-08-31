export type VoicePersona = 'caocao' | 'officer' | 'soldier' | 'zhao' | 'lu' | 'zheng' | 'du';

function normalizeVoiceText(text: string) {
  return text.replace(/[\s，。！？、…“”‘’：；,.!?"'—-]/g, '');
}

const voiceAssetEntries: Array<[VoicePersona, string, string]> = [
  ['caocao', '起身，坐前回话。', '/assets/voice/caocao-rise.wav'],
  ['caocao', '你查到什么，便说什么。', '/assets/voice/caocao-report.wav'],
  ['caocao', '说下去。', '/assets/voice/caocao-say-more.wav'],
  ['caocao', '你凭什么认定赵简？', '/assets/voice/caocao-why-zhao.wav'],
  ['caocao', '敌不等人，粮也不等人。', '/assets/voice/caocao-hurry.wav'],
  ['caocao', '孤不要一个替死鬼。孤要真相。', '/assets/voice/caocao-truth.wav'],
  ['caocao', '赵简、郑禾、陆淳、杜衡，都给孤掀开来看。孤不要一个替死鬼。孤要真相。', '/assets/voice/caocao-first-order.wav'],
  ['caocao', '把事实、责任与处置分开写。孤不要一个替死鬼，也不要一张糊涂军报。', '/assets/voice/caocao-final-order.wav'],
  ['officer', '臣参见主公。', '/assets/voice/officer-salute.wav'],
  ['officer', '参见主公。', '/assets/voice/officer-salute.wav'],
  ['officer', '臣领命。', '/assets/voice/officer-obey.wav'],
  ['zhao', '我……确曾知道集合时辰，也把它说了出去。', '/assets/voice/zhao-calm.wav'],
  ['zhao', '我确曾知道集合时辰，也把它说了出去。', '/assets/voice/zhao-calm.wav'],
  ['zhao', '家人在他们手里。属下……不敢不从。', '/assets/voice/zhao-family.wav'],
  ['zhao', '家人在他们手里。属下不敢不从。', '/assets/voice/zhao-family.wav'],
  ['zhao', '寅初……你们连这个也查到了？', '/assets/voice/zhao-slip.wav'],
  ['zhao', '寅初？你们连这个也查到了？', '/assets/voice/zhao-slip.wav'],
  ['zhao', '属下认。时辰是我泄出去的。', '/assets/voice/zhao-confess.wav'],
  ['lu', '封检、邮书、驿马都有簿可查。粮册之事，我愿说明。', '/assets/voice/lu-intro.wav'],
  ['lu', '粮册是我改的。可出发时辰，我确实不知。', '/assets/voice/lu-confess.wav'],
  ['zheng', '车损是我的过失，但路线不是我定的。', '/assets/voice/zheng-intro.wav'],
  ['zheng', '维修记录是我改的。路线核定前，我已经离开。', '/assets/voice/zheng-confess.wav'],
  ['du', '商人走的路，看的是车辙、草料和价钱。', '/assets/voice/du-intro.wav'],
  ['du', '路是我算出来的。价表……也是我传出去的。', '/assets/voice/du-confess.wav'],
  ['du', '路是我算出来的。价表，也是我传出去的。', '/assets/voice/du-confess.wav'],
];

const localVoiceAssets = new Map(
  voiceAssetEntries.map(([persona, text, asset]) => [`${persona}:${normalizeVoiceText(text)}`, asset]),
);

export function localVoiceAssetFor(text: string, persona: VoicePersona) {
  return localVoiceAssets.get(`${persona}:${normalizeVoiceText(text)}`);
}
