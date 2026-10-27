import { CLASSES } from "../data/catalog";
import {
  EYE_COLORS,
  OUTFIT_COLORS,
  OUTFIT_STYLES,
  WEAPON_STYLES,
} from "../data/appearance";
import type { Appearance, ClassId, Mercenary } from "./types";
import { random } from "./random";

/** Separate stream: adding visual options cannot reroll stats, name or existing appearance. */
export function generateCosmetics(seed: string, classId: ClassId) {
  const rng = random(`cosmetics-v1:${seed}`);
  const pick = <T>(values: readonly T[]) =>
    values[Math.floor(rng() * values.length)];
  return {
    eyeColor: pick(EYE_COLORS),
    outfitColor: pick(OUTFIT_COLORS[classId]),
    outfitStyle: Math.floor(rng() * OUTFIT_STYLES.length),
    weaponStyle: Math.floor(rng() * WEAPON_STYLES.length),
  };
}

/** Missing optional fields preserve old saves' previous visual defaults without mutating them. */
export function resolveCosmetics(appearance: Appearance, classId: ClassId) {
  return {
    eyeColor: appearance.eyeColor ?? "#7893a0",
    outfitColor: appearance.outfitColor ?? CLASSES[classId].color,
    outfitStyle: appearance.outfitStyle ?? 0,
    weaponStyle: appearance.weaponStyle ?? 0,
  };
}

/** Shared portrait/Phaser cache identity; gameplay growth does not change artwork. */
export function appearanceSignature(m: Mercenary) {
  return JSON.stringify([
    m.gender,
    m.race,
    m.classId,
    m.appearance,
    m.equipment,
    m.battlePresetId,
  ]);
}
