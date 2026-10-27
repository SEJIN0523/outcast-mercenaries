import { CLASSES, EQUIPMENT } from "../data/catalog";
import type { Mercenary } from "../domain/types";
// Shared 64x80 frame / feet (32,74). Swap the layer resolver here for PNG atlases.
export function drawMercenary(ctx: CanvasRenderingContext2D, m: Mercenary) {
  ctx.clearRect(0, 0, 64, 80);
  ctx.imageSmoothingEnabled = false;
  const {
    skinColor: skin,
    hairColor: hair,
    hairStyle,
    bodyType,
  } = m.appearance;
  const armor = CLASSES[m.classId].color;
  const r = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const wide = bodyType === 2 ? 2 : 0;
  const short = m.race === "dwarf" ? 5 : 0;
  ctx.fillStyle = "#090f1644";
  ctx.beginPath();
  ctx.ellipse(32, 74, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // body and boots
  r(22, 57 - short, 8, 16 + short, "#303442");
  r(34, 57 - short, 8, 16 + short, "#303442");
  r(20, 70, 11, 4, "#392e2c");
  r(33, 70, 12, 4, "#392e2c");
  r(19 - wide, 34 + short, 26 + wide * 2, 29 - short, "#242a35");
  r(16 - wide, 39 + short, 8, 18, skin);
  r(42 + wide, 39 + short, 8, 18, skin);
  r(24, 28 + short, 16, 12, skin);
  // armor layer
  r(21 - wide, 35 + short, 22 + wide * 2, 25 - short, armor);
  r(16 - wide, 35 + short, 11, 9, armor);
  r(38, 35 + short, 12 + wide, 9, armor);
  r(24, 36 + short, 5, 20 - short, "#ffffff28");
  r(32, 36 + short, 4, 20 - short, "#1b263944");
  r(20 - wide, 57, 25 + wide * 2, 5, "#513e31");
  r(29, 57, 6, 4, "#d9b968");
  if (m.gender === "female") {
    r(20 - wide, 54, 25 + wide * 2, 4, armor);
    r(18 - wide, 61, 29 + wide * 2, 3, armor);
    r(26, 37 + short, 12, 3, "#e8c77d");
  }
  // head and ears
  r(20, 10 + short, 25, 24, "#242a35");
  r(18, 18 + short, 29, 10, skin);
  r(22, 13 + short, 21, 20, skin);
  if (m.race === "elf") {
    r(14, 19 + short, 8, 4, skin);
    r(43, 19 + short, 8, 4, skin);
    r(12, 17 + short, 5, 3, skin);
  }
  r(25, 23 + short, 3, 4, "#333440");
  r(37, 23 + short, 3, 4, "#333440");
  r(25, 23 + short, 1, 1, "#fff9e6");
  r(37, 23 + short, 1, 1, "#fff9e6");
  r(30, 30 + short, 5, 1, "#b87568");
  r(23, 28 + short, 4, 2, "#e49b7a");
  // hair layer
  r(19, 10 + short, 27, 9, hair);
  r(23, 7 + short, 18, 5, hair);
  r(18, 16 + short, 6, 12, hair);
  r(41, 16 + short, 6, 12, hair);
  r(22, 16 + short, 9, 5, hair);
  if (hairStyle === 1 || hairStyle === 2) {
    r(17, 24 + short, 6, 19, hair);
    r(42, 24 + short, 6, 19, hair);
  }
  if (hairStyle === 3) {
    r(39, 9 + short, 10, 7, hair);
    r(45, 13 + short, 5, 20, hair);
  }
  r(24, 10 + short, 12, 2, "#ffffff26");
  // equipment spriteKey resolver (procedural stand-ins)
  const weapon = EQUIPMENT[m.equipment.weapon]?.spriteKey;
  if (weapon?.includes("bow")) {
    r(51, 30, 3, 28, "#a97849");
    r(48, 26, 4, 5, "#d6ac67");
    r(48, 57, 4, 4, "#d6ac67");
    r(48, 31, 1, 27, "#e6d4a2");
  } else if (weapon?.includes("staff")) {
    r(50, 23, 3, 46, "#a17d53");
    r(46, 18, 11, 9, "#ccad68");
    r(49, 18, 5, 7, "#9dd3cb");
  } else if (weapon?.includes("spear")) {
    r(50, 19, 3, 51, "#9c764e");
    r(48, 9, 7, 13, "#b9ced1");
    r(50, 6, 3, 9, "#e2eeef");
  } else if (weapon?.includes("lute")) {
    r(48, 34, 3, 17, "#be8d50");
    r(44, 48, 12, 13, "#b47c49");
    r(48, 50, 4, 5, "#573f32");
  } else {
    const dagger = weapon?.includes("dagger");
    r(48, dagger ? 42 : 29, 4, dagger ? 15 : 27, "#d0dedb");
    r(48, dagger ? 40 : 26, 2, 5, "#f6eed5");
    r(44, 56, 12, 3, "#c7a45e");
    r(49, 59, 3, 8, "#796044");
  }
  if (m.classId === "guardian") {
    r(9, 43, 15, 20, "#a9ac9d");
    r(11, 45, 11, 16, "#677c78");
    r(15, 46, 3, 13, "#d6c08b");
    r(11, 51, 11, 3, "#d6c08b");
  }
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
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 80;
  drawMercenary(canvas.getContext("2d")!, m);
  const url = canvas.toDataURL();
  cache.set(key, url);
  if (cache.size > 150) cache.delete(cache.keys().next().value!);
  return url;
}
