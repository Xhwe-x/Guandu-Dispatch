import type { CaoCaoAttitude } from '../../game/domain';

export interface AudienceChoice {
  id: string;
  tag: string;
  text: string;
  response: string;
  attitude: CaoCaoAttitude;
  playerVoice?: string;
  caocaoVoice?: string;
  requires?: 'route-channel';
}

export const firstAudienceRoundOne: AudienceChoice[] = [
  { id:'brief-cautious', tag:'稳妥', text:'臣已能解释伏击如何发生，但仍想把“查明”与“坐实”分开。', response:'能分清推断和铁证，才配碰军机。把链条说清。', attitude:'calm', playerVoice:'臣已能解释伏击如何发生，但仍想把查明与坐实分开。', caocaoVoice:'把链条说清。' },
  { id:'brief-key-fact', tag:'切要', text:'时辰从赵简处泄出，路线由杜衡从物资与道路迹象推出，碎片最终又在杜衡手中合流。', response:'这才像一条能解释三次伏击的链。说证据，不要只说名字。', attitude:'approving', playerVoice:'时辰与路线来自两条渠道，最终在杜衡手中合流。' },
  { id:'brief-apology', tag:'求证', text:'链条已经闭合，但臣请再用敌军行动反证一次，免得把推断当成定案。', response:'谨慎不是拖延。若你有办法让敌军自己作证，孤听你的。', attitude:'approving' },
  { id:'brief-accuse-zhao', tag:'冒进', text:'赵简既已泄露时辰，可先收押赵简，再顺势追查杜衡。', response:'收一个小吏容易。可若惊了真正会拼军情的人，你拿什么补这条线？', attitude:'displeased', caocaoVoice:'你拿什么补这条线？' },
];

export const firstAudienceRoundTwo: AudienceChoice[] = [
  { id:'brief-evidence-chain', tag:'据证', text:'口供与集合记录坐实时辰渠道；草料、车具、桥路与商价簿共同坐实杜衡的路线推断和传递能力。', response:'证据各管一段，拼起来才是军情。这个分法对。', attitude:'approving' },
  { id:'brief-coercion', tag:'分责', text:'赵简受胁泄时辰，杜衡主动拼合并传递。两人有责，却不是同一种责任。', response:'军法若只会找一个替死鬼，往后还会吃同样的亏。责任分开记。', attitude:'approving' },
  { id:'brief-deeper-probe', tag:'设局', text:'臣请按已查明的渠道分别投放假时辰、假路线与假规模，让袁军的行动替我们复核来源。', response:'这才是查活一条线。可以设局，但每一份饵只让对应的人看见。', attitude:'approving', caocaoVoice:'可以设局。' },
  { id:'brief-bait-proposal', tag:'收网', text:'证据已经足够，臣请立即收网，切断现有渠道。', response:'能抓人，不等于能证明你看懂了敌人的耳目。既然有机会反用，先让这条线再开一次口。', attitude:'calm', requires:'route-channel' },
];

export const finalAudienceChoices: AudienceChoice[] = [
  {
    id: 'final-close-network', tag: '收网', text: '敌军同时吃下假路线与假时辰，两条渠道已经互相印证，请主公准臣结案收网。',
    response: '能让敌军替你作证，才算把案子查活了。写清谁泄、谁拼、谁传，不许拿一个人顶掉整条线。', attitude: 'approving',
  },
  {
    id: 'final-differentiate', tag: '分责', text: '赵简受胁迫泄时辰，杜衡主动拼合传递。臣请在结案中区分责任与动机。',
    response: '军法要立，人心也要辨。把证据写足，孤看你的处置。', attitude: 'approving',
  },
  {
    id: 'final-exploit', tag: '反用', text: '渠道既已摸清，也可暂缓收网，继续喂入假情报，为后续粮运所用。',
    response: '胆子不小。能用敌耳目，自然比只会砍头强——前提是你控得住。把风险一并写进报告。', attitude: 'calm',
  },
];
