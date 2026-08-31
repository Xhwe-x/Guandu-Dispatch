import { validateGameContent } from '../../game/contentSchema';
import { baits } from './baits';
import { characters } from './characters';
import { claims } from './claims';
import { documents } from './documents';
import { epilogueFragments } from './endings';
import { hints } from './hints';
import { interrogations } from './interrogations';
import { investigations } from './investigations';
import { relationshipPermissions } from './relationshipPermissions';

export const guanduCase = validateGameContent({
  id: 'guandu',
  characters,
  documents,
  claims,
  investigations,
  interrogations,
  baits,
  relationshipPermissions,
  hints,
  epilogueFragments,
});

export {
  guanduEvidenceReactions,
  guanduGuidanceCues,
  guanduObjectives,
  guanduTheoryNodes,
  objectiveById,
  reactionsForCharacter,
} from './coreLoop';
