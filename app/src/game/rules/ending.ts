import type { ActionOutcome, GameContent, PersonState, TruthOwner } from '../domain';
import type { ReportEvaluation } from './report';

export interface Epilogue {
  outcome: ActionOutcome;
  owner: TruthOwner;
  paragraphs: [string, string, string, string, string, string, string];
}

export interface EpilogueInput {
  owner: TruthOwner;
  report: ReportEvaluation;
  personStates: Record<string, PersonState>;
}

export function composeEpilogue(content: GameContent, input: EpilogueInput): Epilogue {
  const fragment = (key: string): string => {
    const value = content.epilogueFragments[key];
    if (!value) {
      throw new Error(`Missing epilogue fragment: ${key}`);
    }
    return value;
  };

  return {
    outcome: input.report.outcome,
    owner: input.owner,
    paragraphs: [
      fragment(`outcome.${input.report.outcome}`),
      fragment(`owner.${input.owner}`),
      fragment(`lu.${input.owner}`),
      fragment(`zheng.${input.report.falselyAccused.includes('zheng') ? 'accused' : 'cleared'}`),
      fragment(`zhao.${input.report.coercionEstablished ? 'coerced' : 'traitor'}`),
      fragment(`du.${input.report.methodCorrect ? 'identified' : 'escaped'}`),
      fragment(`player.${input.owner}`),
    ],
  };
}
