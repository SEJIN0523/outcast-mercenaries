import type { CombatUnit, Direction, Action } from "../domain/combat/types";
// Replace this resolver with atlas keys/frames keyed by direction + action.
export interface CombatAppearance {
  textureKey: string;
  direction: Direction;
  action: Action;
  flipX: boolean;
  tint: number;
}
export function combatAppearance(unit: CombatUnit): CombatAppearance {
  return {
    textureKey: unit.mercenary ? `rt-${unit.id}` : "rt-goblin",
    direction: unit.direction,
    action: unit.action,
    flipX: unit.direction === "left",
    tint:
      unit.action === "hurt"
        ? 0xffb1a0
        : unit.action === "cast"
          ? 0xffed9f
          : unit.direction === "up"
            ? 0xc3d1c4
            : 0xffffff,
  };
}
