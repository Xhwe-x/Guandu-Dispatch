import type { ActionOutcome, BaitBand, ReportSubmission } from '../domain';

export interface ReportEvaluation {
  leakedInfoCorrect: boolean;
  evidenceSufficient: boolean;
  timeSourceCorrect: boolean;
  routeSourceCorrect: boolean;
  integratorCorrect: boolean;
  methodCorrect: boolean;
  coercionEstablished: boolean;
  falselyAccused: string[];
  outcome: ActionOutcome;
}

export function evaluateReport(report: ReportSubmission, baitBand: BaitBand): ReportEvaluation {
  const leakedInfoCorrect = report.leakedInfo.includes('departureTime') && report.leakedInfo.includes('route');
  const timeEvidencePresent = report.evidenceClaimIds.includes('claim-zhao-copied-order')
    || report.evidenceClaimIds.includes('claim-zhao-time');
  const routeEvidencePresent = report.evidenceClaimIds.includes('claim-du-route');
  const transmissionEvidencePresent = report.evidenceClaimIds.includes('claim-price-cipher');
  const evidenceSufficient = timeEvidencePresent && routeEvidencePresent && transmissionEvidencePresent;
  const timeSourceCorrect = report.sourceCharacterIds.includes('zhao');
  const routeSourceCorrect = report.sourceCharacterIds.includes('du');
  const integratorCorrect = report.integratorId === 'du';
  const methodCorrect = report.transmissionMethod === 'priceCipher';
  const coercionEstablished = report.evidenceClaimIds.includes('claim-zhao-coerced');
  const falselyAccused = [...new Set(report.sourceCharacterIds.filter((id) => id === 'lu' || id === 'zheng'))];
  const complete = leakedInfoCorrect
    && evidenceSufficient
    && timeSourceCorrect
    && routeSourceCorrect
    && integratorCorrect
    && methodCorrect
    && falselyAccused.length === 0;
  const outcome: ActionOutcome = baitBand === 'noneCore'
    ? 'ambushedAgain'
    : baitBand === 'bothCore' && complete
      ? 'networkClosed'
      : 'convoySavedIncomplete';

  return {
    leakedInfoCorrect,
    evidenceSufficient,
    timeSourceCorrect,
    routeSourceCorrect,
    integratorCorrect,
    methodCorrect,
    coercionEstablished,
    falselyAccused,
    outcome,
  };
}
