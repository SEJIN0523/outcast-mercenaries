import { pixelPainter } from "./pixels";
import { random } from "../domain/random";
/** Fixed low-contrast arena: decorative borders do not add collision obstacles. */
export function drawBattlefield(ctx: CanvasRenderingContext2D) {
  const { rect: r, poly: p } = pixelPainter(ctx),
    rng = random("mosslight-clearing-v2");
  r(0, 0, 360, 420, "#304739");
  // A worn serpentine path; scanline polygons keep hard pixel edges.
  p(
    [
      [143, 0],
      [208, 0],
      [225, 95],
      [201, 170],
      [214, 251],
      [181, 332],
      [204, 420],
      [117, 420],
      [147, 326],
      [163, 244],
      [154, 164],
      [181, 86],
    ],
    "#5f6347",
  );
  p(
    [
      [157, 0],
      [193, 0],
      [209, 91],
      [184, 169],
      [197, 248],
      [164, 332],
      [180, 420],
      [140, 420],
      [161, 329],
      [179, 245],
      [171, 165],
      [193, 86],
    ],
    "#737257",
  );
  for (let i = 0; i < 1800; i++) {
    const x = Math.floor(rng() * 360),
      y = Math.floor(rng() * 420),
      c = ["#3d5540", "#496047", "#263e32", "#5b6b48"][i % 4];
    r(x, y, 1 + Math.floor(rng() * 3), 1, c);
    if (i % 9 === 0) r(x + 1, y - 2, 1, 3, c);
  }
  for (let i = 0; i < 100; i++) {
    const y = Math.floor(rng() * 420),
      x = Math.floor(168 + Math.sin(y / 55) * 16 + (rng() - 0.5) * 30);
    r(x, y, 3, 1, "#969070");
  }
  // Ferns, roots, mushrooms and stones stay near the edge for clear combat silhouettes.
  for (let i = 0; i < 20; i++) {
    const x = i % 2 ? 344 + Math.floor(rng() * 9) : 6 + Math.floor(rng() * 11),
      y = 10 + i * 20;
    r(x, y, 2, 13, "#192f2a");
    for (let j = 0; j < 3; j++) {
      r(x - 5 + j, y + j * 3, 5 - j, 2, "#547344");
      r(x + 2, y + j * 3, 5 - j, 2, "#789052");
    }
    if (i % 3 === 0) {
      r(x + 8, y + 11, 2, 5, "#c4ad7d");
      r(x + 6, y + 10, 6, 2, "#ac6c55");
      r(x + 7, y + 9, 4, 1, "#d49868");
    }
  }
  for (let i = 0; i < 12; i++) {
    const x = i % 2 ? 330 : 15,
      y = 18 + i * 33;
    p(
      [
        [x, y],
        [x + 9, y - 3],
        [x + 15, y + 4],
        [x + 12, y + 10],
        [x - 2, y + 9],
      ],
      "#273b35",
    );
    r(x + 1, y, 9, 3, "#697467");
    r(x + 1, y + 4, 12, 4, "#4b5a4e");
    r(x + 3, y, 4, 1, "#94a087");
  }
  // Canopy silhouettes frame the clearing without covering valid unit positions.
  for (let i = 0; i < 14; i++) {
    const x = i % 2 ? 354 : -12,
      y = i * 35 - 16;
    p(
      [
        [x, y],
        [x + 22, y + 8],
        [x + 27, y + 20],
        [x + 14, y + 33],
        [x - 10, y + 28],
        [x - 22, y + 15],
      ],
      "#192f29",
    );
    p(
      [
        [x, y + 2],
        [x + 18, y + 9],
        [x + 20, y + 17],
        [x + 6, y + 24],
        [x - 15, y + 16],
      ],
      "#244332",
    );
    r(x - 8, y + 8, 15, 2, "#35543a");
  }
  r(145, 405, 70, 1, "#c1b47c");
  r(164, 407, 31, 1, "#88936b");
}
