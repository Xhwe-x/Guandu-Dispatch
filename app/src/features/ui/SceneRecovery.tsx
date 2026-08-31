import { GameButton } from '../../ui/primitives/GameButton';
import { CardContent, CardFooter, CardHeader, GameCard } from '../../ui/primitives/GameCard';
import { GameBadge } from '../../ui/primitives/GameBadge';

interface SceneRecoveryProps {
  onRecover: () => void;
  onReturnToCase: () => void;
  onRestartChapter: () => void;
}

export function SceneRecovery({ onRecover, onReturnToCase, onRestartChapter }: SceneRecoveryProps) {
  return (
    <main className="scene-recovery" aria-labelledby="scene-recovery-title">
      <GameCard className="scene-recovery__sheet" density="default" tone="dark">
        <CardHeader>
          <div>
            <small>案卷记录恢复</small>
            <h1 id="scene-recovery-title">当前演出记录需要校正</h1>
          </div>
          <GameBadge>案件事实保留</GameBadge>
        </CardHeader>
        <CardContent>
          <p>当前画面位置与案件进度不一致。已取得的证据、人物状态和调查结论不会丢失。</p>
          <p className="scene-recovery__note">优先恢复最近的 v0.9 合法节点；如仍不合适，可返回当前阶段或从本折安全起点继续。</p>
        </CardContent>
        <CardFooter className="scene-recovery__actions">
          <GameButton variant="primary" size="md" audioCue="ui-confirm" onClick={onRecover}>恢复最近场景</GameButton>
          <GameButton variant="secondary" size="md" audioCue="paper-open" onClick={onReturnToCase}>返回当前阶段</GameButton>
          <GameButton variant="ghost" size="md" audioCue="ui-back" onClick={onRestartChapter}>从本折安全节点继续</GameButton>
        </CardFooter>
      </GameCard>
    </main>
  );
}
