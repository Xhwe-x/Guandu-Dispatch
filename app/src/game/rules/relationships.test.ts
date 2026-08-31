import { describe, expect, it } from 'vitest';
import { guanduCase } from '../../content/guandu';
import { minimalContent } from '../fixtures';
import type { Relationship } from '../domain';
import { evaluateHypothesis, validateRelationship } from './relationships';

describe('relationship rules', () => {
  it('recognizes the fixed Zhao + Du chain without requiring a unique layout', () => {
    const score = evaluateHypothesis([
      { fromId: 'claim-zhao-time', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
      { fromId: 'claim-du-route', toId: 'du', kind: 'infers', slot: 'method' },
      { fromId: 'du', toId: 'claim-shuoyuan-received', kind: 'transmitsTo', slot: 'enemyConclusion' },
    ]);
    expect(score).toEqual({ timeChannel: true, routeChannel: true, transmitter: true });
  });

  it('requires the fixed chain links to use their declared relation kind and slot', () => {
    const score = evaluateHypothesis([
      { fromId: 'claim-zhao-time', toId: 'zhao', kind: 'supports', slot: 'actor' },
      { fromId: 'claim-du-route', toId: 'du', kind: 'infers', slot: 'actor' },
      { fromId: 'du', toId: 'claim-shuoyuan-received', kind: 'transmitsTo', slot: 'enemyConclusion' },
    ]);
    expect(score).toEqual({ timeChannel: false, routeChannel: false, transmitter: true });
  });

  it('ignores unrelated cards while recognizing every correctly formed fixed link', () => {
    const score = evaluateHypothesis([
      { fromId: 'claim-zhao-denial', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
      { fromId: 'claim-zhao-time', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
      { fromId: 'claim-du-route', toId: 'du', kind: 'infers', slot: 'method' },
      { fromId: 'du', toId: 'claim-shuoyuan-received', kind: 'transmitsTo', slot: 'enemyConclusion' },
    ]);
    expect(score).toEqual({ timeChannel: true, routeChannel: true, transmitter: true });
  });

  it('rejects a missing entity without deleting the card', () => {
    expect(validateRelationship(minimalContent, {
      fromId: 'missing', toId: 'zhao', kind: 'supports', slot: 'actor',
    })).toEqual({ ok: false, reason: '证据不存在' });
  });

  it('rejects a relation whose kind is not allowed by the claim tags', () => {
    expect(validateRelationship(minimalContent, {
      fromId: 'claim-zhao-time', toId: 'zhao', kind: 'supports', slot: 'actor',
    })).toEqual({ ok: false, reason: '关系类型不合法' });
  });

  it('rejects a relation whose slot does not match its relation kind', () => {
    expect(validateRelationship(minimalContent, {
      fromId: 'claim-zhao-time', toId: 'zhao', kind: 'accessedBy', slot: 'method',
    })).toEqual({ ok: false, reason: '逻辑槽位不匹配' });
  });

  it('accepts a relation whose kind and target shape match the claim tags', () => {
    const relation: Relationship = {
      fromId: 'claim-zhao-copied-order',
      toId: 'claim-zhao-denial',
      kind: 'refutes',
      slot: 'leakedInfo',
    };
    expect(validateRelationship(minimalContent, relation)).toEqual({ ok: true });
  });

  it('rejects an otherwise valid accessedBy link to an unapproved character', () => {
    expect(validateRelationship(minimalContent, {
      fromId: 'claim-zhao-copied-order',
      toId: 'du',
      kind: 'accessedBy',
      slot: 'actor',
    })).toEqual({ ok: false, reason: '关系目标不允许' });
  });

  it('rejects an otherwise valid refutation of an unapproved denial', () => {
    expect(validateRelationship(guanduCase, {
      fromId: 'claim-zhao-copied-order',
      toId: 'claim-lu-denial',
      kind: 'refutes',
      slot: 'leakedInfo',
    })).toEqual({ ok: false, reason: '关系目标不允许' });
  });

  it('rejects Du transmitting to an unapproved enemy conclusion', () => {
    const content = structuredClone(minimalContent);
    content.claims.find((claim) => claim.id === 'claim-du-route')!.tags.push('enemyConclusion');
    expect(validateRelationship(content, {
      fromId: 'du',
      toId: 'claim-du-route',
      kind: 'transmitsTo',
      slot: 'enemyConclusion',
    })).toEqual({ ok: false, reason: '关系目标不允许' });
  });

  it('rejects a transmission to a claim without an enemy conclusion tag', () => {
    expect(validateRelationship(minimalContent, {
      fromId: 'du', toId: 'claim-du-route', kind: 'transmitsTo', slot: 'enemyConclusion',
    })).toEqual({ ok: false, reason: '关系类型不合法' });
  });
});
