import { AUTO_SKILLS, FIELD, TACTICS } from "../../data/combat";
import type { CombatBattle, CombatUnit, Intent, Point } from "./types";
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const living = (u: CombatUnit) => u.hp > 0 && !u.escaped;
export const rear = (u: CombatUnit) =>
  u.role === "ranged" || u.role === "healer";
export function formationPoint(u: CombatUnit, b: CombatBattle): Point {
  if (u.side === "enemy") return u.home;
  if (b.tactic === "retreat")
    return { x: u.home.x, y: Math.min(380, u.home.y + 55) };
  if (b.tactic === "protect") return { x: u.home.x, y: rear(u) ? 365 : 300 };
  return u.home;
}
export function threatToRear(enemy: CombatUnit, b: CombatBattle): number {
  return Math.max(
    0,
    ...b.units
      .filter((a) => a.side === "party" && living(a) && rear(a))
      .map(
        (a) =>
          (enemy.targetId === a.id ? 180 : 0) +
          Math.max(0, 120 - distance(enemy, a)),
      ),
  );
}
export function selectTarget(
  u: CombatUnit,
  b: CombatBattle,
): CombatUnit | undefined {
  const opponents = b.units.filter((t) => t.side !== u.side && living(t));
  if (u.side === "party" && b.tactic === "focus") {
    const focus = opponents.find((t) => t.id === b.focusId);
    if (focus) return focus;
  }
  return [...opponents].sort((a, c) => score(a) - score(c))[0];
  function score(t: CombatUnit) {
    let result = distance(u, t) - (u.targetId === t.id ? 12 : 0);
    if (u.side === "party" && b.tactic === "protect" && !rear(u))
      result -= threatToRear(t, b) * 2;
    if (u.side === "enemy" && u.role === "ranged") result -= rear(t) ? 25 : 0;
    if (
      u.side === "enemy" &&
      b.tactic === "protect" &&
      !rear(t) &&
      distance(u, t) < 50
    )
      result -= 35;
    if (u.mercenary?.classId === "rogue") result -= rear(t) ? 45 : 0;
    return result;
  }
}
export function chooseAutoSkill(
  u: CombatUnit,
  b: CombatBattle,
): Intent | undefined {
  for (const skillId of u.skillIds) {
    const s = AUTO_SKILLS[skillId];
    if (!s || (u.skillCooldowns[skillId] ?? 0) > 0) continue;
    const allies = b.units.filter((t) => t.side === u.side && living(t));
    const enemies = b.units.filter((t) => t.side !== u.side && living(t));
    const condition = s.condition;
    if (condition.type === "hp-below") {
      const hurt = allies
        .filter(
          (a) =>
            a.hp / a.maxHp <= condition.threshold && distance(u, a) <= s.range,
        )
        .sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
      if (hurt) return { kind: "skill", skillId, targetId: hurt.id };
    } else if (condition.type === "cluster") {
      const target = enemies
        .filter(
          (t) =>
            distance(u, t) <= s.range &&
            enemies.filter((e) => distance(t, e) <= condition.radius).length >=
              condition.minCount,
        )
        .sort((a, c) => distance(u, a) - distance(u, c))[0];
      if (target) return { kind: "skill", skillId, targetId: target.id };
    } else if (condition.type === "threat") {
      if (
        u.hp / u.maxHp <= condition.hpThreshold ||
        enemies.filter((e) => distance(u, e) < condition.radius).length >=
          condition.minCount
      )
        return { kind: "skill", skillId, targetId: u.id };
    } else if (condition.type === "priority") {
      const target = enemies
        .filter(
          (t) =>
            (t.boss || t.threat >= condition.minThreat) &&
            distance(u, t) <= s.range,
        )
        .sort(
          (a, c) => c.threat - a.threat || distance(u, a) - distance(u, c),
        )[0];
      if (target) return { kind: "skill", skillId, targetId: target.id };
    }
  }
}
export function decideIntent(u: CombatUnit, b: CombatBattle): Intent {
  if (!living(u)) return { kind: "idle", targetId: null };
  if (b.escaping && u.side === "party")
    return {
      kind: "move",
      point: { x: u.home.x, y: FIELD.exitY + 5 },
      targetId: null,
    };
  if (
    u.side === "party" &&
    b.tactic === "retreat" &&
    distance(u, formationPoint(u, b)) > 12
  )
    return { kind: "move", point: formationPoint(u, b), targetId: null };
  const skill = chooseAutoSkill(u, b);
  if (skill) return skill;
  const target = selectTarget(u, b);
  if (!target) return { kind: "idle", targetId: null };
  const home = formationPoint(u, b),
    gap = distance(u, target);
  const nearest = b.units
    .filter((e) => e.side !== u.side && living(e))
    .sort((a, c) => distance(u, a) - distance(u, c))[0];
  // Ranged kiting and low-HP evasion are positional decisions, never stat buffs.
  if (
    nearest &&
    ((rear(u) && distance(u, nearest) < 52) ||
      (u.hp / u.maxHp < 0.25 && distance(u, nearest) < 60))
  ) {
    const dx = u.x - nearest.x,
      dy = u.y - nearest.y,
      length = Math.hypot(dx, dy) || 1;
    return {
      kind: "move",
      point: {
        x: u.x + (dx / length) * 65,
        y: u.y + (dy / length) * 65 + (u.side === "party" ? 16 : -16),
      },
      targetId: target.id,
    };
  }
  if (u.side === "party") {
    if (b.tactic === "retreat" && distance(u, home) > 12)
      return { kind: "move", point: home, targetId: target.id };
    if (b.tactic === "hold" && distance(u, home) > 28)
      return { kind: "move", point: home, targetId: target.id };
    const guarding =
      b.tactic === "protect" && !rear(u) && threatToRear(target, b) > 0;
    const leash = guarding
      ? 350
      : TACTICS[b.tactic].pursuit + (rear(u) ? u.range : 0);
    if (
      distance(target, home) > leash ||
      (b.tactic === "retreat" && gap > u.range)
    )
      return distance(u, home) > 7
        ? { kind: "move", point: home, targetId: target.id }
        : { kind: "idle", targetId: target.id };
    if (b.tactic === "protect" && rear(u) && distance(u, home) > 24)
      return { kind: "move", point: home, targetId: target.id };
  }
  if (gap > u.range) {
    if (u.role === "healer") {
      const hurt = b.units
        .filter((a) => a.side === u.side && living(a) && a.hp / a.maxHp <= 0.5)
        .sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
      if (hurt && distance(u, hurt) > 145)
        return { kind: "move", point: hurt, targetId: target.id };
    }
    return { kind: "move", point: target, targetId: target.id };
  }
  if (u.attackCooldown <= 0) return { kind: "attack", targetId: target.id };
  return { kind: "idle", targetId: target.id };
}
