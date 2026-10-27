import { FIELD } from "../../data/combat";
import type { CombatUnit, Point } from "./types";
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const living = (u: CombatUnit) => u.hp > 0 && !u.escaped;
export const rear = (u: CombatUnit) =>
  u.role === "ranged" || u.role === "healer";

export function face(u: CombatUnit, p: Point) {
  const dx = p.x - u.x,
    dy = p.y - u.y;
  u.direction =
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? "right"
        : "left"
      : dy > 0
        ? "down"
        : "up";
}
export function clampToField(u: CombatUnit) {
  u.x = Math.max(14, Math.min(FIELD.width - 14, u.x));
  u.y = Math.max(48, Math.min(FIELD.height - 12, u.y));
}
export function separateUnits(units: CombatUnit[]) {
  for (let pass = 0; pass < 3; pass++)
    for (let i = 0; i < units.length; i++)
      for (let j = i + 1; j < units.length; j++) {
        const a = units[i],
          b = units[j];
        if (!living(a) || !living(b)) continue;
        let dx = b.x - a.x,
          dy = b.y - a.y,
          d = Math.hypot(dx, dy);
        const min = a.radius + b.radius + 1;
        if (d >= min) continue;
        if (d < 0.001) {
          dx = i % 2 ? 1 : -1;
          dy = 0.5;
          d = Math.hypot(dx, dy);
        }
        const push = (min - d) / 2;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
        clampToField(a);
        clampToField(b);
      }
}
