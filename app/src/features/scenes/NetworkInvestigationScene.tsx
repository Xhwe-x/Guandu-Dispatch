import { useState } from 'react';
import { useGame } from '../../app/GameProvider';
import { taskLinkForCharacter } from '../../content/guandu/taskLinks';
import { applyInvestigation } from '../../game/rules/investigation';
import { resolveEvidenceReaction } from '../../game/rules/evidenceReaction';
import { syncObjectivesUntilStable } from '../../game/rules/knowledge';
import { guanduObjectives } from '../../content/guandu/coreLoop';
import type { GameSceneId } from '../../game/scenes';
import { DialogueCharacterCard } from './DialogueCharacterCard';
import { dialogueCharacterFor } from './dialogueCharacters';
import { GameButton } from '../ui/GameButton';
import { useGameAudio } from '../audio/GameAudio';
import { CharacterIntro } from '../../ui/game/CharacterIntro';
import { SceneFocusHeader } from '../../ui/game/SceneFocusHeader';
import { GameBadge } from '../../ui/primitives/GameBadge';
import { GameButton as V09Button } from '../../ui/primitives/GameButton';

interface NetworkInvestigationSceneProps {
  onComplete: (nextSceneId: GameSceneId) => void;
}

type DossierId = 'lu' | 'zheng' | 'du' | 'zhao-family';

const dossierVoiceLines: Record<DossierId, string> = {
  lu: '封检、邮书、驿马都有簿可查。粮册之事，我愿说明。',
  zheng: '车损是我的过失，但路线不是我定的。',
  du: '商人走的路，看的是车辙、草料和价钱。',
  'zhao-family': '赵简家书封口有异，先查他为何冒险。',
};

const dossiers: { id: DossierId; number: string; name: string; role: string; thesis: string; introRole?: string; introDescription?: string }[] = [
  { id: 'lu', number: '壹', name: '陆淳', role: '邮驿主吏', introRole: '邮驿主吏 · 掌驿舍文书流转与封检', introDescription: '他熟悉邮书、封检与驿马调度。先听他解释文书如何流转，再判断改册是否意味着通敌。', thesis: '改过粮册，但他是否掌握出发时辰？' },
  { id: 'zheng', number: '贰', name: '郑禾', role: '军粮书佐', introRole: '军粮书佐 · 管车马簿与粮秣出入', introDescription: '他看起来愿意配合，却对车损记录格外含糊。先认识他，再看谎言究竟遮住了什么。', thesis: '修过车损记录，但他是否知道最终路线？' },
  { id: 'du', number: '叁', name: '杜衡', role: '营外行商', introRole: '营外行商 · 长期供应草料、车具与灯油', introDescription: '他没有军令权限，只像一个熟悉路况和货价的商人。危险之处，可能正是他会把零散迹象拼起来。', thesis: '没有完整军令，却频繁询问草料、车轮与商路。' },
  { id: 'zhao-family', number: '肆', name: '赵简家书', role: '旁证', thesis: '泄露时辰已经成立，但他为何冒险？' },
];

function hasAll(items: string[], ids: string[]) {
  return ids.every((id) => items.includes(id));
}

