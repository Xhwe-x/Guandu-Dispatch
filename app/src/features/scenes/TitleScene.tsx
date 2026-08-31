import { useState } from 'react';
import { useGame } from '../../app/GameProvider';
import { GameButton } from '../../ui/primitives/GameButton';
import { GameSheet } from '../../ui/primitives/GameSheet';
import { SaveSlotScreen } from './SaveSlotScreen';

export function TitleScene({ onStart }: { onStart: () => void }) {
  const { state, dispatch, saveSlots } = useGame();
  const [view, setView] = useState<'menu' | 'saves'>('menu');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasSave = saveSlots.some(Boolean);

  if (view === 'saves') return <SaveSlotScreen onBack={() => setView('menu')} onStartNew={onStart} />;

  return <main className="title-scene title-scene__v09" aria-labelledby="game-title">
    <div className="title-scene__v09-bg" aria-hidden="true" />
    <div className="title-scene__v09-shade" aria-hidden="true" />
    <section className="title-scene__v09-content">
      <p className="title-scene__v09-eyebrow">建安五年 · 官渡</p>
      <h1 id="game-title">官渡密报</h1>
      <p className="title-scene__v09-subtitle">粮道三遭袭扰。查清敌军如何得知本不该知道的事。</p>
      <nav className="title-scene__v09-menu" aria-label="开始菜单">
        <GameButton variant="primary" size="lg" audioCue="paper-open" onClick={() => setView('saves')}>{hasSave ? '进入存档' : '开始新案'}</GameButton>
        <GameButton variant="secondary" size="md" audioCue="ui-click" onClick={() => setSettingsOpen(true)}>设置</GameButton>
      </nav>
      {hasSave ? <p className="title-scene__save-hint">已检测到本地案卷。进入后可以查看具体进度再决定继续哪一档。</p> : null}
      <section className="title-scene__flow" aria-label="游玩流程说明">
        <header>
          <small>游玩流程</small>
          <strong>先理解案件，再逐步推理，不会一开始就把全部信息丢给你。</strong>
        </header>
        <ol>
          <li><b>01</b><span>背景导入：先看粮道夜袭与案件缘起。</span></li>
          <li><b>02</b><span>引导查案：跟随教程学会查看案卷、核对证据和建立矛盾。</span></li>
          <li><b>03</b><span>自由推进：认识人物、拼接情报链，最后向曹操复命。</span></li>
        </ol>
      </section>
    </section>
    <p className="title-scene__v09-foot">GUANDU DISPATCH · v0.9.5</p>
    <GameSheet open={settingsOpen} title="游戏设置" onClose={() => setSettingsOpen(false)}>
      <div className="title-scene__settings">
        <label><span>界面与场景音效</span><input type="checkbox" checked={state.audio?.enabled??true} onChange={e=>dispatch({type:'SET_AUDIO_SETTINGS',settings:{enabled:e.target.checked}})}/></label>
        <label><span>关键短句语音</span><input type="checkbox" checked={state.audio?.voiceEnabled??true} disabled={!(state.audio?.enabled??true)} onChange={e=>dispatch({type:'SET_AUDIO_SETTINGS',settings:{voiceEnabled:e.target.checked}})}/></label>
        <label><span>总体音量</span><input type="range" min="0" max="1" step="0.05" value={state.audio?.volume??0.72} disabled={!(state.audio?.enabled??true)} onChange={e=>dispatch({type:'SET_AUDIO_SETTINGS',settings:{volume:Number(e.target.value)}})}/></label>
      </div>
    </GameSheet>
  </main>;
}
