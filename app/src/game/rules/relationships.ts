import type { GameContent, LogicSlot, RelationKind, Relationship } from '../domain';

export interface HypothesisScore {
  timeChannel: boolean;
  routeChannel: boolean;
  transmitter: boolean;
}

export type RelationshipValidation =
  | { ok: true }
  | { ok: false; reason: string };

const expectedSlotByKind: Partial<Record<RelationKind, LogicSlot>> = {
  sourceOf: 'source',
  accessedBy: 'actor',
  infers: 'method',
  transmitsTo: 'enemyConclusion',
};

/**
 * Scores the three stable links that make up the main leakage hypothesis.
 * The board may contain other links and does not need to match one layout.
 */
export function evaluateHypothesis(items: Relationship[]): HypothesisScore {
  return {
    timeChannel: items.some((r) => (
      r.fromId === 'claim-zhao-time'
      && r.toId === 'zhao'
      && r.kind === 'accessedBy'
      && r.slot === 'actor'
    )),
    routeChannel: items.some((r) => (
      r.fromId === 'claim-du-route'
      && r.toId === 'du'
      && r.kind === 'infers'
      && r.slot === 'method'
    )),
    transmitter: items.some((r) => (
      r.fromId === 'du'
      && r.toId === 'claim-shuoyuan-received'
      && r.kind === 'transmitsTo'
      && r.slot === 'enemyConclusion'
    )),
  };
}

/**
 * Validates one board link without changing the content or any game state.
 * Claims advertise the kinds of links they can originate through tags. The
 * receiver shape is checked as well so a valid tag cannot be attached to an
 * unrelated entity type.
 */
export function validateRelationship(
  content: GameContent,
  relation: Relationship,
): RelationshipValidation {
  const fromClaim = content.claims.find((claim) => claim.id === relation.fromId);
  const toClaim = content.claims.find((claim) => claim.id === relation.toId);
  const fromCharacter = content.characters.some((character) => character.id === relation.fromId);
  const toCharacter = content.characters.some((character) => character.id === relation.toId);
  const toDocument = content.documents.some((document) => document.id === relation.toId);

  if (!fromClaim && !fromCharacter) {
    return { ok: false, reason: '证据不存在' };
  }
  if (!toClaim && !toCharacter && !toDocument) {
    return { ok: false, reason: '证据不存在' };
  }

  const expectedSlot = expectedSlotByKind[relation.kind];
  if (expectedSlot && relation.slot !== expectedSlot) {
    return { ok: false, reason: '逻辑槽位不匹配' };
  }

  const relationIsAllowed = (() => {
    switch (relation.kind) {
      case 'supports':
      case 'refutes':
        return Boolean(
          fromClaim
          && toClaim
          && fromClaim.tags.includes(relation.kind),
        );
      case 'sourceOf':
        return Boolean(
          fromClaim
          && toDocument
          && fromClaim.tags.includes('source'),
        );
      case 'accessedBy':
        return Boolean(
          fromClaim
          && toCharacter
          && fromClaim.tags.includes('actor'),
        );
      case 'infers':
        return Boolean(
          fromClaim
          && toCharacter
          && fromClaim.tags.includes('method'),
        );
      case 'transmitsTo':
        return Boolean(
          fromCharacter
          && toClaim
          && toClaim.tags.includes('enemyConclusion'),
        );
    }
  })();

  if (!relationIsAllowed) {
    return { ok: false, reason: '关系类型不合法' };
  }

  const targetIsAllowed = content.relationshipPermissions.some((permission) => (
    permission.fromId === relation.fromId
    && permission.toId === relation.toId
    && permission.kind === relation.kind
    && permission.slot === relation.slot
  ));

  return targetIsAllowed
    ? { ok: true }
    : { ok: false, reason: '关系目标不允许' };
}
