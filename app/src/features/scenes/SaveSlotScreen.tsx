import { useMemo, useState } from 'react';
import { useGame } from '../../app/GameProvider';
import { SAVE_SLOT_IDS, type SaveSlotId, type SaveSlotSummary } from '../../game/saveSlots';
import { GameBadge } from '../../ui/primitives/GameBadge';
import { GameButton } from '../../ui/primitives/GameButton';
import { CardContent, CardFooter, CardHeader, GameCard } from '../../ui/primitives/GameCard';
import { GameDialog } from '../../ui/primitives/GameDialog';

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function thumbnailFor(slot: SaveSlotSummary) {
  const scene=slot.state.presentation.sceneId;
  if(scene==='audience') return '/assets/cg/audience-caocao.png';
  // 质询相关场景用军帐背影做缩略图；zhao-interrogation.png 是脸部特写且底部带烘焙黑边。
  if(scene==='interrogation'||scene==='dialogue') return '/assets/cg/interrogation-tent-bg.webp';
  if(scene==='first-evidence'||scene==='first-deduction'||scene==='network-investigation'||scene==='network-deduction'||scene==='final-report') return '/assets/cg/evidence-desk.png';
  return '/assets/cg/night-ambush.png';
}

/** 证据桌概念图带烘焙标签，缩略图里也需要压暗模糊，避免乱码字可读。 */
function thumbnailNeedsSoftBlur(src: string) {
  return src.includes('evidence-desk');
}


function SaveSummary({ slot }: { slot: SaveSlotSummary }) {
  return <>
    <div className="save-slot__progress" aria-label={`案件进度 ${slot.progress}%`}>
      <span style={{ width: `${slot.progress}%` }} />
    </div>
    <dl className="save-slot__details">
      <div><dt>当前位置</dt><dd>{slot.sceneLabel}</dd></div>
      <div><dt>当前任务</dt><dd>{slot.objective}</dd></div>
      <div><dt>调查记录</dt><dd>{slot.state.extractedClaimIds.length} 条线索 · {slot.state.relationships.length} 条推断</dd></div>
    </dl>
  </>;
}

export function SaveSlotScreen({ onBack, onStartNew }: { onBack: () => void; onStartNew: () => void }) {
  const { createSaveSlot, openSaveSlot, removeSaveSlot, saveSlots } = useGame();
  const [deleteTarget, setDeleteTarget] = useState<SaveSlotId | null>(null);
  const byId = useMemo(() => new Map(saveSlots.filter(Boolean).map((slot) => [slot!.id, slot!])), [saveSlots]);
  const target = deleteTarget ? byId.get(deleteTarget) : undefined;
  const recentSlotId = useMemo(() => saveSlots.filter((slot): slot is SaveSlotSummary => Boolean(slot)).sort((a,b) => Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0]?.id ?? null, [saveSlots]);

  const createAndStart = (id: SaveSlotId) => {
    createSaveSlot(id);
    onStartNew();
  };

  return <main className="save-select" aria-labelledby="save-select-title">
    <div className="save-select__backdrop" aria-hidden="true" />
    <header className="save-select__header">
      <GameButton variant="ghost" size="sm" onClick={onBack}>← 返回标题</GameButton>
      <div><small>本地案卷</small><h1 id="save-select-title">选择存档</h1></div>
      <span className="save-select__autosave">游戏过程会自动保存到当前案卷</span>
    </header>
    <section className="save-select__grid" aria-label="存档列表">
      {SAVE_SLOT_IDS.map((id, index) => {
        const slot = byId.get(id);
        return <GameCard key={id} className="save-slot" density="compact" tone="dark">
          <CardHeader>
            <div><small>存档 {index + 1}</small><h2>{slot?.name ?? '空案卷'}</h2></div>
            <div className="save-slot__badges">{slot?.id===recentSlotId?<GameBadge>最近游玩</GameBadge>:null}{slot ? <GameBadge>{slot.progress}%</GameBadge> : <GameBadge>未使用</GameBadge>}</div>
          </CardHeader>
          <CardContent>
            {slot ? <>
              <div className="save-slot__thumb" data-recent={slot.id===recentSlotId}><img src={thumbnailFor(slot)} data-soft={thumbnailNeedsSoftBlur(thumbnailFor(slot)) || undefined} alt=""/><span><small>{slot.chapterLabel}</small><strong>{slot.sceneLabel}</strong></span></div>
              <div className="save-slot__chapter"><strong>{slot.chapterLabel}</strong><span>最后保存 {formatSavedAt(slot.updatedAt)}</span></div>
              <SaveSummary slot={slot} />
            </> : <div className="save-slot__empty"><strong>从序章开始</strong><p>时代背景、身份介绍和基础引导都会从头播放。</p></div>}
          </CardContent>
          <CardFooter>
            {slot ? <>
              <GameButton variant="primary" size="md" onClick={() => openSaveSlot(id)}>继续此档</GameButton>
              <GameButton variant="ghost" size="sm" onClick={() => setDeleteTarget(id)}>删除</GameButton>
            </> : <GameButton variant="primary" size="md" onClick={() => createAndStart(id)}>新建存档</GameButton>}
          </CardFooter>
        </GameCard>;
      })}
    </section>
    <footer className="save-select__footer">
      <p>启动游戏时始终从标题页进入。已有进度不会自动跳转，只有选择存档后才恢复。</p>
    </footer>
    <GameDialog
      open={deleteTarget !== null}
      title="删除这个存档？"
      description={target ? `${target.chapterLabel} · ${target.sceneLabel}` : '删除后无法在游戏内恢复。'}
      onClose={() => setDeleteTarget(null)}
      footer={<><GameButton variant="ghost" onClick={() => setDeleteTarget(null)}>取消</GameButton><GameButton variant="danger" onClick={() => { if (deleteTarget) removeSaveSlot(deleteTarget); setDeleteTarget(null); }}>确认删除</GameButton></>}
    ><p className="save-select__delete-copy">只删除这一份本地案卷，其他存档不受影响。</p></GameDialog>
  </main>;
}
