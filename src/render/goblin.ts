import { drawGeneratedGoblin } from "./generatedArt";
import type { Direction } from "../domain/combat/types";
import { pixelPainter } from "./pixels";
export type GoblinKind = "fighter" | "archer" | "chief";
export function drawGoblin(
  ctx: CanvasRenderingContext2D,
  kind: GoblinKind = "fighter",
  direction: Direction = "down",
  frame = 0,
) {
  if (drawGeneratedGoblin(ctx, kind, direction, frame)) return;
  ctx.clearRect(0, 0, 64, 80);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (direction === "left") {
    ctx.translate(64, 0);
    ctx.scale(-1, 1);
  }
  const { rect: r, poly: p } = pixelPainter(ctx),
    ink = "#252c30",
    skin = "#8da663",
    lit = "#b8c484",
    shade = "#5b794e",
    leather = "#805744",
    gold = "#cead67";
  const y = frame % 2 ? -1 : 0,
    stride = [0, 2, 0, -2][frame % 4];
  r(18, 73, 28, 2, "#14222e66");
  r(22, 53, 8, 19 + stride, ink);
  r(35, 53, 8, 19 - stride, ink);
  r(23, 57, 5, 11 + stride, shade);
  r(36, 57, 5, 11 - stride, skin);
  r(20, 68 + stride, 11, 6, "#51443b");
  r(34, 68 - stride, 11, 6, "#51443b");
  r(22, 69 + stride, 3, 2, "#a98a57");
  r(36, 69 - stride, 3, 2, "#a98a57");
  p(
    [
      [22, 32 + y],
      [40, 32 + y],
      [48, 43 + y],
      [44, 59],
      [19, 59],
      [14, 43 + y],
    ],
    ink,
  );
  p(
    [
      [23, 34 + y],
      [39, 34 + y],
      [45, 43 + y],
      [41, 57],
      [21, 57],
      [17, 43 + y],
    ],
    shade,
  );
  r(24, 36 + y, 15, 15, skin);
  r(26, 36 + y, 4, 13, lit);
  r(13, 42 + y, 7, 16, ink);
  r(14, 43 + y, 5, 13, skin);
  r(44, 42 + y, 7, 16, ink);
  r(45, 43 + y, 5, 13, shade);
  p(
    [
      [22, 13 + y],
      [40, 12 + y],
      [46, 21 + y],
      [42, 32 + y],
      [35, 37 + y],
      [25, 34 + y],
      [19, 25 + y],
    ],
    ink,
  );
  p(
    [
      [23, 15 + y],
      [39, 14 + y],
      [44, 21 + y],
      [40, 31 + y],
      [34, 34 + y],
      [26, 32 + y],
      [21, 25 + y],
    ],
    skin,
  );
  p(
    [
      [21, 19 + y],
      [7, 15 + y],
      [13, 27 + y],
      [22, 28 + y],
    ],
    ink,
  );
  p(
    [
      [21, 20 + y],
      [10, 18 + y],
      [15, 25 + y],
      [22, 25 + y],
    ],
    shade,
  );
  p(
    [
      [43, 18 + y],
      [57, 14 + y],
      [50, 27 + y],
      [42, 28 + y],
    ],
    ink,
  );
  p(
    [
      [44, 20 + y],
      [54, 17 + y],
      [49, 25 + y],
      [43, 25 + y],
    ],
    lit,
  );
  if (direction !== "up") {
    r(23, 22 + y, 7, 4, ink);
    r(35, 21 + y, 7, 4, ink);
    r(25, 23 + y, 3, 2, "#e5c278");
    r(36, 22 + y, 3, 2, "#e5c278");
    r(27, 23 + y, 1, 2, ink);
    r(36, 22 + y, 1, 2, ink);
    p(
      [
        [31, 23 + y],
        [35, 28 + y],
        [28, 29 + y],
      ],
      shade,
    );
    r(26, 31 + y, 13, 2, ink);
    r(27, 30 + y, 2, 3, "#e7dfb5");
    r(36, 30 + y, 2, 3, "#e7dfb5");
  } else {
    r(24, 17 + y, 14, 11, shade);
    r(24, 17 + y, 4, 8, skin);
  }
  // Torn leather jerkin and straps, different silhouettes per enemy role.
  p(
    [
      [21, 34 + y],
      [25, 34 + y],
      [29, 47],
      [39, 36 + y],
      [43, 37 + y],
      [40, 55],
      [22, 55],
    ],
    leather,
  );
  r(23, 37 + y, 3, 11, "#b48a5c");
  r(20, 54, 24, 4, ink);
  r(21, 54, 22, 2, "#b18b58");
  r(30, 54, 5, 4, gold);
  if (kind === "chief") {
    p(
      [
        [20, 15 + y],
        [19, 5 + y],
        [26, 10 + y],
        [31, 2 + y],
        [36, 10 + y],
        [43, 5 + y],
        [42, 16 + y],
      ],
      ink,
    );
    p(
      [
        [22, 14 + y],
        [21, 8 + y],
        [27, 13 + y],
        [31, 6 + y],
        [35, 13 + y],
        [41, 8 + y],
        [40, 15 + y],
      ],
      gold,
    );
    r(30, 11 + y, 3, 3, "#c56861");
    r(15, 35 + y, 11, 8, "#667783");
    r(16, 35 + y, 9, 2, "#a8b4b2");
    p(
      [
        [22, 38 + y],
        [27, 40 + y],
        [24, 52],
        [20, 50],
      ],
      "#a7534d",
    );
    r(45, 35, 4, 35, ink);
    r(46, 36, 2, 32, "#9b754f");
    p(
      [
        [46, 27],
        [58, 31],
        [59, 42],
        [46, 40],
      ],
      ink,
    );
    p(
      [
        [48, 29],
        [56, 32],
        [57, 39],
        [48, 37],
      ],
      "#9ea7a2",
    );
    r(49, 30, 5, 2, "#d5d4b8");
  } else if (kind === "archer") {
    p(
      [
        [21, 15 + y],
        [23, 9 + y],
        [39, 8 + y],
        [44, 17 + y],
      ],
      "#684c3f",
    );
    r(24, 10 + y, 13, 2, "#a08050");
    r(16, 32, 5, 18, "#a48a5d");
    r(15, 29, 1, 11, "#ddd0a1");
    r(19, 27, 1, 12, "#ddd0a1");
    p(
      [
        [50, 30],
        [56, 37],
        [57, 49],
        [51, 63],
        [52, 53],
        [54, 44],
        [51, 35],
      ],
      ink,
    );
    p(
      [
        [51, 33],
        [54, 38],
        [55, 49],
        [51, 59],
        [53, 48],
        [52, 38],
      ],
      "#c09860",
    );
    r(50, 32, 1, 29, "#ded1a4");
  } else {
    r(47, 35, 4, 34, ink);
    r(48, 37, 2, 30, "#997347");
    p(
      [
        [45, 30],
        [56, 31],
        [58, 43],
        [45, 42],
      ],
      ink,
    );
    r(46, 32, 9, 8, "#8b9991");
    r(47, 32, 7, 2, "#d1d3b5");
    r(12, 38, 9, 7, "#8f7150");
    r(13, 39, 7, 2, "#c1a474");
  }
  ctx.restore();
}
