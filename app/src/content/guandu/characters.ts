import type { Character } from '../../game/domain';

export const characters: Character[] = [
  {
    id: 'lu',
    name: '陆淳',
    role: '邮驿主吏',
    access: ['ledger', 'seal', 'horseDispatch'],
    secret: '挪用少量军粮救济村民并修改数量',
    responsibility: '违法但未通敌',
  },
  {
    id: 'zheng',
    name: '郑禾',
    role: '军粮书佐',
    access: ['convoyScale', 'wagonDamage'],
    secret: '修改车辆维修记录掩盖失误',
    responsibility: '撒谎但未泄露核心情报',
  },
  {
    id: 'zhao',
    name: '赵简',
    role: '军书佐',
    access: ['departureTime'],
    secret: '家人受胁迫',
    responsibility: '向杜衡泄露出发时辰',
  },
  {
    id: 'du',
    name: '杜衡',
    role: '营外行商',
    access: ['fodder', 'wheel', 'bridge', 'tradeRoute'],
    secret: '使用价格表暗号',
    responsibility: '推断路线、拼合并传递情报',
  },
];
