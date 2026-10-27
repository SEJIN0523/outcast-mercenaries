import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { GuildScene } from "../render/GuildScene";
export function GameCanvas() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current!,
      width: 960,
      height: 360,
      backgroundColor: "#344c41",
      pixelArt: true,
      roundPixels: true,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: GuildScene,
      audio: { noAudio: true },
    });
    return () => game.destroy(true);
  }, []);
  return (
    <div
      ref={host}
      className="game-canvas"
      role="img"
      aria-label="숲속 용병단 본부와 현재 출전 파티. 전투 체력과 결과는 아래에도 표시됩니다."
    />
  );
}
