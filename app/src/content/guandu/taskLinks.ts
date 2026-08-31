export interface CharacterTaskLink {
  characterId: 'lu' | 'zheng' | 'zhao' | 'du';
  documentIds: string[];
  claimIds: string[];
  title: string;
  suspicion: string;
  verifiedResponsibility: string;
  nextAction: string;
}

export const guanduCharacterTaskLinks: CharacterTaskLink[] = [
  {
    characterId: 'zhao',
    documentIds: ['statement-zhao', 'report-ambush'],
    claimIds: ['claim-zhao-denial', 'claim-zhao-copied-order', 'claim-zhao-time', 'claim-zhao-coerced'],
    title: '赵简 · 军书权限与时辰渠道',
    suspicion: '口供否认知道集合时辰，却亲笔誊抄集合命令。',
    verifiedResponsibility: '向杜衡泄露出发时辰；家人受胁迫，责任与动机必须分开判断。',
    nextAction: '核军书权限 → 比笔迹 → 以集合文书质证 → 查家书与受胁迫背景',
  },
  {
    characterId: 'lu',
    documentIds: ['ledger-original', 'ledger-revised', 'statement-lu'],
    claimIds: ['claim-lu-ledger-change', 'claim-lu-no-time', 'claim-lu-relief-motive'],
    title: '陆淳 · 封检与邮书流程疑点',
    suspicion: '两版粮册数字不一致，陆淳又否认改册。',
    verifiedResponsibility: '改册救济村民，违法但没有掌握最终路线与时辰。',
    nextAction: '核封检与邮书经手 → 比两版粮册 → 以改册对质 → 区分撒谎与通敌',
  },
  {
    characterId: 'zheng',
    documentIds: ['repair-wagons', 'statement-zheng'],
    claimIds: ['claim-zheng-repair-change', 'claim-zheng-scale', 'claim-zheng-no-route'],
    title: '郑禾 · 车马簿与粮秣疑点',
    suspicion: '维修记录被改写，车辆规模信息经他之手。',
    verifiedResponsibility: '掩盖车辆维修失误，但路线核定前已离开调度房。',
    nextAction: '核车马簿与维修记录 → 对质改册 → 判断他是否越过军粮书佐权限接触核心路线',
  },
  {
    characterId: 'du',
    documentIds: ['station-entry', 'trade-prices', 'route-map', 'statement-du'],
    claimIds: ['claim-du-fodder-pattern', 'claim-price-cipher', 'claim-du-route', 'claim-du-denial'],
    title: '杜衡 · 营外物流与传递渠道',
    suspicion: '没有完整军令，却持续询问草料、车轮与商路。',
    verifiedResponsibility: '从零散物流迹象推断路线，并以价格暗号拼合、传递军情。',
    nextAction: '查营外物流、出入簿与商路 → 深查价格暗号 → 反向投饵验证',
  },
];

export function taskLinkForCharacter(characterId: string) {
  return guanduCharacterTaskLinks.find((item) => item.characterId === characterId);
}
