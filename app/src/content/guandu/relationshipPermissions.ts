import type { Relationship } from '../../game/domain';

export const relationshipPermissions: Relationship[] = [
  { fromId: 'claim-zhao-time', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
  { fromId: 'claim-du-route', toId: 'du', kind: 'infers', slot: 'method' },
  { fromId: 'du', toId: 'claim-shuoyuan-received', kind: 'transmitsTo', slot: 'enemyConclusion' },
  { fromId: 'claim-zhao-copied-order', toId: 'claim-zhao-denial', kind: 'refutes', slot: 'leakedInfo' },
  { fromId: 'claim-zhao-copied-order', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
  { fromId: 'claim-lu-ledger-change', toId: 'claim-lu-denial', kind: 'refutes', slot: 'leakedInfo' },
  { fromId: 'claim-zheng-repair-change', toId: 'claim-zheng-denial', kind: 'refutes', slot: 'leakedInfo' },
  { fromId: 'claim-price-cipher', toId: 'claim-du-denial', kind: 'refutes', slot: 'leakedInfo' },
  { fromId: 'claim-zhao-copied-order', toId: 'claim-zhao-time', kind: 'supports', slot: 'actor' },
  { fromId: 'claim-zhao-coerced', toId: 'claim-zhao-time', kind: 'supports', slot: 'source' },
  { fromId: 'claim-du-fodder-pattern', toId: 'claim-du-route', kind: 'supports', slot: 'method' },
  { fromId: 'claim-du-wheel-question', toId: 'claim-du-route', kind: 'supports', slot: 'method' },
  { fromId: 'claim-bridge-open', toId: 'claim-du-route', kind: 'supports', slot: 'method' },
  { fromId: 'claim-ambush-north', toId: 'claim-du-route', kind: 'supports', slot: 'enemyConclusion' },
  { fromId: 'claim-price-cipher', toId: 'claim-shuoyuan-received', kind: 'supports', slot: 'enemyConclusion' },
];
