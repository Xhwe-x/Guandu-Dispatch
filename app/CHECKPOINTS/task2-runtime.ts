import { guanduEvidenceReactions, guanduGuidanceCues, guanduObjectives } from '../src/content/guandu/coreLoop';
const ids=guanduObjectives.map((item)=>item.id).join('|');
if(ids!=='objective-time-leak|objective-route-leak|objective-integration|objective-transmission|objective-counterintel|objective-verify-network') throw new Error('objective order failed');
if(!guanduEvidenceReactions.some((item)=>item.characterId==='du'&&item.reaction==='breakthrough')) throw new Error('du reaction missing');
if(!guanduGuidanceCues.every((cue)=>cue.level1&&cue.level2&&cue.level3)) throw new Error('guidance levels missing');
console.log('task2 runtime PASS');
