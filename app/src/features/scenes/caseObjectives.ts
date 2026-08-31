import type { GameState } from '../../game/domain';
import type { GameSceneId } from '../../game/scenes';

export interface CaseObjective {
  chapter: string;
  title: string;
  detail: string;
  action: string;
  characterIds: string[];
}

const sceneObjectives: Partial<Record<GameSceneId, CaseObjective>> = {
  opening: { chapter: '序章 · 粮道疑云', title: '先理解，再操作', detail: '先了解官渡粮道、你的身份和案件最初线索；教程只在第一次需要时出现。', action: '完成背景、身份与赵简首次口供。', characterIds: ['zhao'] },
  'first-evidence': { chapter: '第一折 · 核对口供', title: '只比较两条信息', detail: '赵简的原话与集合记录已经并排放到案前。先判断它们是否一致。', action: '点选两条信息并进入第一次推断。', characterIds: ['zhao'] },
  'first-deduction': { chapter: '第一折 · 第一条推断', title: '判断信息关系', detail: '第一次推断只需要区分“相互印证”与“存在矛盾”。', action: '确认口供与集合记录之间的关系。', characterIds: ['zhao'] },
  story: { chapter: '序 · 粮道夜袭', title: '确认伏击异常', detail: '敌军三次提前等在粮道上，先弄清他们究竟掌握了哪些信息。', action: '看完急报并进入中军帐。', characterIds: [] },
  camp: { chapter: '第一折 · 军帐议事', title: '奉命查清泄密源', detail: '完整军令无人独掌，意味着情报可能由多段碎片拼成。', action: '领命后先查残缺军报。', characterIds: [] },
  document: { chapter: '第一折 · 军报', title: '从军报提取事实', detail: '不要猜凶手，先把地点、时辰和敌军准备程度誊入案卷。', action: '至少记录足以证明敌军提前准备的事实。', characterIds: [] },
  dialogue: { chapter: '第一折 · 初问', title: '听赵简自己说', detail: '先保存他的原话，稍后再用文书核验。', action: '完成初问并取得赵简口供。', characterIds: ['zhao'] },
  investigation: { chapter: '第一折 · 笔迹', title: '核对集合命令', detail: '赵简否认知道时辰，但命令笔迹可能留下直接矛盾。', action: '标出关键笔迹特征并确认结论。', characterIds: ['zhao'] },
  interrogation: { chapter: '第一折 · 对质', title: '用证据击中矛盾', detail: '不同问法会改变戒备；证据不足时不要贸然威逼。', action: '选择证据与问话方式，取得时辰口供。', characterIds: ['zhao'] },
  deduction: { chapter: '第一折 · 推演', title: '建立第一条矛盾', detail: '把“亲笔誊令”与“否认知情”连接起来，证明口供不能自洽。', action: '在推演板上钉入一条有效关系。', characterIds: ['zhao'] },
  'case-summary': { chapter: '第一幕 · 粮道疑云', title: '不要急着定赵简', detail: '第一条矛盾只证明赵简的口供不能自洽，还不足以解释敌军如何得到完整路线。', action: '去认识陆淳、郑禾与杜衡，查清其他信息渠道。', characterIds: ['zhao'] },
  audience: { chapter: '第六幕 · 回中军复命', title: '用完整泄密链回答曹操', detail: '你已经区分时辰来源、路线推断与传讯者；现在主公会追问证据是否足以支撑反情报行动。', action: '完成阶段复命，争取分渠道投饵的授权。', characterIds: ['zhao','du'] },
  'network-investigation': { chapter: '第二幕 · 人人有隐情', title: '逐人核对信息边界', detail: '陆淳、郑禾、杜衡与赵简各掌一部分信息，逐一确认他们真正知道什么。', action: '完成陆淳、郑禾与杜衡三条核心核验。', characterIds: ['lu', 'zheng', 'du', 'zhao'] },
  'network-deduction': { chapter: '第三幕 · 碎片成军情', title: '逐段拼出泄密链', detail: '时辰与路线并非来自同一人；找出来源、拼合者和传递方式。', action: '完成时辰源、路线源与传讯者三项推演。', characterIds: ['zhao', 'du'] },
  bait: { chapter: '第五幕 · 将计就计', title: '分渠道投放假信息', detail: '给不同渠道投放互不相同的假碎片，用敌军行动验证谁在传话。', action: '配置四路假令并放行真实粮队。', characterIds: ['lu', 'zheng', 'zhao', 'du'] },
  'enemy-report': { chapter: '第六幕 · 敌军回声', title: '读取敌军行动证据', detail: '敌军采用了哪一条假路线、哪一个假时辰，将决定泄密链是否坐实。', action: '确认回声后再次觐见主公。', characterIds: ['zhao', 'du'] },
  'final-report': { chapter: '第七幕 · 最终军机报告', title: '亲笔提交结论', detail: '把事实、证据链和处置分开写清，避免用一个替死鬼掩盖真正渠道。', action: '依次完成事实、证据链与处置三步并封印呈交。', characterIds: ['lu', 'zheng', 'zhao', 'du'] },
  ending: { chapter: '终折 · 真相归属', title: '决定真相如何留下', detail: '军事胜负之外，你还要决定证据交给谁、谁承担责任。', action: '选择真相归属并查看政治结局。', characterIds: ['lu', 'zheng', 'zhao', 'du'] },
};

