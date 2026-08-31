import { describe, expect, it } from 'vitest';
import type { ReportSubmission } from '../domain';
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

describe('evaluateReport', () => {
  it('closes the network for the fully evidenced fixed chain after two credible core baits', () => {
    expect(evaluateReport(correctReport, 'bothCore')).toMatchObject({
      leakedInfoCorrect: true,
      evidenceSufficient: true,
      timeSourceCorrect: true,
      routeSourceCorrect: true,
      integratorCorrect: true,
      methodCorrect: true,
      coercionEstablished: true,
      falselyAccused: [],
      outcome: 'networkClosed',
    });
  });

  it('marks the report incomplete when the departure-time information is missing', () => {
    const result = evaluateReport({ ...correctReport, leakedInfo: ['route'] }, 'bothCore');

    expect(result.leakedInfoCorrect).toBe(false);
    expect(result.outcome).toBe('convoySavedIncomplete');
  });

  it('marks the report incomplete when the route information is missing', () => {
    const result = evaluateReport({ ...correctReport, leakedInfo: ['departureTime'] }, 'bothCore');

    expect(result.leakedInfoCorrect).toBe(false);
    expect(result.outcome).toBe('convoySavedIncomplete');
  });

  it('marks the report incomplete without time evidence', () => {
    const result = evaluateReport({
      ...correctReport,
      evidenceClaimIds: ['claim-du-route', 'claim-price-cipher', 'claim-zhao-coerced'],
    }, 'bothCore');

    expect(result.evidenceSufficient).toBe(false);
    expect(result.outcome).toBe('convoySavedIncomplete');
  });

  it('accepts either copied-order or time as the time evidence', () => {
    const result = evaluateReport({
      ...correctReport,
      evidenceClaimIds: ['claim-zhao-time', 'claim-du-route', 'claim-price-cipher', 'claim-zhao-coerced'],
    }, 'bothCore');

    expect(result.evidenceSufficient).toBe(true);
    expect(result.outcome).toBe('networkClosed');
  });

  it('marks the report incomplete without route evidence', () => {
    const result = evaluateReport({
      ...correctReport,
      evidenceClaimIds: ['claim-zhao-copied-order', 'claim-price-cipher', 'claim-zhao-coerced'],
    }, 'bothCore');

    expect(result.evidenceSufficient).toBe(false);
    expect(result.outcome).toBe('convoySavedIncomplete');
  });

  it('marks the report incomplete without transmission evidence', () => {
    const result = evaluateReport({
      ...correctReport,
      evidenceClaimIds: ['claim-zhao-copied-order', 'claim-du-route', 'claim-zhao-coerced'],
    }, 'bothCore');

    expect(result.evidenceSufficient).toBe(false);
    expect(result.outcome).toBe('convoySavedIncomplete');
  });

  it('flags Lu and Zheng when they are named as core leakers', () => {
    const result = evaluateReport({ ...correctReport, sourceCharacterIds: ['lu', 'zheng'] }, 'bothCore');

    expect(result.falselyAccused).toEqual(['lu', 'zheng']);
    expect(result.outcome).toBe('convoySavedIncomplete');
  });

  it('lists each falsely accused person once in first-occurrence order', () => {
    const result = evaluateReport({
      ...correctReport,
      sourceCharacterIds: ['lu', 'lu', 'zheng', 'zheng'],
    }, 'bothCore');

    expect(result.falselyAccused).toEqual(['lu', 'zheng']);
    expect(result.outcome).toBe('convoySavedIncomplete');
  });

  it('cannot repair a failed bait operation with a correct report', () => {
    expect(evaluateReport(correctReport, 'noneCore').outcome).toBe('ambushedAgain');
  });

  it('caps a correct report at an incomplete save after one credible core bait', () => {
    expect(evaluateReport(correctReport, 'oneCore').outcome).toBe('convoySavedIncomplete');
  });
});
