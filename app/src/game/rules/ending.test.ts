import { describe, expect, it } from 'vitest';
import type { ReportSubmission } from '../domain';
import { minimalContent } from '../fixtures';
import { composeEpilogue } from './ending';
import { evaluateReport } from './report';

const correctReport: ReportSubmission = {
  leakedInfo: ['departureTime', 'route'],
  sourceCharacterIds: ['zhao', 'du'],
  integratorId: 'du',
  transmissionMethod: 'priceCipher',
  evidenceClaimIds: [
    'claim-zhao-copied-order',
    'claim-du-route',
    'claim-price-cipher',
    'claim-zhao-coerced',
  ],
  handling: 'differentiate',
};

const personStates = {
  lu: 'cooperative' as const,
  zheng: 'guarded' as const,
  zhao: 'cooperative' as const,
  du: 'hostile' as const,
};

describe('composeEpilogue', () => {
  it.each(['canghe', 'shuoyuan', 'lishe', 'destroyed'] as const)(
    'truth owner %s does not rewrite the action outcome',
    (owner) => {
      const ending = composeEpilogue(minimalContent, {
        owner,
        report: evaluateReport(correctReport, 'noneCore'),
        personStates,
      });

      expect(ending.outcome).toBe('ambushedAgain');
      expect(ending.paragraphs).toHaveLength(7);
    },
  );

  it('orders the seven resolved fragments as action, owner, Lu, Zheng, Zhao, Du, and player', () => {
    const ending = composeEpilogue(minimalContent, {
      owner: 'lishe',
      report: evaluateReport(correctReport, 'bothCore'),
      personStates,
    });

    expect(ending.paragraphs).toEqual([
      '封网成功。',
      '真相交给官渡里社。',
      '陆淳受里社保护。',
      '郑禾洗清通敌嫌疑。',
      '赵简的胁迫事实得到确认。',
      '杜衡的暗号渠道被识破。',
      '玩家站在官渡里社一边。',
    ]);
  });

  it('fails clearly when a required epilogue fragment is absent', () => {
    const { 'du.identified': _identified, ...epilogueFragments } = minimalContent.epilogueFragments;

    expect(() => composeEpilogue(
      { ...minimalContent, epilogueFragments },
      { owner: 'canghe', report: evaluateReport(correctReport, 'bothCore'), personStates },
    )).toThrow('Missing epilogue fragment: du.identified');
  });
});
