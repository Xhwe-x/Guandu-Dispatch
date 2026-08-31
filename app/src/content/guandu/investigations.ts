import type { Investigation } from '../../game/domain';

export const investigations: Investigation[] = [
  { id: 'investigate-handwriting', title: '核对集合命令笔迹', cost: 1, revealClaimIds: ['claim-zhao-copied-order'] },
  { id: 'investigate-du-records', title: '深查杜衡采购与价格记录', cost: 1, revealClaimIds: ['claim-du-fodder-pattern', 'claim-price-cipher'] },
  { id: 'investigate-north-bridge', title: '复查北桥承重', cost: 1, revealClaimIds: ['claim-bridge-open'] },
  { id: 'investigate-zhao-family', title: '查询赵简家人', cost: 1, revealClaimIds: ['claim-zhao-coerced'] },
  { id: 'investigate-ambush-site', title: '勘验北桥伏击点', cost: 1, revealClaimIds: ['claim-ambush-north', 'claim-no-full-order'] },
  { id: 'investigate-deep-du', title: '追查杜衡在驿站的问询', cost: 1, revealClaimIds: ['claim-du-wheel-question', 'claim-price-cipher'] },
];
