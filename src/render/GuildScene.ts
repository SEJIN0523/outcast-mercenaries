import Phaser from "phaser";
import { store } from "../state/store";
import { combatParty } from "../domain/guild";
import { random } from "../domain/random";
import { appearanceSignature } from "../domain/appearance";
import { drawMercenary } from "./sprite";

export class GuildScene extends Phaser.Scene {
  private actors: Phaser.GameObjects.Container | undefined;
  private unsubscribe: (() => void) | undefined;
  private lastKey = "";
  constructor() {
    super("guild");
  }
  create() {
    const texture = this.textures.createCanvas("landscape", 480, 180)!;
    const c = texture.context;
    const rng = random("headquarters-forest");
    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
    ) => {
      c.fillStyle = color;
      c.fillRect(x, y, w, h);
    };
    const poly = (points: number[][], color: string) => {
      c.fillStyle = color;
      c.beginPath();
      points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.fill();
    };
    const gradient = c.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, "#253b42");
    gradient.addColorStop(0.6, "#687d72");
    gradient.addColorStop(1, "#253f39");
    c.fillStyle = gradient;
    c.fillRect(0, 0, 480, 180);
    rect(363, 24, 20, 20, "#dddbaf");
    rect(359, 28, 28, 12, "#dddbaf");
    rect(363, 24, 8, 4, "#ebe6bc");
    for (let i = 0; i < 25; i++)
      rect(Math.floor(rng() * 480), Math.floor(rng() * 60), 1, 1, "#d3dbbf88");
    poly(
      [
        [0, 97],
        [60, 41],
        [96, 73],
        [147, 22],
        [211, 85],
        [264, 36],
        [320, 83],
        [401, 42],
        [480, 91],
        [480, 150],
        [0, 150],
      ],
      "#3c5456",
    );
    poly(
      [
        [0, 108],
        [93, 70],
        [149, 98],
        [229, 55],
        [300, 111],
        [358, 73],
        [435, 103],
        [480, 63],
        [480, 150],
        [0, 150],
      ],
      "#45605a",
    );
    function pine(x: number, y: number, s: number, col: string) {
      rect(x - 2 * s, y - 24 * s, 4 * s, 32 * s, "#3b4840");
      for (let i = 0; i < 4; i++)
        poly(
          [
            [x, y - (60 - i * 12) * s],
            [x - (10 + i * 4) * s, y - (37 - i * 12) * s],
            [x + (10 + i * 4) * s, y - (37 - i * 12) * s],
          ],
          col,
        );
    }
    for (let i = 0; i < 30; i++)
      pine(i * 19 - 25, 115 + rng() * 18, 0.6 + rng() * 0.5, "#2c4943");
    rect(0, 124, 480, 56, "#354f3d");
    poly(
      [
        [253, 119],
        [274, 119],
        [340, 180],
        [136, 180],
      ],
      "#8c8864",
    );
    poly(
      [
        [258, 122],
        [266, 122],
        [292, 180],
        [217, 180],
      ],
      "#aaa17b",
    );
    for (let i = 0; i < 500; i++) {
      const x = Math.floor(rng() * 480),
        y = 125 + Math.floor(rng() * 55);
      rect(
        x,
        y,
        1 + Math.floor(rng() * 4),
        1,
        rng() > 0.5 ? "#58734c" : "#233e33",
      );
    }
    for (let i = 0; i < 80; i++) {
      const y = 134 + rng() * 46;
      const x = 238 + (rng() - 0.5) * (y - 110) * 2;
      if (x > 145 && x < 340) rect(x, y, 2 + rng() * 3, 1, "#c6b58a55");
    }
    // The old wayfarer's inn: stone foundation, timber walls, tiled roof.
    rect(66, 93, 135, 61, "#343c32");
    rect(70, 82, 127, 65, "#bca77a");
    rect(73, 87, 121, 59, "#c5b082");
    poly(
      [
        [57, 88],
        [130, 34],
        [211, 88],
      ],
      "#262e2c",
    );
    poly(
      [
        [62, 84],
        [130, 38],
        [205, 84],
      ],
      "#6e4d3a",
    );
    for (let row = 0; row < 8; row++) {
      const y = 43 + row * 5;
      const half = (y - 38) * 1.44;
      for (let x = 130 - half; x < 130 + half; x += 10)
        rect(Math.floor(x), y, 9, 2, row % 2 ? "#9b6b44" : "#835a3c");
    }
    rect(54, 84, 156, 5, "#372f29");
    rect(126, 39, 7, 45, "#312f2b");
    rect(78, 89, 5, 56, "#524633");
    rect(123, 88, 6, 59, "#524633");
    rect(188, 89, 5, 57, "#524633");
    rect(73, 112, 120, 4, "#655237");
    poly(
      [
        [83, 89],
        [120, 110],
        [120, 105],
        [91, 89],
      ],
      "#655237",
    );
    poly(
      [
        [134, 110],
        [181, 89],
        [174, 89],
        [134, 105],
      ],
      "#655237",
    );
    rect(92, 96, 19, 24, "#554835");
    rect(94, 98, 15, 19, "#e7bc6a");
    rect(96, 100, 4, 15, "#f5d58c");
    rect(100, 98, 2, 19, "#69553a");
    rect(94, 107, 15, 2, "#69553a");
    rect(90, 119, 23, 3, "#796044");
    rect(151, 96, 23, 21, "#5f4934");
    rect(154, 98, 17, 16, "#e5b76a");
    rect(161, 98, 2, 16, "#66543a");
    rect(154, 106, 17, 2, "#66543a");
    rect(149, 117, 27, 3, "#796044");
    rect(132, 121, 20, 29, "#473d30");
    rect(135, 123, 14, 27, "#6d553a");
    rect(137, 125, 2, 23, "#8a6c45");
    rect(146, 136, 2, 2, "#e0c47f");
    rect(129, 149, 27, 4, "#8b8d75");
    rect(125, 153, 35, 3, "#666e5c");
    rect(70, 145, 58, 8, "#707664");
    rect(160, 145, 37, 8, "#707664");
    for (let x = 72; x < 195; x += 15) rect(x, 148, 13, 2, "#92937b");
    rect(171, 43, 12, 26, "#655f4e");
    rect(168, 42, 18, 5, "#7d7a64");
    rect(171, 35, 12, 5, "#a9b4a277");
    rect(175, 26, 12, 5, "#a9b4a244");
    rect(181, 17, 14, 5, "#a9b4a222");
    // Tavern sign, barrels, fence, warm lantern.
    rect(200, 98, 3, 31, "#766044");
    rect(202, 98, 27, 3, "#766044");
    rect(209, 103, 18, 17, "#312e26");
    rect(211, 105, 14, 13, "#ad8e50");
    rect(216, 108, 4, 8, "#e2c77e");
    rect(213, 111, 10, 2, "#e2c77e");
    [58, 203].forEach((x) => {
      rect(x, 139, 13, 15, "#8a6942");
      rect(x - 1, 141, 15, 2, "#464a3b");
      rect(x - 1, 150, 15, 2, "#464a3b");
      rect(x + 3, 141, 2, 9, "#af8753");
    });
    for (let x = 305; x < 459; x += 20) {
      rect(x, 135, 3, 17, "#8d835a");
      rect(x - 1, 134, 5, 3, "#b1a172");
    }
    rect(305, 140, 156, 3, "#7c7954");
    rect(305, 147, 156, 2, "#635f47");
    for (let i = 0; i < 9; i++)
      pine(
        335 + i * 22,
        132 + rng() * 15,
        1.2 + rng() * 0.35,
        i % 2 ? "#243d32" : "#1c352f",
      );
    pine(22, 154, 1.8, "#1b352e");
    pine(477, 165, 2.0, "#1a322b");
    for (let i = 0; i < 30; i++) {
      const x = rng() * 480,
        y = 149 + rng() * 30;
      if (x > 100 && x < 300) continue;
      rect(x, y, 2, 2, i % 3 ? "#c5b776" : "#c9a792");
      rect(x, y + 2, 1, 3, "#6b8351");
    }
    // Foreground foliage.
    for (let i = 0; i < 75; i++) {
      const x = rng() * 480;
      rect(x, 176 - rng() * 5, 3, 6, "#1d362b");
      rect(x + 2, 172 - rng() * 4, 2, 8, "#284733");
    }
    texture.refresh();
    this.add.image(480, 180, "landscape").setScale(2);
    const shade = this.add.graphics();
    shade.fillStyle(0x101e1b, 0.2);
    shade.fillRect(0, 0, 960, 360);
    this.actors = this.add.container();
    for (let i = 0; i < 12; i++) {
      const dot = this.add.rectangle(
        40 + rng() * 880,
        140 + rng() * 160,
        2,
        2,
        0xe8ce84,
        0.65,
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - 18,
        alpha: 0,
        duration: 2200 + rng() * 3000,
        delay: rng() * 3000,
        yoyo: true,
        repeat: -1,
      });
    }
    this.refresh();
    this.unsubscribe = store.subscribe(() => this.refresh());
    const cleanup = () => {
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.events.off("shutdown", cleanup);
      this.events.off("destroy", cleanup);
    };
    this.events.once("shutdown", cleanup);
    this.events.once("destroy", cleanup);
  }
  private refresh() {
    const { guild, battle } = store.getSnapshot();
    const key = JSON.stringify([
      guild.party,
      guild.roster.map((m) => [m.id, m.level, appearanceSignature(m)]),
      battle?.tick,
      battle?.elapsed,
      battle?.status,
    ]);
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.actors!.each((actor: Phaser.GameObjects.GameObject) =>
      this.tweens.killTweensOf(actor),
    );
    this.actors!.removeAll(true);
    const party = battle
      ? battle.units.filter((u) => u.side === "party")
      : combatParty(guild).map((mercenary) => ({
          id: mercenary.id,
          hp: 1,
          maxHp: 1,
          mercenary,
        }));
    party.forEach((unit, i) => {
      const m = unit.mercenary!;
      const textureKey = `sprite-${m.id}:${appearanceSignature(m)}`;
      if (!this.textures.exists(textureKey)) {
        const texture = this.textures.createCanvas(textureKey, 64, 80)!;
        drawMercenary(texture.context, m);
        texture.refresh();
      }
      const x = battle ? 300 - i * 67 : 365 + i * 76,
        y = 275 + (i % 2) * 15;
      const actor = this.add
        .image(x, y, textureKey)
        .setScale(1.25)
        .setAlpha(unit.hp <= 0 ? 0.3 : 1);
      this.actors!.add(actor);
      if (unit.hp > 0)
        this.tweens.add({
          targets: actor,
          y: y - 3,
          duration: 1000 + i * 130,
          yoyo: true,
          repeat: -1,
        });
      this.actors!.add(
        this.add
          .text(x, y + 56, `${m.name}  Lv.${m.level}`, {
            fontFamily: "sans-serif",
            fontSize: "12px",
            color: "#f0e3bf",
            backgroundColor: "#18251edb",
            padding: { x: 6, y: 4 },
          })
          .setOrigin(0.5),
      );
      if (battle) this.bar(x, y - 52, unit.hp / unit.maxHp, 0x94b57a);
    });
    if (battle)
      battle.units
        .filter((u) => u.side === "enemy")
        .forEach((u, i) => {
          const x = 625 + i * 85,
            y = 264 + (i % 2) * 20;
          const g = this.add.graphics();
          const rect = (
            dx: number,
            dy: number,
            w: number,
            h: number,
            col: number,
          ) => {
            g.fillStyle(col);
            g.fillRect(x + dx, y + dy, w, h);
          };
          rect(-12, 16, 9, 17, 0x554e35);
          rect(5, 16, 9, 17, 0x554e35);
          rect(-17, -10, 34, 29, 0x6b7947);
          rect(-16, -28, 32, 25, 0x9aaa5a);
          rect(-23, -22, 11, 8, 0x8c9a4f);
          rect(13, -22, 11, 8, 0x8c9a4f);
          rect(-9, -20, 5, 5, 0xe4ce79);
          rect(6, -20, 5, 5, 0xe4ce79);
          rect(-4, -8, 10, 3, 0x42452c);
          rect(-21, 1, 8, 16, 0x8e9e52);
          rect(19, 0, 5, 31, 0x8c6745);
          rect(15, -4, 14, 8, 0xaaaa8e);
          rect(-15, 17, 30, 5, 0x7e6341);
          if (u.hp <= 0) g.setAlpha(0.2);
          this.actors!.add(g);
          this.bar(x, y - 40, u.hp / u.maxHp, 0xc57f6b);
          this.actors!.add(
            this.add
              .text(x, y + 50, u.name, {
                fontFamily: "sans-serif",
                fontSize: "12px",
                color: "#e0cfaa",
                backgroundColor: "#18251edb",
                padding: { x: 5, y: 4 },
              })
              .setOrigin(0.5),
          );
          if (battle.tick > 0 && u.hp > 0) {
            g.x = 5;
            this.tweens.add({ targets: g, x: 0, duration: 160 });
          }
        });
  }
  private bar(x: number, y: number, value: number, color: number) {
    const g = this.add.graphics();
    g.fillStyle(0x17251e);
    g.fillRect(x - 28, y, 56, 5);
    g.fillStyle(color);
    g.fillRect(x - 27, y + 1, 54 * value, 3);
    this.actors!.add(g);
  }
}
