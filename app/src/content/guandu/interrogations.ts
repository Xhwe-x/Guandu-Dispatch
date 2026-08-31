import type { InterrogationRule } from '../../game/domain';

export const interrogations: InterrogationRule[] = [
  {
    id: 'interrogate-lu-ledger',
    characterId: 'lu',
    statementClaimId: 'claim-lu-denial',
    evidenceClaimId: 'claim-lu-ledger-change',
    revealClaimIds: ['claim-lu-relief-motive', 'claim-lu-no-time'],
    responseKeys: {
      calm: 'lu.ledger.calm',
      threaten: 'lu.ledger.threaten',
      empathize: 'lu.ledger.empathize',
      misdirect: 'lu.ledger.misdirect',
    },
  },
  {
    id: 'interrogate-zheng-repair',
    characterId: 'zheng',
    statementClaimId: 'claim-zheng-denial',
    evidenceClaimId: 'claim-zheng-repair-change',
    revealClaimIds: ['claim-zheng-no-route'],
    responseKeys: {
      calm: 'zheng.repair.calm',
      threaten: 'zheng.repair.threaten',
      empathize: 'zheng.repair.empathize',
      misdirect: 'zheng.repair.misdirect',
    },
  },
  {
    id: 'interrogate-zhao-time',
    characterId: 'zhao',
    statementClaimId: 'claim-zhao-denial',
    evidenceClaimId: 'claim-zhao-copied-order',
    revealClaimIds: ['claim-zhao-time'],
    responseKeys: {
      calm: 'zhao.time.calm',
      threaten: 'zhao.time.threaten',
      empathize: 'zhao.time.empathize',
      misdirect: 'zhao.time.misdirect',
    },
  },
  {
    id: 'interrogate-du-cipher',
    characterId: 'du',
    statementClaimId: 'claim-du-denial',
    evidenceClaimId: 'claim-price-cipher',
    revealClaimIds: ['claim-du-route', 'claim-shuoyuan-received'],
    responseKeys: {
      calm: 'du.cipher.calm',
      threaten: 'du.cipher.threaten',
      empathize: 'du.cipher.empathize',
      misdirect: 'du.cipher.misdirect',
    },
  },
];
