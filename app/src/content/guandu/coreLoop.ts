import type { CaseObjective, EvidenceReaction, GuidanceCue, TheoryNode } from '../../game/domain';

export const guanduObjectives: CaseObjective[] = [
  { id:'objective-time-leak', title:'时辰从哪里泄露？', question:'谁接触并泄露了粮队集合时辰？', requiredKnowledgeIds:['claim-zhao-time'], optionalKnowledgeIds:['claim-zhao-copied-order','claim-zhao-denial'], completion:'all-required-supported', nextObjectiveId:'objective-route-leak' },
  { id:'objective-route-leak', title:'路线从哪里产生？', question:'敌军如何在没有完整军令的情况下得到具体路线？', requiredKnowledgeIds:['claim-du-fodder-pattern','claim-du-route'], optionalKnowledgeIds:['claim-bridge-open','claim-south-ford-open','claim-west-ridge-light'], completion:'all-required-supported', nextObjectiveId:'objective-integration' },
  { id:'objective-integration', title:'碎片在哪里被拼合？', question:'谁把草料、车辆、道路等碎片拼成可用军情？', requiredKnowledgeIds:['claim-du-route','claim-price-cipher'], optionalKnowledgeIds:['claim-du-fodder-pattern','claim-du-wheel-question'], completion:'all-required-supported', nextObjectiveId:'objective-transmission' },
  { id:'objective-transmission', title:'军情如何送到袁军？', question:'拼合后的路线与时辰通过什么方式送到敌军？', requiredKnowledgeIds:['claim-price-cipher','claim-shuoyuan-received'], optionalKnowledgeIds:[], completion:'all-required-supported', nextObjectiveId:'objective-counterintel' },
  { id:'objective-counterintel', title:'利用已知渠道设局', question:'怎样构造一组能验证泄密链的假情报？', requiredKnowledgeIds:[], optionalKnowledgeIds:[], completion:'theory-supported', nextObjectiveId:'objective-verify-network' },
  { id:'objective-verify-network', title:'让敌军替你验证', question:'敌军回声是否真正验证了赵简与杜衡这条泄密链？', requiredKnowledgeIds:[], optionalKnowledgeIds:[], completion:'theory-verified' },
];

export const guanduEvidenceReactions: EvidenceReaction[] = [
  { id:'reaction-zhao-time-record', characterId:'zhao', evidenceClaimId:'claim-zhao-time', response:'这份誊本……确实经我手。时辰，也是我泄出去的。', reaction:'breakthrough', revealClaimIds:['claim-zhao-time'], knowledgeUpdates:[{knowledgeId:'claim-zhao-time',status:'supported'}] },
  { id:'reaction-zhao-copied-order', characterId:'zhao', evidenceClaimId:'claim-zhao-copied-order', response:'这份誊本……确实经我手。时辰，也是我泄出去的。', reaction:'breakthrough', revealClaimIds:['claim-zhao-time'], knowledgeUpdates:[{knowledgeId:'claim-zhao-copied-order',status:'supported'},{knowledgeId:'claim-zhao-time',status:'supported'}] },
  { id:'reaction-zhao-price-irrelevant', characterId:'zhao', evidenceClaimId:'claim-price-cipher', response:'此物与军书房何干？我从未碰过商价簿。', reaction:'irrelevant', revealClaimIds:[], knowledgeUpdates:[] },
  { id:'reaction-zhao-denial-irrelevant', characterId:'zhao', evidenceClaimId:'claim-zhao-denial', response:'这份口供是我自己说的。它只能说明我不知道，说明不了我有没有泄。', reaction:'irrelevant', revealClaimIds:[], knowledgeUpdates:[] },
  { id:'reaction-lu-ledger', characterId:'lu', evidenceClaimId:'claim-lu-ledger-change', response:'粮册是我改的。但那是私挪粮食救人，与路线、时辰无关。', reaction:'contradicted', revealClaimIds:['claim-lu-no-time','claim-lu-relief-motive'], knowledgeUpdates:[{knowledgeId:'claim-lu-ledger-change',status:'supported'},{knowledgeId:'claim-lu-no-time',status:'supported'}] },
  { id:'reaction-zheng-repair', characterId:'zheng', evidenceClaimId:'claim-zheng-repair-change', response:'车损记录是我改的。我怕担责，可路线核定前我就离开了调度房。', reaction:'contradicted', revealClaimIds:['claim-zheng-no-route'], knowledgeUpdates:[{knowledgeId:'claim-zheng-repair-change',status:'supported'},{knowledgeId:'claim-zheng-no-route',status:'supported'}] },
  { id:'reaction-du-price-breakthrough', characterId:'du', evidenceClaimId:'claim-price-cipher', requiredKnowledgeIds:['claim-du-fodder-pattern'], response:'路是我算出来的。价表……也是我传出去的。', reaction:'breakthrough', revealClaimIds:['claim-du-route'], knowledgeUpdates:[{knowledgeId:'claim-du-route',status:'supported'},{knowledgeId:'claim-price-cipher',status:'supported'}] },
  { id:'reaction-du-fodder-guarded', characterId:'du', evidenceClaimId:'claim-du-fodder-pattern', response:'草料数量人人都能看见。知道有二十四辆重车，不等于知道军令。', reaction:'guarded', revealClaimIds:[], knowledgeUpdates:[{knowledgeId:'claim-du-fodder-pattern',status:'supported'}] },
];

