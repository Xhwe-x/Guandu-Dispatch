import { useGame } from '../../app/GameProvider';
import type { GameSceneId } from '../../game/scenes';
import { GameButton } from '../ui/GameButton';

interface DocumentSceneProps {
  onComplete: (nextSceneId: GameSceneId) => void;
}

const ambushReportId = 'report-ambush';
const ambushClaimId = 'claim-shuoyuan-received';
const requiredFindings = ['ambush-location', 'ambush-time'];

const reportFindings = [
  { id: 'ambush-location', label: '北桥东侧', text: '伏击痕迹与重车辙都集中在北桥东侧。', useful: true },
  { id: 'ambush-time', label: '寅时以前', text: '冷炊灰与夜露说明敌骑在寅时前已经完成集结。', useful: true },
  { id: 'ambush-seal', label: '封蜡未破', text: '军令匣仍然封存，说明完整军令并非直接被取走。', useful: false },
  { id: 'ambush-pages', label: '页数待核', text: '匣内页数尚未复核，目前不足以作为确定结论。', useful: false },
];

export function DocumentScene({ onComplete }: DocumentSceneProps) {
  const { content, dispatch, state } = useGame();
  const report = content.documents.find((document) => document.id === ambushReportId);
  const claim = content.claims.find((item) => item.id === ambushClaimId);
  const marked = state.presentation.documentFindingIds;
  const hasRecordedClaim = state.extractedClaimIds.includes(ambushClaimId);
  const hasCorePair = requiredFindings.every((id) => marked.includes(id));

  if (!report || !claim) {
    return <main className="slice-scene slice-scene--document"><p role="alert">伏击军报暂不可用，请稍后重试。</p></main>;
  }

  function markFinding(id: string) {
    dispatch({ type: 'MARK_DOCUMENT_FINDING', findingId: id });
  }

  function recordClaim() {
    if (!hasCorePair) return;
    dispatch({ type: 'READ_DOCUMENT', documentId: ambushReportId });
    dispatch({ type: 'EXTRACT_CLAIM', claimId: ambushClaimId });
    dispatch({ type: 'SET_TUTORIAL_STEP', step: 'openZhaoStatement' });
  }

  return (
    <main className="evidence-desk" aria-labelledby="document-scene-title">
      <div className="evidence-desk__lamp" aria-hidden="true"><i /></div>
      <div className="evidence-desk__inkstone" aria-hidden="true" />
      <section className="evidence-workspace">
        <header className="evidence-workspace__heading">
          <div>
            <p className="scene-kicker">案桌 · 第一份军报</p>
            <h1 id="document-scene-title">{report.title}</h1>
          </div>
          <p>从军报中自行找出敌军已经掌握的两项关键信息。不要急着下结论。</p>
        </header>

        <article className="military-document" aria-label="残缺伏击军报正文">
          <div className="military-document__cord" aria-hidden="true" />
          <header><span>中军急递</span><strong>伏击勘验摘录</strong><em>密</em></header>
          <p>{report.body}</p>
          <footer><span>校尉署押</span><span>建安五年</span></footer>
        </article>

        <aside className="finding-tray" aria-label="可疑处标记">
          <div className="finding-tray__title">
            <span>朱批</span>
            <strong>点选你认为值得记入案卷的内容</strong>
          </div>
          <div className="finding-tray__grid">
            {reportFindings.map((finding) => {
              const selected = marked.includes(finding.id);
              return (
                <button
                  key={finding.id}
                  className="finding-chip" data-audio-cue="evidence-place"
                  data-selected={selected}
                  type="button"
                  onClick={() => markFinding(finding.id)}
                >
                  <span>{finding.label}</span>
                  <small>{finding.text}</small>
                  {selected && <i aria-hidden="true">批</i>}
                </button>
              );
            })}
          </div>
          <p className="finding-tray__hint" role="status">
            {hasCorePair
              ? '位置与时刻可以拼成一条确定事实：敌军提前知道粮队走北桥，并在寅时前完成布伏。'
              : marked.length === 0
                ? '先从“敌军在哪里等”“敌军何时已经到位”两个角度查。'
                : '这条值得留意，但还需要另一项信息才能说明敌军掌握了完整行动要素。'}
          </p>
        </aside>

        {hasRecordedClaim && (
          <div className="case-note" role="status">
            <span className="case-note__seal">录</span>
            <div><small>已入案</small><strong>{claim.text}</strong></div>
          </div>
        )}

        <div className="scene-actions scene-actions--right">
          <GameButton variant="command" audioCue="seal" onClick={recordClaim} disabled={!hasCorePair || hasRecordedClaim} mark="印">誊入案卷</GameButton>
          <GameButton variant="secondary" audioCue="character-enter" onClick={() => onComplete('dialogue')} disabled={!hasRecordedClaim} mark="›">传赵简入帐</GameButton>
        </div>
      </section>
    </main>
  );
}