export function NetworkInvestigationScene({ onComplete }: NetworkInvestigationSceneProps) {
  const { content, dispatch, state } = useGame();
  const { speak } = useGameAudio();
  const dossierTarget = state.coreLoop.selectedDossierTarget?.kind === 'person' ? state.coreLoop.selectedDossierTarget.id : undefined;
  const initialDossier = dossierTarget === 'lu' || dossierTarget === 'zheng' || dossierTarget === 'du' ? dossierTarget : dossierTarget === 'zhao' ? 'zhao-family' : null;
  const [active, setActive] = useState<DossierId | null>(initialDossier);
  // 恢复存档时按已有线索推断哪些案卷已经开场过，避免人物介绍从头重播。
  const [introducedIds, setIntroducedIds] = useState<DossierId[]>(() => {
    const extracted = state.extractedClaimIds;
    const ids: DossierId[] = [];
    if (['claim-lu-seal-order', 'claim-lu-ledger-change', 'claim-lu-denial', 'claim-lu-no-time'].some((id) => extracted.includes(id))) ids.push('lu');
    if (['claim-zheng-repair-change', 'claim-zheng-scale', 'claim-zheng-denial', 'claim-zheng-no-route'].some((id) => extracted.includes(id))) ids.push('zheng');
    if (['claim-du-denial', 'claim-south-ford-open', 'claim-west-ridge-light', 'claim-du-fodder-pattern', 'claim-price-cipher', 'claim-du-route'].some((id) => extracted.includes(id))) ids.push('du');
    return ids;
  });
  const [message, setMessage] = useState('四匣并查：先区分“撒谎”与“通敌”，再找第二条泄密渠道。');

  const luReviewed = hasAll(state.extractedClaimIds, ['claim-lu-seal-order', 'claim-lu-ledger-change', 'claim-lu-denial']);
  const luResolved = hasAll(state.extractedClaimIds, ['claim-lu-no-time', 'claim-lu-relief-motive']);
  const zhengReviewed = hasAll(state.extractedClaimIds, ['claim-zheng-repair-change', 'claim-zheng-scale', 'claim-zheng-denial']);
  const zhengResolved = state.extractedClaimIds.includes('claim-zheng-no-route');
  const duReviewed = hasAll(state.extractedClaimIds, ['claim-du-denial', 'claim-south-ford-open', 'claim-west-ridge-light']);
  const duInvestigated = state.extractedClaimIds.includes('claim-price-cipher') && state.extractedClaimIds.includes('claim-du-fodder-pattern');
  const duFodderConfronted = state.coreLoop.knowledge['claim-du-fodder-pattern']?.status === 'supported';
  const duResolved = state.extractedClaimIds.includes('claim-du-route');
  const zhaoFamily = state.extractedClaimIds.includes('claim-zhao-coerced');
  const coreReady = luResolved && zhengResolved && duResolved && duInvestigated;
  const linkedCharacterId = active === 'zhao-family' ? 'zhao' : active ?? 'lu';
  const activeTaskLink = active ? taskLinkForCharacter(linkedCharacterId) : undefined;
  const activeDossier = dossiers.find((item) => item.id === active);
  const activeCharacter = active ? dialogueCharacterFor(linkedCharacterId) : undefined;
  const needsIntro = Boolean(active && active !== 'zhao-family' && !introducedIds.includes(active));

  function activateDossier(item: (typeof dossiers)[number]) {
    setActive(item.id);
    setMessage(item.thesis);
    if (item.id === 'zhao-family' || introducedIds.includes(item.id)) {
      const character = dialogueCharacterFor(item.id === 'zhao-family' ? 'zhao' : item.id);
      if (character) speak(dossierVoiceLines[item.id], character.voice);
    }
  }

  function readBundle(documentIds: string[], claimIds: string[], note: string) {
    for (const id of documentIds) dispatch({ type: 'READ_DOCUMENT', documentId: id });
    for (const id of claimIds) dispatch({ type: 'EXTRACT_CLAIM', claimId: id });
    setMessage(note);
  }

  function confront(characterId: 'lu' | 'zheng' | 'du', evidenceClaimId: string) {
    const result = resolveEvidenceReaction(content, state, characterId, evidenceClaimId, Date.now());
    const next = syncObjectivesUntilStable(result.state, guanduObjectives);
    dispatch({ type: 'APPLY_RULE_STATE', state: next });
    setMessage(result.response);
    const character = dialogueCharacterFor(characterId);
    if (character) speak(result.response, character.voice);
  }

  function investigate(id: 'investigate-du-records' | 'investigate-zhao-family') {
    try {
      const result = applyInvestigation(content, state, id);
      dispatch({ type: 'APPLY_RULE_STATE', state: result.state });
      setMessage(id === 'investigate-du-records'
        ? '深查成立：草料数量能反推出二十四辆重车，异常价格又把路线与地支时刻编码在一起。'
        : '家书与里社查访互相印证：赵简家人确实受到袁军控制。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '调查未能完成。');
    }
  }

  return (
    <main className="v09-network-investigation" aria-labelledby="network-investigation-title">
      <SceneFocusHeader eyebrow="第二幕 · 人人有隐情" title="逐人核对" description="赵简的矛盾只证明他接触过时辰。接下来先弄清陆淳、郑禾和杜衡各自真正掌握了什么。" id="network-investigation-title" status={<GameBadge>调查令 · {state.investigationPoints}/3</GameBadge>} />

      <nav className="v09-network-investigation__people" aria-label="待查人物">
        {dossiers.map((item) => {
          const resolved = item.id === 'lu' ? luResolved : item.id === 'zheng' ? zhengResolved : item.id === 'du' ? duResolved : zhaoFamily;
          return <V09Button key={item.id} variant={active === item.id ? 'secondary' : 'ghost'} size="sm" aria-pressed={active === item.id} onClick={() => activateDossier(item)}>{item.number} · {item.name}{resolved ? ' ✓' : ''}</V09Button>;
        })}
      </nav>

      {active && activeDossier && activeCharacter && needsIntro && activeDossier.introRole && activeDossier.introDescription && (
        <section className="v09-network-intro">
          <CharacterIntro characterId={linkedCharacterId} title={activeDossier.name} subtitle={activeDossier.introRole} description={activeDossier.introDescription} actionLabel="开始核对" onContinue={() => {
            setIntroducedIds((items) => items.includes(active) ? items : [...items, active]);
            speak(dossierVoiceLines[active], activeCharacter.voice);
          }} />
        </section>
      )}

      {!active && <section className="v09-network-empty"><small>第二幕 · 人人有隐情</small><h2>先认识人，再查他们的秘密</h2><p>陆淳、郑禾、杜衡都没有被预先标成“嫌疑人”。选择一个人物，先听他的职责和说法。</p></section>}

      {activeTaskLink && !needsIntro && (
        <aside className="dossier-link-strip" aria-label="人物关联任务">
          <div><small>人物任务</small><strong>{activeTaskLink.title}</strong></div>
          <p>{activeTaskLink.nextAction}</p>
          <div className="dossier-link-strip__docs">{activeTaskLink.documentIds.map((id) => <span key={id}>{content.documents.find((doc) => doc.id === id)?.title ?? id}</span>)}</div>
        </aside>
      )}

      {activeCharacter && activeDossier && !needsIntro && (
        <section className="network-character-focus" key={active} aria-label={`${activeCharacter.name}人物卡`}>
          <DialogueCharacterCard character={activeCharacter} mood={active === 'du' ? 'thinking' : active === 'zhao-family' ? 'pressured' : 'guarded'} line={message || activeDossier.thesis} evidenceLabel={activeTaskLink?.nextAction} />
        </section>
      )}

      {!needsIntro && active && <section className="dossier-workbench" aria-live="polite">
        {active === 'lu' && (
          <article className="dossier-sheet dossier-sheet--lu">
            <header><span>邮驿案</span><h2>陆淳：改册是否等于泄密？</h2></header>
            <p>原始粮册与改写粮册的数量不一致，陆淳又否认动过账。先确认他真正掌握什么，再决定这是不是通敌证据。</p>
            <div className="dossier-facts">
              <span data-known={state.extractedClaimIds.includes('claim-lu-ledger-change')}>粮袋数量被改写</span>
              <span data-known={state.extractedClaimIds.includes('claim-lu-seal-order')}>掌握盖印与驿传顺序</span>
              <span data-known={state.extractedClaimIds.includes('claim-lu-no-time')}>不知道最终出发时辰</span>
            </div>
            <div className="dossier-actions">
              <GameButton variant="secondary" audioCue="evidence-place" disabled={luReviewed} onClick={() => readBundle(
                ['ledger-original', 'ledger-revised', 'statement-lu'],
                ['claim-lu-seal-order', 'claim-lu-ledger-change', 'claim-lu-denial'],
                '两版粮册与口供已并置：陆淳确实改册，但材料仍没有出现最终路线或集合时辰。',
              )}>比对两版粮册</GameButton>
              <GameButton variant="command" audioCue="warning" disabled={!luReviewed || luResolved} onClick={() => confront('lu', 'claim-lu-ledger-change')}>以改册对质陆淳</GameButton>
            </div>
          </article>
        )}

        {active === 'zheng' && (
          <article className="dossier-sheet dossier-sheet--zheng">
            <header><span>军粮案</span><h2>郑禾：车损谎言能否导出路线？</h2></header>
            <p>维修记录从七辆改成三辆，郑禾试图把责任推给学徒。但车辆规模与最终路线并不是一回事。</p>
            <div className="dossier-facts">
              <span data-known={state.extractedClaimIds.includes('claim-zheng-repair-change')}>车损记录被改写</span>
              <span data-known={state.extractedClaimIds.includes('claim-zheng-scale')}>掌握二十四辆车规模</span>
              <span data-known={state.extractedClaimIds.includes('claim-zheng-no-route')}>路线核定前已离开调度房</span>
            </div>
            <div className="dossier-actions">
              <GameButton variant="secondary" audioCue="evidence-place" disabled={zhengReviewed} onClick={() => readBundle(
                ['repair-wagons', 'statement-zheng'],
                ['claim-zheng-repair-change', 'claim-zheng-scale', 'claim-zheng-denial'],
                '维修记录证明郑禾隐瞒车损；交接时间却显示他在路线核定前已离开调度房。',
              )}>核车辆维修记录</GameButton>
              <GameButton variant="command" audioCue="warning" disabled={!zhengReviewed || zhengResolved} onClick={() => confront('zheng', 'claim-zheng-repair-change')}>以维修笔迹对质</GameButton>
            </div>
          </article>
        )}

        {active === 'du' && (
          <article className="dossier-sheet dossier-sheet--du">
            <header><span>商旅案</span><h2>杜衡：没有军令，也能算出路线？</h2></header>
            <p>杜衡只有外院通行牌，却反复询问草料、车轮与商路。把采购量、路线图和价格表放在一起，看它们能不能拼成军情。</p>
            <div className="merchant-clue-grid">
              <span data-known={state.extractedClaimIds.includes('claim-south-ford-open')}><b>商路</b>南渡可通普通粮车</span>
              <span data-known={state.extractedClaimIds.includes('claim-du-fodder-pattern')}><b>草料</b>120 束 → 24 辆重车</span>
              <span data-known={state.extractedClaimIds.includes('claim-price-cipher')}><b>价格</b>异常尾数 + 地支序号</span>
              <span data-known={state.extractedClaimIds.includes('claim-du-route')}><b>结论</b>可从零散迹象判断路线</span>
            </div>
            <div className="dossier-actions dossier-actions--wrap">
              <GameButton variant="secondary" audioCue="evidence-place" disabled={duReviewed} onClick={() => readBundle(
                ['station-entry', 'statement-du', 'route-map', 'trade-prices'],
                ['claim-du-denial', 'claim-south-ford-open', 'claim-west-ridge-light'],
                '出入簿、商路图与价格表已摊开：杜衡没有接触完整军令，但零散物流数据都经过他眼前。',
              )}>查出入簿与商路图</GameButton>
              <GameButton variant="secondary" audioCue="evidence-place" disabled={!duReviewed || duInvestigated || state.investigationPoints < 1} lockedReason={state.investigationPoints < 1 ? '调查令已用尽' : undefined} onClick={() => investigate('investigate-du-records')}>深查采购与价格 · 耗1令</GameButton>
              <GameButton variant="command" audioCue="warning" disabled={!state.extractedClaimIds.includes('claim-du-fodder-pattern') || duFodderConfronted || duResolved} lockedReason={!state.extractedClaimIds.includes('claim-du-fodder-pattern') ? '先深查采购与价格记录' : undefined} onClick={() => confront('du', 'claim-du-fodder-pattern')}>以草料数量对质</GameButton>
              <GameButton variant="command" audioCue="warning" disabled={!state.extractedClaimIds.includes('claim-price-cipher') || !state.extractedClaimIds.includes('claim-du-denial') || duResolved} lockedReason={!state.extractedClaimIds.includes('claim-price-cipher') ? '先深查采购与价格记录' : !duFodderConfronted ? '先用草料数量钉死他的推算基础' : undefined} onClick={() => confront('du', 'claim-price-cipher')}>以价格暗号对质杜衡</GameButton>
            </div>
          </article>
        )}

        {active === 'zhao-family' && (
          <article className="dossier-sheet dossier-sheet--zhao-family">
            <header><span>旁证案</span><h2>赵简：主动背叛，还是被迫泄露？</h2></header>
            <p>责任已经成立，但动机仍影响最终处置。家书封口被重新粘合，近月他又连续替人值夜。</p>
            <div className="family-letter" data-known={zhaoFamily}><span>家书</span><p>{zhaoFamily ? '里社查访确认：赵简家人确被袁军控制。' : '封口有二次粘合痕迹；其余尚待查访。'}</p></div>
            <div className="dossier-actions">
              <GameButton variant="command" audioCue="warning" disabled={zhaoFamily || state.investigationPoints < 1} lockedReason={state.investigationPoints < 1 ? '调查令已用尽' : undefined} onClick={() => investigate('investigate-zhao-family')}>追查家书与家人 · 耗1令</GameButton>
            </div>
          </article>
        )}
      </section>}

      <div className="network-status" role="status" data-complete={coreReady}><i aria-hidden="true" /> <span>{message}</span></div>
      <footer className="v09-network-investigation__footer">
        <div className="network-checks">
          <span data-ok={luResolved}>陆淳：谎言与通敌分离</span>
          <span data-ok={zhengResolved}>郑禾：谎言与路线分离</span>
          <span data-ok={duResolved}>杜衡：路线推断链成立</span>
        </div>
        <GameButton variant="command" audioCue="deduction-link" disabled={!coreReady} lockedReason={!coreReady ? '先完成陆淳、郑禾与杜衡的责任边界核验' : undefined} onClick={() => onComplete('network-deduction')} mark="›">把四匣移上推演板</GameButton>
      </footer>
    </main>
  );
}
