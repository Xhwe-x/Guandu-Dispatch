import { describe, expect, it } from 'vitest';
import { guanduCase } from './index';
import { guanduCharacterTaskLinks } from './taskLinks';

describe('character task links', () => {
  it('binds every core person to documents, claims, suspicion and a next action', () => {
    const characterIds = new Set(guanduCase.characters.map((item) => item.id));
    const documentIds = new Set(guanduCase.documents.map((item) => item.id));
    const claimIds = new Set(guanduCase.claims.map((item) => item.id));

    expect(guanduCharacterTaskLinks).toHaveLength(4);
    for (const link of guanduCharacterTaskLinks) {
      expect(characterIds.has(link.characterId)).toBe(true);
      expect(link.documentIds.every((id) => documentIds.has(id))).toBe(true);
      expect(link.claimIds.every((id) => claimIds.has(id))).toBe(true);
      expect(link.suspicion.length).toBeGreaterThan(0);
      expect(link.nextAction.length).toBeGreaterThan(0);
    }
  });
});