export const guanduGuidanceCues: GuidanceCue[] = [
  { id:'cue-time-evidence-unused', objectiveId:'objective-time-leak', trigger:'unused-evidence', level1:'赵简的口供里还有一处没有被文书核实。', level2:'重新看集合文书与赵简的誊写权限，重点比较“是否接触时辰”。', level3:'把赵简相关的集合时辰证据带去质证，检查他“不知道时辰”的说法。', relatedPersonIds:['zhao'], relatedDocumentIds:['statement-zhao'] },
  { id:'cue-route-gap', objectiveId:'objective-route-leak', trigger:'new-gap', level1:'你已经能解释时辰外泄，但具体路线仍没有来源。', level2:'杜衡没有军令权限，却长期接触车马、草料和道路信息。', level3:'回看邮舍出入簿、北桥修治牍和粮道图牍，再用商价簿去质证杜衡。', relatedPersonIds:['du'], relatedDocumentIds:['station-entry','repair-north-bridge','route-map','trade-prices'] },
  { id:'cue-transmitter-gap', objectiveId:'objective-transmission', trigger:'new-gap', level1:'路线已经能被推出，但还缺“军情怎样离开曹营”这一环。', level2:'找一份既能容纳路线，又能容纳时辰的营外记录。', level3:'检查杜衡商价簿的异常尾数与地支序号，它们可能不是普通价格。', relatedPersonIds:['du'], relatedDocumentIds:['trade-prices'] },
  { id:'cue-invalid-theory', objectiveId:'objective-route-leak', trigger:'invalid-theory', level1:'当前理论解释了一部分伏击，但还有一条信息没有来源。', level2:'不要把“撒谎”直接等同于“泄密”，看每个人真正接触了什么。', level3:'赵简负责时辰；路线需要从草料、车辆和道路碎片中另找来源。', relatedPersonIds:['zhao','du'], relatedDocumentIds:['statement-zhao','station-entry','route-map'] },
  { id:'cue-counterintel-ready', objectiveId:'objective-counterintel', trigger:'manual', level1:'泄密链已经足够完整，可以开始利用它。', level2:'核心验证应分别针对“时辰渠道”和“路线/传递渠道”。', level3:'给赵简渠道放假时辰，再给杜衡渠道放能改变路线判断的假物流信息。', relatedPersonIds:['zhao','du'], relatedDocumentIds:[] },
];

export const guanduTheoryNodes: TheoryNode[] = [
  { id:'info-time',kind:'information',sourceId:'claim-zhao-time',label:'集合时辰' },
  { id:'person-zhao',kind:'person',sourceId:'zhao',label:'赵简' },
  { id:'person-lu',kind:'person',sourceId:'lu',label:'陆淳' },
  { id:'person-zheng',kind:'person',sourceId:'zheng',label:'郑禾' },
  { id:'info-route-fragments',kind:'information',sourceId:'claim-du-fodder-pattern',label:'物流碎片' },
  { id:'person-du',kind:'person',sourceId:'du',label:'杜衡' },
  { id:'method-price-cipher',kind:'method',sourceId:'claim-price-cipher',label:'价格暗号' },
  { id:'enemy-yuan',kind:'enemy',sourceId:'claim-shuoyuan-received',label:'袁军' },
];

export function objectiveById(id:string){ return guanduObjectives.find((item)=>item.id===id); }
export function reactionsForCharacter(characterId:string){ return guanduEvidenceReactions.filter((item)=>item.characterId===characterId); }
