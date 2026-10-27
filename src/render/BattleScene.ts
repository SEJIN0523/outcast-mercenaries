import Phaser from "phaser";
import { store } from "../state/store";
import { FIELD } from "../data/combat";
import { drawMercenary } from "./sprite";
import { combatAppearance } from "./combatAppearance";
import type { CombatBattle } from "../domain/combat/types";
type Actor = {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
  hp: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
};
export class BattleScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private backdrop!: Phaser.GameObjects.Graphics;
  private actors = new Map<string, Actor>();
  private missiles = new Map<number, Phaser.GameObjects.Graphics>();
  private numbers = new Map<number, Phaser.GameObjects.Text>();
  private battle: CombatBattle | null = null;
  private paused = false;
  private receivedAt = 0;
  constructor() {
    super("portrait-battle");
  }
  create() {
    this.backdrop = this.add.graphics();
    this.background();
    this.sync();
    this.unsubscribe = store.subscribe(() => this.sync());
    this.scale.on("resize", this.background, this);
    const cleanup = () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.scale.off("resize", this.background, this);
      this.events.off("shutdown", cleanup);
      this.events.off("destroy", cleanup);
    };
    this.events.once("shutdown", cleanup);
    this.events.once("destroy", cleanup);
  }
  private sync() {
    const s = store.getSnapshot();
    this.battle = s.battle;
    this.paused = s.paused;
    this.receivedAt = this.time.now;
  }
  private background() {
    if (!this.backdrop) return;
    const g = this.backdrop,
      w = this.scale.width,
      h = this.scale.height;
    g.clear();
    g.fillStyle(0x243e33);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x42563a);
    g.fillEllipse(w * 0.5, h * 0.5, w * 0.88, h * 0.95);
    g.fillStyle(0x4d5f3d);
    g.fillEllipse(w * 0.5, h * 0.55, w * 0.68, h * 0.67);
    for (let i = 0; i < 50; i++) {
      g.fillStyle(i % 3 === 0 ? 0x8d9860 : 0x2d4a32, 0.45);
      g.fillRect(
        (((i * 97) % 359) / 360) * w,
        (((i * 73) % 419) / 420) * h,
        2 + (i % 4),
        2,
      );
    }
    for (let i = 0; i < 10; i++) {
      const x = i % 2 === 0 ? -10 : w + 10,
        y = (i / 10) * h;
      g.fillStyle(i % 3 === 0 ? 0x132b23 : 0x1b3428);
      g.fillTriangle(x, y - 25, x - 38, y + 48, x + 38, y + 48);
    }
    g.lineStyle(1, 0xd3b97a, 0.22);
    g.lineBetween(w * 0.2, h * 0.96, w * 0.8, h * 0.96);
    g.fillStyle(0xb8bf8244);
    g.fillRect(w * 0.46, h * 0.96, w * 0.08, 3);
  }
  private texture(id: string) {
    if (this.textures.exists(id)) return;
    const m = this.battle!.units.find((u) => `rt-${u.id}` === id)?.mercenary;
    const t = this.textures.createCanvas(id, 64, 80)!;
    if (m) drawMercenary(t.context, m);
    else {
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
      r(48, 32, 4, 36, "#946b45");
      r(44, 29, 13, 8, "#b5b59b");
      r(15, 55, 31, 4, "#866c46");
    }
    t.refresh();
  }
  update(time: number, delta: number) {
    const b = this.battle;
    if (!b) return;
    const sx = this.scale.width / FIELD.width,
      sy = this.scale.height / FIELD.height,
      viewScale = Math.min(sx, sy * 1.25);
    const displayTime =
      b.elapsed +
      (this.paused
        ? 0
        : Math.min(1.6, (time - this.receivedAt) / 1000) * b.speed);
    for (const u of b.units) {
      const a = combatAppearance(u);
      this.texture(a.textureKey);
      let node = this.actors.get(u.id);
      if (!node) {
        const image = this.add.image(0, 0, a.textureKey).setOrigin(0.5, 0.88);
        const hp = this.add.graphics();
        const label = this.add
          .text(0, 7, u.name, {
            fontFamily: "sans-serif",
            fontSize: "8px",
            color: u.side === "party" ? "#e4e9c6" : "#dac6a4",
            stroke: "#17251b",
            strokeThickness: 2,
          })
          .setOrigin(0.5, 0);
        const container = this.add.container(u.x * sx, u.y * sy, [
          image,
          hp,
          label,
        ]);
        node = { container, image, hp, label };
        this.actors.set(u.id, node);
      }
      const blend = this.paused ? 1 : Math.min(1, delta / 50);
      node.container.x = Phaser.Math.Linear(node.container.x, u.x * sx, blend);
      node.container.y = Phaser.Math.Linear(node.container.y, u.y * sy, blend);
      node.container.setDepth(u.y);
      const walk =
        u.action === "move" && !this.paused
          ? Math.sin(displayTime * 14) * 1.5
          : 0;
      node.image
        .setScale(viewScale * 0.6 * (u.boss ? 1.16 : 1))
        .setFlipX(a.flipX)
        .setTint(a.tint);
      node.image.y = walk;
      const lastAttack = [...b.events]
        .reverse()
        .find((e) => e.sourceId === u.id && e.type === "attack");
      if (lastAttack && !this.paused) {
        const age = displayTime - lastAttack.time;
        if (age < 0.22) {
          const direction =
            u.direction === "left" ? -1 : u.direction === "right" ? 1 : 0;
          node.image.x = Math.sin((age / 0.22) * Math.PI) * direction * 5;
          node.image.y +=
            Math.sin((age / 0.22) * Math.PI) * (u.side === "party" ? -4 : 4);
        } else node.image.x = 0;
      }
      if (u.hp <= 0) {
        const death = b.events.find(
          (e) => e.type === "death" && e.targetId === u.id,
        );
        const age = death ? Math.min(1, (displayTime - death.time) / 0.6) : 1;
        node.image.setAngle(90 * age);
        node.container.setAlpha(0.35);
        node.hp.setVisible(false);
        node.label.setAlpha(0.6);
      } else {
        node.container.setAlpha(u.escaped ? 0.15 : 1);
        node.image.setAngle(0);
        node.hp.clear();
        node.hp.fillStyle(0x13241b);
        node.hp.fillRect(-15, -42 * viewScale, 30, 4);
        node.hp.fillStyle(u.side === "party" ? 0xb6cb86 : 0xcd9676);
        node.hp.fillRect(-14, -42 * viewScale + 1, (28 * u.hp) / u.maxHp, 2);
        if (u.shield > 0) {
          node.hp.fillStyle(0x9fd7e4);
          node.hp.fillRect(-14, -42 * viewScale - 3, 28, 2);
        }
      }
    }
    const missileIds = new Set(b.projectiles.map((p) => p.id));
    for (const [id, g] of this.missiles)
      if (!missileIds.has(id)) {
        g.destroy();
        this.missiles.delete(id);
      }
    for (const p of b.projectiles) {
      let g = this.missiles.get(p.id);
      if (!g) {
        g = this.add.graphics().setDepth(500);
        if (p.kind === "arrow") {
          g.lineStyle(2, 0xe4d79e);
          g.lineBetween(-5, 0, 5, 0);
          g.fillStyle(0xe9e3c9);
          g.fillTriangle(6, 0, 2, -3, 2, 3);
        } else {
          g.fillStyle(0xbb9be4, 0.3);
          g.fillCircle(0, 0, 6);
          g.fillStyle(0xe4bcff);
          g.fillCircle(0, 0, 3);
        }
        this.missiles.set(p.id, g);
      }
      const target = b.units.find((u) => u.id === p.targetId);
      g.setPosition(p.x * sx, p.y * sy);
      if (target)
        g.rotation = Math.atan2((target.y - p.y) * sy, (target.x - p.x) * sx);
    }
    for (const e of b.events) {
      if (!["damage", "heal", "skill"].includes(e.type)) continue;
      const age = displayTime - e.time;
      if (age > 1.2) continue;
      let text = this.numbers.get(e.id);
      if (!text) {
        text = this.add
          .text(
            e.x * sx,
            e.y * sy - 28,
            e.type === "skill"
              ? (e.label ?? "")
              : e.type === "heal"
                ? `+${e.amount}`
                : e.amount === 0
                  ? "방어"
                  : `-${e.amount}`,
            {
              fontFamily: "sans-serif",
              fontSize: e.type === "skill" ? "9px" : "13px",
              color:
                e.type === "heal"
                  ? "#b7e8a0"
                  : e.type === "skill"
                    ? "#eadba4"
                    : "#ffe0ba",
              stroke: "#1a261b",
              strokeThickness: 3,
            },
          )
          .setOrigin(0.5)
          .setDepth(600);
        this.numbers.set(e.id, text);
      }
      text
        .setPosition(
          e.x * sx,
          e.y * sy - 25 - age * 23 - (e.type === "skill" ? 18 : 0),
        )
        .setAlpha(Math.max(0, 1 - age / 1.2));
    }
    for (const [id, text] of this.numbers) {
      const e = b.events.find((e) => e.id === id);
      if (!e || displayTime - e.time > 1.2) {
        text.destroy();
        this.numbers.delete(id);
      }
    }
  }
}
