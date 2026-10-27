import type { Mercenary } from "../domain/types";
import type { Direction } from "../domain/combat/types";
import { newGuild } from "../domain/guild";
import { appearanceSignature } from "../domain/appearance";
import type { GoblinKind } from "./goblin";
const files = [
  "warrior",
  "archer",
  "mage",
  "priest",
  "guardian",
  "goblins",
] as const;
type Sheet = (typeof files)[number];
const images = new Map<Sheet, HTMLImageElement>();
const baseLooks = new Map(
  newGuild().roster.map((m) => [m.id, appearanceSignature(m)]),
);
let pending: Promise<void> | undefined;
/** Load before first portrait/Phaser texture. Missing files retain procedural fallback. */
export function loadGeneratedArt() {
  return (pending ??= Promise.allSettled(
    files.map(
      (id) =>
        new Promise<void>((resolve, reject) => {
          const image = new Image();
          const timeout = setTimeout(() => {
            image.onload = null;
            image.onerror = null;
            reject(Error("Art load timeout: " + id));
          }, 5000);
          image.onload = () => {
            clearTimeout(timeout);
            if (
              image.naturalWidth !== 256 ||
              image.naturalHeight !== (id === "goblins" ? 240 : 160)
            ) {
              reject(Error("Invalid atlas: " + id));
              return;
            }
            images.set(id, image);
            resolve();
          };
          image.onerror = () => {
            clearTimeout(timeout);
            reject(Error("Art unavailable: " + id));
          };
          image.src = import.meta.env.BASE_URL + "art/generated/" + id + ".png";
        }),
    ),
  ).then(() => {}));
}
export function generatedSheetFor(m: Mercenary): Sheet | undefined {
  // Fixed companions only. Never replace a random mercenary's saved layer combination
  // or silently flatten an existing customised/equipped story character.
  if (baseLooks.get(m.id) !== appearanceSignature(m)) return;
  if (!["warrior", "archer", "mage", "priest", "guardian"].includes(m.classId))
    return;
  const sheet = m.classId as Sheet;
  return images.has(sheet) ? sheet : undefined;
}
export function hasGeneratedMercenary(m: Mercenary) {
  return !!generatedSheetFor(m);
}
export function generatedArtReady() {
  return files.every((id) => images.has(id));
}
const directionIndex: Record<Direction, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};
export function drawGeneratedMercenary(
  ctx: CanvasRenderingContext2D,
  m: Mercenary,
  direction: Direction,
  frame: number,
) {
  const sheet = generatedSheetFor(m);
  if (!sheet) return false;
  const image = images.get(sheet)!;
  ctx.clearRect(0, 0, 64, 80);
  ctx.imageSmoothingEnabled = false;
  // Pose atlas has one idle image per direction. Walking uses a modest visual bob,
  // not invented attack/walk frames and never modifies simulation coordinates.
  const bob = frame % 2 === 1 ? -1 : 0;
  ctx.drawImage(
    image,
    directionIndex[direction] * 64,
    m.gender === "female" ? 80 : 0,
    64,
    80,
    0,
    bob,
    64,
    80,
  );
  return true;
}
export function drawGeneratedGoblin(
  ctx: CanvasRenderingContext2D,
  kind: GoblinKind,
  direction: Direction,
  frame: number,
) {
  const image = images.get("goblins");
  if (!image) return false;
  ctx.clearRect(0, 0, 64, 80);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    directionIndex[direction] * 64,
    { fighter: 0, archer: 1, chief: 2 }[kind] * 80,
    64,
    80,
    0,
    frame % 2 === 1 ? -1 : 0,
    64,
    80,
  );
  return true;
}
