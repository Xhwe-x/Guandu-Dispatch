import type { BaitOption } from '../../game/domain';

export const baits: BaitOption[] = [
  { id: 'bait-lu-south', channel: 'lu', payload: '南线调用驿马', signal: 'southDispatch', requiredClaimIds: ['claim-lu-seal-order'], core: false },
  { id: 'bait-lu-priority', channel: 'lu', payload: '调高南渡通行优先级', signal: 'southPriority', requiredClaimIds: ['claim-lu-seal-order', 'claim-lu-ledger-change'], core: false },
  { id: 'bait-lu-seal', channel: 'lu', payload: '制造异常盖印顺序', signal: 'anomalousSeal', requiredClaimIds: ['claim-lu-seal-order'], core: false },
  { id: 'bait-zheng-12', channel: 'zheng', payload: '登记十二辆粮车', signal: '12', requiredClaimIds: ['claim-zheng-scale'], core: false },
  { id: 'bait-zheng-24', channel: 'zheng', payload: '登记二十四辆粮车', signal: '24', requiredClaimIds: ['claim-zheng-scale', 'claim-zheng-repair-change'], core: false },
  { id: 'bait-zheng-36', channel: 'zheng', payload: '登记三十六辆粮车', signal: '36', requiredClaimIds: ['claim-zheng-scale', 'claim-zheng-repair-change'], core: false },
  { id: 'bait-zhao-zi', channel: 'zhao', payload: '子时集合', signal: 'zi', requiredClaimIds: ['claim-zhao-time', 'claim-zhao-copied-order'], core: true },
  { id: 'bait-zhao-chou', channel: 'zhao', payload: '丑时家书', signal: 'chou', requiredClaimIds: ['claim-zhao-time', 'claim-zhao-coerced'], core: true },
  { id: 'bait-zhao-yin', channel: 'zhao', payload: '寅时集合', signal: 'yin', requiredClaimIds: ['claim-zhao-time', 'claim-zhao-copied-order'], core: true },
  { id: 'bait-du-south-ford', channel: 'du', payload: '制造南渡运输迹象', signal: 'southFord', requiredClaimIds: ['claim-south-ford-open', 'claim-du-fodder-pattern'], core: true },
  { id: 'bait-du-west-ridge', channel: 'du', payload: '制造西岭运输迹象', signal: 'westRidge', requiredClaimIds: ['claim-west-ridge-light', 'claim-du-wheel-question'], core: true },
  { id: 'bait-du-north-bridge', channel: 'du', payload: '制造北桥运输迹象', signal: 'northBridge', requiredClaimIds: ['claim-bridge-open', 'claim-du-wheel-question', 'claim-du-fodder-pattern'], core: true },
];