export function caseObjectiveForScene(sceneId: GameSceneId, state: GameState): CaseObjective {
  if (sceneId === 'audience' && state.presentation.audience?.visitId === 'final-report') {
    return {
      chapter: '中军 · 二次复命',
      title: '把反情报结果交给曹操判断',
      detail: '假令已经让敌军留下行动回声，现在要说明哪些渠道被坐实，以及你准备如何结案。',
      action: '完成二次复命后提交最终军机报告。',
      characterIds: ['zhao', 'du'],
    };
  }
  return sceneObjectives[sceneId] ?? {
    chapter: '军机案卷',
    title: '继续当前调查',
    detail: '当前资料仍在案卷中保存。',
    action: '完成页面上的主要行动或返回案卷查看线索。',
    characterIds: [],
  };
}

export function suggestedHintForScene(sceneId: GameSceneId, state: GameState): string {
  switch (sceneId) {
    case 'document': return state.presentation.documentFindingIds.length < 2 ? '先找“敌军何时已经准备好”和“伏击发生在哪里”，不要急着猜内应。' : '把已标出的事实誊入案卷，之后才能在人物与推演场景使用。';
    case 'investigation': return state.presentation.handwritingFindingIds.length < 2 ? '比较收笔、转折和“车/钩”类特征；至少两处稳定特征才足以支持判断。' : '你已经有足够笔迹特征，可以确认由谁誊抄。';
    case 'interrogation': return state.personStates.zhao === 'hostile' ? '赵简已高度戒备。不要继续用无关证据威逼，换成与“亲笔誊令”直接相关的材料。' : '最强证据不是伏击本身，而是能直接反驳“我不知道时辰”的亲笔命令。';
    case 'deduction': return '尝试用“亲笔誊抄集合命令”反驳“赵简不知道集合时辰”的口供。';
    case 'network-investigation': return state.investigationPoints === 0 ? '调查令已经用尽，但陆淳/郑禾的基础对质不耗调查令；先把不需要深查的案卷核完。' : '先问每个人“他究竟知道什么”，再问“他为什么说谎”。说谎本身不是通敌证据。';
    case 'network-deduction': return '时辰渠道看赵简；路线渠道看杜衡；传递方式要找能把碎片编码送出的人。';
    case 'bait': return '反情报投饵的关键是“每个渠道拿到不同假碎片”，这样敌军一动就能反推出来源。';
    case 'final-report': return '按三步填写：先确认事实与来源，再钉定拼合/传递证据链，最后决定处置。';
    default: return '打开案卷查看“当前任务”和人物关联；所有核心场景都可以返回上一个安全节点。';
  }
}
