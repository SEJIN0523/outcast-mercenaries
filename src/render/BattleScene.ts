import Phaser from "phaser";
import { store } from "../state/store";
import { FIELD } from "../data/combat";
import { drawMercenary } from "./sprite";
import { drawGoblin } from "./goblin";
import { drawBattlefield } from "./battlefield";
import type { CombatUnit } from "../domain/combat/types";
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
  private backdrop!: Phaser.GameObjects.Image;
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
    if (!this.textures.exists("forest-clearing-v2")) {
      const t = this.textures.createCanvas("forest-clearing-v2", 360, 420)!;
      drawBattlefield(t.context);
      t.refresh();
    }
    this.backdrop = this.add
      .image(0, 0, "forest-clearing-v2")
      .setOrigin(0)
      .setDepth(-1);
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
    this.backdrop.setDisplaySize(this.scale.width, this.scale.height);
  }
  private texture(unit: CombatUnit, a: ReturnType<typeof combatAppearance>) {
    if (this.textures.exists(a.textureKey)) return;
    const t = this.textures.createCanvas(a.textureKey, 64, 80)!;
    if (unit.mercenary)
      drawMercenary(t.context, unit.mercenary, a.direction, a.frame);
    else drawGoblin(t.context, a.goblinKind, a.direction, a.frame);
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
      const a = combatAppearance(u, displayTime);
      this.texture(u, a);
      let node = this.actors.get(u.id);
      if (!node) {
        const image = this.add
          .image(0, 0, a.textureKey)
          .setOrigin(0.5, 74 / 80);
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
        .setTexture(a.textureKey)
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
