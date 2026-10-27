import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { GuildScene } from "../render/GuildScene";
import { BattleScene } from "../render/BattleScene";
export function GameCanvas({ battle = false }: { battle?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current!,
      width: battle ? 360 : 960,
      height: battle ? 400 : 360,
      backgroundColor: "#344c41",
      pixelArt: true,
      roundPixels: true,
      scale: {
        mode: battle ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: battle ? BattleScene : GuildScene,
      audio: { noAudio: true },
    });
    return () => game.destroy(true);
  }, [battle]);
  return (
    <div
      ref={host}
      className="game-canvas"
      role="img"
      aria-label={
        battle
          ? "전장 · 위쪽 고블린과 아래쪽 아군. 체력과 스킬은 전장 옆에 표시됩니다."
          : "숲속 용병단 본부와 현재 출전 파티"
      }
    />
  );
}
