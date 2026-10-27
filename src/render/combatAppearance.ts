import type { CombatUnit, Direction, Action } from "../domain/combat/types";
import { appearanceSignature } from "../domain/appearance";
import type { GoblinKind } from "./goblin";
export interface CombatAppearance {
  textureKey: string;
  direction: Direction;
  action: Action;
  frame: number;
  goblinKind: GoblinKind;
  flipX: boolean;
  tint: number;
}
/** All directions have actual artwork. Four frames are reserved for walking. */
export function combatAppearance(unit: CombatUnit, time = 0): CombatAppearance {
  const frame = unit.action === "move" ? Math.floor(time * 8) % 4 : 0;
  const goblinKind: GoblinKind = unit.boss
    ? "chief"
    : unit.role === "ranged"
      ? "archer"
      : "fighter";
  return {
    textureKey: `rt-${unit.mercenary ? `${unit.id}:${appearanceSignature(unit.mercenary)}` : `goblin-${goblinKind}`}-${unit.direction}-${frame}`,
    direction: unit.direction,
    action: unit.action,
    frame,
    goblinKind,
    flipX: false,
    tint:
      unit.action === "hurt"
        ? 0xffb1a0
        : unit.action === "cast"
          ? 0xffed9f
          : 0xffffff,
  };
}
