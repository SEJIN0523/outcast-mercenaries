import { CLASSES, EQUIPMENT } from "../data/catalog";
import type { Mercenary } from "../domain/types";
import type { Direction } from "../domain/combat/types";
import { pixelPainter, shade } from "./pixels";
export const SPRITE_SPEC = {
  width: 64,
  height: 80,
  feet: { x: 32, y: 74 },
  directions: ["down", "left", "right", "up"],
  walkFrames: 4,
} as const;
export type SpriteLayer =
  | "shadow"
  | "hairBack"
  | "body"
  | "armor"
  | "face"
  | "hair"
  | "weapon"
  | "shield";
export const SPRITE_LAYERS: SpriteLayer[] = [
  "shadow",
  "hairBack",
  "body",
  "armor",
  "face",
  "hair",
  "weapon",
  "shield",
];
/** Shared layered 64×80 composition. Direction/frame are presentation only. */
export function drawMercenary(
  ctx: CanvasRenderingContext2D,
  m: Mercenary,
  direction: Direction = "down",
  frame = 0,
  onlyLayer?: SpriteLayer,
) {
  ctx.clearRect(0, 0, 64, 80);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (direction === "left") {
    ctx.translate(64, 0);
    ctx.scale(-1, 1);
  }
  const { rect: r, poly: p } = pixelPainter(ctx),
    skin = m.appearance.skinColor,
    hair = m.appearance.hairColor;
  const ink = "#242638",
    gold = "#d7b66d",
    light = "#f4dfa0",
    steel = "#9eafbc",
    darkSteel = "#536579";
  const color = CLASSES[m.classId].color,
    shadow = shade(color, -35),
    shine = shade(color, 32),
    skinDark = shade(skin, -35),
    skinLight = shade(skin, 19);
  const back = direction === "up",
    side = direction === "left" || direction === "right",
    female = m.gender === "female",
    short = m.race === "dwarf" ? 5 : 0,
    wide =
      m.appearance.bodyType === 2 ? 2 : m.appearance.bodyType === 1 ? -1 : 0;
  const stride = [0, 2, 0, -2][frame % 4],
    bob = frame % 2 === 1 ? -1 : 0,
    hy = short + bob,
    long = m.appearance.hairStyle === 1 || m.appearance.hairStyle === 2;
  const layer = (id: SpriteLayer, f: () => void) => {
    if (!onlyLayer || onlyLayer === id) f();
  };
  layer("shadow", () => {
    r(19, 73, 26, 2, "#14222e66");
    r(23, 75, 18, 1, "#14222e33");
  });
  layer("hairBack", () => {
    if (long) {
      const length = m.appearance.hairStyle === 1 ? 34 : 49;
      p(
        [
          [21, 17 + hy],
          [43, 17 + hy],
          [46, length + hy],
          [39, length + 4 + hy],
          [19, length - 1 + hy],
        ],
        shade(hair, -32),
      );
      r(21, 24 + hy, 3, length - 24, shade(hair, -12));
    }
  });
  layer("body", () => {
    // Split legs, boot cuffs, soles and visible hands.
    r(23 - wide, 53, 8, 19 + stride, ink);
    r(34, 53, 8 + wide, 19 - stride, ink);
    r(24 - wide, 55, 5, 13 + stride, "#555168");
    r(35, 55, 5 + wide, 13 - stride, "#3c3e53");
    r(21 - wide, 66 + stride, 10 + wide, 7, "#4e3a38");
    r(33, 66 - stride, 11 + wide, 7, "#4e3a38");
    r(22 - wide, 67 + stride, 3, 4, "#9a7553");
    r(34, 67 - stride, 3, 4, "#9a7553");
    r(21 - wide, 72 + stride, 11 + wide, 2, ink);
    r(33, 72 - stride, 12 + wide, 2, ink);
    r(16 - wide, 38 + hy, 7, 17, ink);
    r(42 + wide, 38 + hy, 7, 17, ink);
    r(17 - wide, 41 + hy, 5, 12, skinDark);
    r(18 - wide, 42 + hy, 3, 9, skin);
    r(43 + wide, 41 + hy, 5, 12, skin);
    r(25, 27 + hy, 13, 10, ink);
    r(27, 28 + hy, 9, 8, skinDark);
  });
  layer("armor", () => {
    const robe = ["mage", "priest", "bard"].includes(m.classId),
      plate = ["warrior", "guardian", "lancer"].includes(m.classId);
    p(
      [
        [22 - wide, 33 + hy],
        [40 + wide, 33 + hy],
        [46 + wide, 42 + hy],
        [42 + wide, 55],
        [45 + wide, 62],
        [19 - wide, 62],
        [22 - wide, 51],
        [17 - wide, 42 + hy],
      ],
      ink,
    );
    p(
      [
        [23 - wide, 35 + hy],
        [39 + wide, 35 + hy],
        [43 + wide, 42 + hy],
        [39 + wide, 53],
        [43 + wide, 60],
        [21 - wide, 60],
        [24 - wide, 51],
        [20 - wide, 41 + hy],
      ],
      shadow,
    );
    r(24 - wide, 36 + hy, 15 + wide, 19 - short, color);
    r(25 - wide, 37 + hy, 3, 15 - short, shine);
    r(37, 39 + hy, 3 + wide, 15 - short, shadow);
    // Shoulder caps and cuffs.
    p(
      [
        [18 - wide, 35 + hy],
        [24, 34 + hy],
        [25, 43 + hy],
        [16 - wide, 43 + hy],
      ],
      plate ? darkSteel : shadow,
    );
    r(18 - wide, 36 + hy, 6 + wide, 3, plate ? steel : shine);
    r(41, 36 + hy, 7 + wide, 7, plate ? darkSteel : shadow);
    r(42, 36 + hy, 5 + wide, 2, plate ? steel : shine);
    r(16 - wide, 50 + hy, 7, 4, shade(color, -45));
    r(42 + wide, 50 + hy, 7, 4, shade(color, -45));
    r(17 - wide, 50 + hy, 5, 1, gold);
    if (robe) {
      p(
        [
          [24, 48],
          [39, 48],
          [46, 67],
          [18, 67],
        ],
        ink,
      );
      p(
        [
          [25, 49],
          [38, 49],
          [43, 65],
          [21, 65],
        ],
        color,
      );
      p(
        [
          [30, 50],
          [33, 50],
          [35, 65],
          [26, 65],
        ],
        shine,
      );
      r(21, 64, 22, 2, gold);
      r(25, 55, 2, 8, shadow);
      r(38, 55, 2, 8, shadow);
    }
    if (female && !robe) {
      p(
        [
          [24, 51],
          [39, 51],
          [45, 63],
          [19, 63],
        ],
        ink,
      );
      p(
        [
          [25, 52],
          [38, 52],
          [42, 61],
          [22, 61],
        ],
        color,
      );
      r(23, 60, 18, 1, gold);
      r(27, 54, 2, 6, shine);
      r(36, 54, 2, 6, shadow);
    }
    r(22 - wide, 52, 20 + wide * 2, 3, "#654533");
    r(29, 52, 6, 4, gold);
    r(31, 53, 2, 2, ink);
    if (back) {
      r(27, 35 + hy, 9, 15, shadow);
      r(29, 36 + hy, 2, 13, color);
    } else {
      p(
        [
          [26, 34 + hy],
          [31, 38 + hy],
          [37, 34 + hy],
          [35, 42 + hy],
          [29, 42 + hy],
        ],
        gold,
      );
      r(30, 35 + hy, 3, 4, light);
    }
    if (m.classId === "warrior") {
      r(26, 41 + hy, 12, 7, darkSteel);
      r(26, 41 + hy, 10, 2, steel);
      r(29, 44 + hy, 6, 1, "#d2d9cf");
    }
    if (m.classId === "archer") {
      p(
        [
          [24, 35 + hy],
          [27, 35 + hy],
          [41, 53],
          [37, 53],
        ],
        "#866445",
      );
      r(35, 44 + hy, 4, 6, "#bc9560");
      r(36, 45 + hy, 2, 2, gold);
    }
    if (m.classId === "rogue") {
      r(25, 35 + hy, 13, 4, "#9c7188");
      p(
        [
          [36, 37 + hy],
          [41, 38 + hy],
          [46, 49],
          [40, 47],
        ],
        "#79536e",
      );
      r(24, 46, 4, 5, "#77615b");
    }
    if (m.classId === "priest") {
      r(29, 40 + hy, 6, 16, "#ecdfbb");
      r(25, 44 + hy, 14, 3, gold);
      r(30, 41 + hy, 3, 11, gold);
    }
    if (m.classId === "mage") {
      r(31, 42 + hy, 2, 13, gold);
      r(29, 46 + hy, 6, 1, light);
      r(30, 52, 4, 3, "#9ce0d3");
    }
    if (m.classId === "lancer") {
      r(26, 39 + hy, 13, 9, darkSteel);
      r(27, 40 + hy, 11, 2, steel);
      r(27, 44 + hy, 11, 1, steel);
    }
    if (m.classId === "guardian") {
      r(25, 39 + hy, 15, 11, darkSteel);
      r(26, 40 + hy, 13, 2, steel);
      p(
        [
          [31, 42 + hy],
          [35, 42 + hy],
          [34, 47 + hy],
          [32, 49 + hy],
          [30, 46 + hy],
        ],
        gold,
      );
    }
    if (m.classId === "bard") {
      r(24, 38 + hy, 5, 12, "#e3c99e");
      r(27, 40 + hy, 2, 8, gold);
      r(36, 39 + hy, 2, 13, gold);
    }
  });
  layer("face", () => {
    p(
      [
        [24, 11 + hy],
        [39, 11 + hy],
        [44, 17 + hy],
        [43, 27 + hy],
        [37, 33 + hy],
        [27, 33 + hy],
        [21, 27 + hy],
        [20, 18 + hy],
      ],
      ink,
    );
    p(
      [
        [25, 13 + hy],
        [38, 13 + hy],
        [42, 18 + hy],
        [41, 26 + hy],
        [36, 31 + hy],
        [28, 31 + hy],
        [23, 26 + hy],
        [22, 18 + hy],
      ],
      skinDark,
    );
    r(24, 15 + hy, 15, 11, skin);
    r(26, 16 + hy, 11, 11, skinLight);
    r(27, 27 + hy, 10, 3, skin);
    if (m.race === "elf") {
      p(
        [
          [23, 19 + hy],
          [13, 17 + hy],
          [18, 24 + hy],
          [23, 25 + hy],
        ],
        skinDark,
      );
      p(
        [
          [41, 19 + hy],
          [51, 17 + hy],
          [46, 24 + hy],
          [41, 25 + hy],
        ],
        skin,
      );
      r(46, 19 + hy, 3, 1, skinLight);
    }
    if (!back) {
      if (side) {
        r(37, 22 + hy, 4, 4, ink);
        r(38, 22 + hy, 1, 1, "#f8efd9");
        r(42, 25 + hy, 2, 2, skin);
        r(37, 29 + hy, 3, 1, "#a86e68");
      } else {
        r(25, 22 + hy, 4, 4, ink);
        r(36, 22 + hy, 4, 4, ink);
        r(26, 23 + hy, 2, 2, "#7893a0");
        r(37, 23 + hy, 2, 2, "#7893a0");
        r(26, 22 + hy, 1, 1, "#fff5df");
        r(37, 22 + hy, 1, 1, "#fff5df");
        r(31, 27 + hy, 2, 1, skinDark);
        r(30, 29 + hy, 4, 1, "#a86e68");
        if (female) {
          r(24, 27 + hy, 3, 1, "#cf8b83");
          r(38, 27 + hy, 3, 1, "#cf8b83");
        }
      }
    }
    if (m.race === "dwarf" && !female && !back) {
      p(
        [
          [24, 27 + hy],
          [30, 30 + hy],
          [38, 28 + hy],
          [39, 35 + hy],
          [32, 39 + hy],
          [25, 35 + hy],
        ],
        shade(hair, -20),
      );
      r(28, 32 + hy, 2, 3, hair);
    }
  });
  layer("hair", () => {
    p(
      [
        [24, 9 + hy],
        [38, 9 + hy],
        [43, 13 + hy],
        [45, 21 + hy],
        [41, 25 + hy],
        [40, 17 + hy],
        [34, 18 + hy],
        [31, 15 + hy],
        [27, 20 + hy],
        [23, 18 + hy],
        [23, 27 + hy],
        [19, 23 + hy],
        [20, 14 + hy],
      ],
      ink,
    );
    p(
      [
        [25, 10 + hy],
        [37, 10 + hy],
        [42, 14 + hy],
        [43, 20 + hy],
        [41, 22 + hy],
        [39, 15 + hy],
        [34, 17 + hy],
        [31, 13 + hy],
        [26, 18 + hy],
        [22, 17 + hy],
        [22, 24 + hy],
        [20, 21 + hy],
        [22, 14 + hy],
      ],
      hair,
    );
    r(25, 11 + hy, 12, 2, shade(hair, 28));
    r(23, 14 + hy, 4, 2, shade(hair, 18));
    r(38, 14 + hy, 3, 4, shade(hair, -25));
    if (back) {
      p(
        [
          [22, 16 + hy],
          [42, 16 + hy],
          [42, 27 + hy],
          [37, 31 + hy],
          [27, 31 + hy],
          [22, 27 + hy],
        ],
        hair,
      );
      r(24, 19 + hy, 3, 8, shade(hair, 18));
      r(38, 20 + hy, 3, 7, shade(hair, -25));
    }
    if (m.appearance.hairStyle === 1) {
      r(19, 22 + hy, 4, 10, shade(hair, -20));
      r(41, 22 + hy, 4, 11, hair);
      r(20, 31 + hy, 4, 2, ink);
      r(41, 32 + hy, 4, 2, ink);
    }
    if (m.appearance.hairStyle === 2) {
      r(19, 22 + hy, 4, 22, shade(hair, -20));
      r(20, 23 + hy, 1, 17, hair);
      r(41, 22 + hy, 4, 23, hair);
      r(42, 24 + hy, 1, 17, shade(hair, 24));
      r(41, 41 + hy, 3, 3, gold);
    }
    if (m.appearance.hairStyle === 3) {
      p(
        [
          [41, 13 + hy],
          [49, 14 + hy],
          [48, 29 + hy],
          [51, 36 + hy],
          [45, 34 + hy],
          [44, 22 + hy],
        ],
        ink,
      );
      r(44, 16 + hy, 3, 15, hair);
      r(44, 18 + hy, 4, 2, gold);
    }
    if (m.classId === "mage") {
      p(
        [
          [17, 15 + hy],
          [24, 8 + hy],
          [29, 0 + hy],
          [39, 9 + hy],
          [44, 15 + hy],
        ],
        ink,
      );
      p(
        [
          [21, 13 + hy],
          [29, 3 + hy],
          [38, 10 + hy],
          [40, 13 + hy],
        ],
        shadow,
      );
      r(17, 14 + hy, 29, 3, color);
      r(22, 14 + hy, 17, 1, gold);
    }
    if (m.classId === "priest") {
      r(23, 11 + hy, 18, 3, "#ede2c5");
      r(30, 10 + hy, 4, 5, gold);
      r(31, 11 + hy, 2, 2, light);
    }
    if (m.classId === "bard") {
      p(
        [
          [19, 13 + hy],
          [26, 5 + hy],
          [40, 8 + hy],
          [44, 14 + hy],
        ],
        shadow,
      );
      r(19, 13 + hy, 26, 3, color);
      p(
        [
          [39, 11 + hy],
          [45, 3 + hy],
          [46, 10 + hy],
        ],
        light,
      );
      r(24, 13 + hy, 13, 1, gold);
    }
  });
  layer("weapon", () => {
    const key = EQUIPMENT[m.equipment.weapon]?.spriteKey ?? "weapon/iron-sword",
      wy = frame % 2 ? 1 : 0;
    ctx.save();
    ctx.translate(0, wy);
    if (key.includes("bow")) {
      p(
        [
          [50, 26],
          [56, 32],
          [58, 44],
          [55, 57],
          [50, 62],
          [52, 54],
          [54, 44],
          [52, 33],
        ],
        ink,
      );
      p(
        [
          [50, 28],
          [54, 33],
          [56, 44],
          [53, 56],
          [50, 60],
          [51, 54],
          [53, 44],
          [51, 34],
        ],
        "#b68b54",
      );
      r(50, 29, 1, 31, "#ead9b1");
      r(48, 42, 9, 3, "#76553e");
    } else if (key.includes("staff") || key.includes("spear")) {
      r(50, 19, 4, 52, ink);
      r(51, 20, 2, 49, "#99704d");
      r(51, 27, 1, 39, "#c9a271");
      if (key.includes("spear")) {
        p(
          [
            [52, 4],
            [57, 17],
            [53, 26],
            [48, 18],
          ],
          ink,
        );
        p(
          [
            [52, 7],
            [55, 17],
            [52, 23],
            [50, 17],
          ],
          steel,
        );
        r(52, 9, 1, 11, "#e1e6d9");
        r(48, 25, 8, 3, gold);
      } else {
        p(
          [
            [51, 9],
            [58, 15],
            [55, 23],
            [48, 24],
            [44, 17],
          ],
          ink,
        );
        p(
          [
            [51, 11],
            [56, 16],
            [53, 22],
            [48, 21],
            [46, 17],
          ],
          gold,
        );
        p(
          [
            [51, 12],
            [54, 16],
            [51, 21],
            [48, 17],
          ],
          "#7bbebc",
        );
        r(50, 14, 2, 3, "#d2f4df");
      }
    } else if (key.includes("lute")) {
      p(
        [
          [49, 33],
          [53, 33],
          [52, 48],
          [58, 53],
          [57, 62],
          [50, 66],
          [43, 61],
          [43, 53],
          [48, 48],
        ],
        ink,
      );
      r(49, 35, 3, 19, "#d7ad6b");
      p(
        [
          [48, 49],
          [53, 49],
          [56, 54],
          [55, 60],
          [50, 63],
          [45, 59],
          [45, 54],
        ],
        "#bf8550",
      );
      r(49, 52, 4, 5, "#654637");
      r(50, 36, 1, 26, "#f0d19a");
      r(45, 55, 1, 4, "#e3b97a");
    } else {
      const dagger = key.includes("dagger"),
        top = dagger ? 39 : 23;
      p(
        [
          [51, top],
          [55, top + 6],
          [54, 56],
          [48, 56],
          [48, top + 6],
        ],
        ink,
      );
      p(
        [
          [51, top + 2],
          [53, top + 7],
          [52, 55],
          [49, 55],
          [49, top + 7],
        ],
        steel,
      );
      r(50, top + 6, 1, 49 - top, "#e3e6de");
      r(45, 55, 13, 4, ink);
      r(46, 56, 11, 2, gold);
      r(50, 59, 3, 8, "#8f6549");
      r(49, 67, 5, 2, gold);
    }
    ctx.restore();
  });
  layer("shield", () => {
    if (m.classId !== "guardian") return;
    p(
      [
        [8, 40],
        [24, 40],
        [25, 55],
        [16, 65],
        [7, 55],
      ],
      ink,
    );
    p(
      [
        [10, 42],
        [22, 42],
        [23, 54],
        [16, 62],
        [9, 54],
      ],
      gold,
    );
    p(
      [
        [12, 44],
        [20, 44],
        [21, 53],
        [16, 58],
        [11, 53],
      ],
      darkSteel,
    );
    r(15, 44, 3, 13, steel);
    r(11, 49, 10, 3, steel);
    r(15, 49, 3, 3, light);
  });
  ctx.restore();
}
const cache = new Map<string, string>();
export function portrait(m: Mercenary) {
  const key = JSON.stringify([
    m.appearance,
    m.gender,
    m.race,
    m.classId,
    m.equipment,
  ]);
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 80;
  drawMercenary(c.getContext("2d")!, m);
  const url = c.toDataURL();
  cache.set(key, url);
  if (cache.size > 150) cache.delete(cache.keys().next().value!);
  return url;
}
