import type { StorySceneData } from '../../game/storyTypes';

export const guanduStoryScenes: readonly StorySceneData[] = [
  {
    id: 'prologue-background', sceneId: 'opening', cgId: 'cg_intro_aftermath',
    beats: [
      { type:'narration', id:'bg-guan-du', text:'建安五年。曹袁相持于官渡，胜负悬于粮道。', cgId:'cg_intro_convoy', camera:'wide' },
      { type:'narration', id:'bg-three-raids', text:'数日内，曹军粮道三遭袭扰。敌骑总能提前一步伏于要路。', cgId:'cg_intro_ambush', camera:'wide' },
      { type:'narration', id:'bg-leak', text:'第三支粮队被截后，中军开始怀疑：军机正在从营中流出。', cgId:'cg_intro_aftermath', camera:'medium' },
      { type:'narration', id:'bg-assignment', text:'你被临时调入军机案前，负责查清——敌军究竟从哪里得到消息。', cgId:'cg_audience_caocao', camera:'wide', actionLabel:'继续' },
    ],
    nextStorySceneId:'player-identity',
  },
  {
    id:'player-identity', sceneId:'opening', cgId:'cg_evidence_desk',
    beats:[
      { type:'tutorial', id:'identity-card', title:'你的身份', text:'查案佐吏 · 军机案查验人', steps:['擅长：文书、邮驿、粮运与地方路线','权限：调阅相关军书、问询涉案人员、向主公阶段复命'], actionLabel:'接下此案', actionId:'accept-case' },
    ],
    nextStorySceneId:'basic-onboarding',
  },
  {
    id:'basic-onboarding', sceneId:'opening', cgId:'cg_evidence_desk',
    beats:[
      { type:'tutorial', id:'tutorial-report', title:'只先记住三件事', text:'案桌上只有一份伏击军报。先点击它，别急着记住所有系统。', steps:['点击物件查看','任务只告诉你当前一步','案卷可随时回看人物、文书和任务'], actionLabel:'展开伏击军报', actionId:'open-ambush-report' },
      { type:'narration', id:'tutorial-report-note', text:'军报记载：伏击集中在北桥东侧，敌骑在寅时前已完成集结。完整军令匣却仍然封存。', cgId:'cg_evidence_desk' },
      { type:'transition', id:'tutorial-dossier-open', text:'新功能：案卷已开启。可疑内容会在后续形成证据，不必现在记住全部内容。', actionLabel:'去见第一位涉案人' },
    ],
    nextStorySceneId:'zhao-first-intro',
  },
  {
    id:'zhao-first-intro', sceneId:'opening',
    beats:[
      { type:'character-intro', id:'zhao-reveal', speakerId:'zhao', title:'赵简', subtitle:'军书佐 · 负责誊写集合文书', description:'他接触过出发时辰，却声称并不知晓粮队何时集合。', actionLabel:'听取口供' },
    ],
    nextStorySceneId:'zhao-first-dialogue',
  },
  {
    id:'zhao-first-dialogue', sceneId:'opening',
    beats:[
      { type:'dialogue', id:'zhao-first-line', speakerId:'zhao', text:'属下只是照令誊写，并不知道粮队真正出发的时辰。', voiceId:'voice_zhao_intro', position:'right' },
      { type:'dialogue', id:'officer-first-question', speakerId:'officer', text:'你负责誊写集合文书？', position:'left' },
      { type:'dialogue', id:'zhao-first-answer', speakerId:'zhao', text:'是。但文书所写，并不等于最终军令。', position:'right' },
      { type:'transition', id:'zhao-first-task', text:'当前任务更新：核对赵简是否真的无法得知集合时辰。', actionLabel:'核对口供与集合记录' },
    ],
    nextSceneId:'first-evidence',
  },
  /* Legacy presentation entries remain for old v0.8.x saves. */
  {
    id:'intro-cg', sceneId:'story', beats:[{type:'dialogue',id:'intro-date',text:'建安五年 · 官渡前线'}], nextSceneId:'opening', nextStorySceneId:'prologue-background'
  },
  {
    id:'camp-brief', sceneId:'camp', beats:[{type:'dialogue',id:'camp-investigation-order',speakerId:'commander',text:'找出敌军究竟如何得到完整粮队情报。'}], nextSceneId:'opening', nextStorySceneId:'prologue-background'
  },
  {
    id:'zhao-introduction', sceneId:'dialogue', beats:[{type:'dialogue',id:'zhao-intro-denial',speakerId:'zhao',text:'属下只是照令誊写，并不知道粮队真正出发的时辰。'}], nextSceneId:'first-evidence'
  },
  { id:'case-summary', sceneId:'case-summary', beats:[{type:'dialogue',id:'case-summary-line',text:'第一条矛盾已立 / 第二折：四匣并查'}] },
];
