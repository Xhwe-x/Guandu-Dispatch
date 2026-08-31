import type { AudioCueId } from '../audio/audioCues';
import { DialogueChoiceList } from '../../ui/game/DialogueChoiceList';
export interface ChoiceStripOption { id:string; tag?:string; text:string; detail?:string; disabled?:boolean; lockedReason?:string; danger?:boolean; }
interface ChoiceStripProps { options:ChoiceStripOption[]; onChoose:(id:string)=>void; ariaLabel?:string; audioCue?:AudioCueId; }
export function ChoiceStrip({ options,onChoose,ariaLabel='对话选择' }:ChoiceStripProps){ return <DialogueChoiceList choices={options} onChoose={onChoose} ariaLabel={ariaLabel}/>; }
