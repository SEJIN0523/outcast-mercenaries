import Phaser from "phaser";
import { store } from "../state/store";
import { drawMercenary } from "./sprite";

/** A separate portrait battlefield. Combat remains entirely in domain/battle. */
export class BattleScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private lastKey = "";
  constructor() {
    super("portrait-battle");
  }
  create() {
    this.redraw();
    this.unsubscribe = store.subscribe(() => this.redraw());
    this.scale.on("resize", this.resize, this);
    const cleanup = () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.scale.off("resize", this.resize, this);
      this.events.off("shutdown", cleanup);
      this.events.off("destroy", cleanup);
    };
    this.events.once("shutdown", cleanup);
    this.events.once("destroy", cleanup);
  }
  private resize() {
    this.lastKey = "";
    this.redraw();
  }
  private redraw() {
    const { battle, paused } = store.getSnapshot();
    if (!battle) return;
    const key = JSON.stringify([
      battle.tick,
      battle.cooldown,
      battle.status,
      paused,
    ]);
    if (this.lastKey === key) return;
    this.lastKey = key;
    for (const object of this.objects) {
      this.tweens.killTweensOf(object);
      object.destroy();
    }
    this.objects = [];
    const width = this.scale.width,
      height = this.scale.height;
    const bg = this.add.graphics();
    this.objects.push(bg);
    bg.fillStyle(0x243e36);
    bg.fillRect(0, 0, width, height);
    bg.fillStyle(0x344e3c);
    bg.fillEllipse(width * 0.5, height * 0.55, width * 0.9, height * 0.85);
    bg.fillStyle(0x4b5c40);
    bg.fillEllipse(width * 0.5, height * 0.52, width * 0.72, height * 0.67);
    for (let i = 0; i < 35; i++) {
      const x = (((i * 97) % 359) / 360) * width,
        y = (((i * 73) % 399) / 400) * height;
      bg.fillStyle(i % 3 === 0 ? 0x71805a : 0x3d563b, 0.55);
      bg.fillRect(x, y, 3 + (i % 4), 2);
    }
    for (let i = 0; i < 8; i++) {
      const left = i % 2 === 0;
      const x = left ? -12 + i * 3 : width + (12 - i * 3),
        y = (i / 8) * height;
      bg.fillStyle(i % 3 === 0 ? 0x132c26 : 0x1a332a);
      bg.fillTriangle(x, y - 36, x - 48, y + 53, x + 48, y + 53);
      bg.fillTriangle(x, y - 12, x - 56, y + 82, x + 56, y + 82);
    }
    bg.lineStyle(1, 0xafaa71, 0.16);
    bg.lineBetween(width * 0.18, height * 0.5, width * 0.82, height * 0.5);
    const zoom = Math.min(1.15, Math.max(0.65, height / 290));
    const enemies = battle.units.filter((u) => u.side === "enemy");
    if (!this.textures.exists("portrait-goblin")) {
      const t = this.textures.createCanvas("portrait-goblin", 64, 80)!;
      const c = t.context;
      const r = (x: number, y: number, w: number, h: number, color: string) => {
        c.fillStyle = color;
        c.fillRect(x, y, w, h);
      };
      r(17, 52, 10, 21, "#544f37");
      r(35, 52, 10, 21, "#544f37");
      r(13, 30, 37, 28, "#6a7947");
      r(16, 9, 31, 28, "#9baa5c");
      r(6, 17, 14, 8, "#92a352");
      r(44, 17, 14, 8, "#92a352");
      r(22, 20, 5, 5, "#e7cf7c");
      r(37, 20, 5, 5, "#e7cf7c");
      r(28, 31, 10, 3, "#42452d");
      r(10, 36, 7, 17, "#9aaa5c");
      r(48, 32, 4, 36, "#946b45");
      r(44, 29, 13, 8, "#b5b59b");
      r(15, 55, 31, 4, "#866c46");
      t.refresh();
    }
    enemies.forEach((u, i) => {
      const x = (width * (i + 1)) / (enemies.length + 1),
        y = height * 0.27;
      const img = this.add
        .image(x, y, "portrait-goblin")
        .setScale(zoom * (i === 2 ? 1.12 : 1))
        .setAlpha(u.hp <= 0 ? 0.18 : 1);
      this.objects.push(img);
      if (battle.tick > 0 && u.hp > 0 && !paused) {
        img.x += 4;
        this.tweens.add({ targets: img, x, duration: 180 });
      }
    });
    const allies = battle.units.filter((u) => u.side === "party");
    allies.forEach((u, i) => {
      const m = u.mercenary!;
      const textureKey = `portrait-${m.id}`;
      if (!this.textures.exists(textureKey)) {
        const t = this.textures.createCanvas(textureKey, 64, 80)!;
        drawMercenary(t.context, m);
        t.refresh();
      }
      const x = (width * (i + 1)) / (allies.length + 1),
        y = height * 0.76 - (i % 2) * 8;
      const img = this.add
        .image(x, y, textureKey)
        .setScale(zoom)
        .setAlpha(u.hp <= 0 ? 0.25 : 1);
      this.objects.push(img);
      if (battle.tick > 0 && u.hp > 0 && !paused) {
        img.y += 3;
        this.tweens.add({ targets: img, y, duration: 200 });
      }
    });
    if (paused) {
      bg.fillStyle(0x12231d, 0.15);
      bg.fillRect(0, 0, width, height);
    }
  }
}
