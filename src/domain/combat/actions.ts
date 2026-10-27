import { AUTO_SKILLS } from "../../data/skills";
import { applyBarrier, absorbBarrierDamage } from "../statusEffects";
import { distance, living, rear } from "./spatial";
import type { CombatBattle, CombatUnit, CombatEvent } from "./types";

export function emitCombatEvent(
  b: CombatBattle,
  value: Omit<CombatEvent, "id" | "time">,
) {
  b.events.push({ ...value, id: b.nextEventId++, time: b.elapsed });
}
export function appendCombatLog(b: CombatBattle, text: string) {
  b.logs.push(text);
  b.logs = b.logs.slice(-40);
}
export function applyDamage(
  b: CombatBattle,
  a: CombatUnit,
  t: CombatUnit,
  power: number,
) {
  if (!living(t)) return;
  let hit = Math.max(1, Math.floor(power) - t.defense);
  hit = absorbBarrierDamage(t, hit);
  const actual = Math.min(t.hp, hit);
  t.hp -= actual;
  t.action = t.hp <= 0 ? "dead" : "hurt";
  t.actionUntil = b.elapsed + 0.22;
  emitCombatEvent(b, {
    type: "damage",
    sourceId: a.id,
    targetId: t.id,
    x: t.x,
    y: t.y,
    amount: actual,
  });
  if (t.hp <= 0) {
    t.targetId = null;
    emitCombatEvent(b, { type: "death", targetId: t.id, x: t.x, y: t.y });
    appendCombatLog(b, `${t.name} 전투 불능`);
  }
}
export function launchProjectile(
  b: CombatBattle,
  a: CombatUnit,
  t: CombatUnit,
  power: number,
) {
  b.projectiles.push({
    id: b.nextEventId++,
    sourceId: a.id,
    targetId: t.id,
    x: a.x,
    y: a.y,
    speed: 230,
    damage: power,
    kind:
      a.mercenary?.classId === "archer" || a.side === "enemy"
        ? "arrow"
        : "magic",
  });
}
export function useAutomaticSkill(
  b: CombatBattle,
  u: CombatUnit,
  target: CombatUnit,
  id: string,
) {
  const s = AUTO_SKILLS[id];
  u.skillCooldowns[id] = s.cooldown;
  u.attackCooldown = Math.max(u.attackCooldown, 0.35);
  u.action = "cast";
  u.actionUntil = b.elapsed + 0.35;
  emitCombatEvent(b, {
    type: "skill",
    sourceId: u.id,
    targetId: target.id,
    x: target.x,
    y: target.y,
    label: s.name,
  });
  appendCombatLog(b, `${u.name} · ${s.name} 자동 발동`);
  if (s.kind === "heal") {
    const amount = Math.min(
      target.maxHp - target.hp,
      Math.floor(u.attack * s.multiplier),
    );
    target.hp += amount;
    emitCombatEvent(b, {
      type: "heal",
      sourceId: u.id,
      targetId: target.id,
      x: target.x,
      y: target.y,
      amount,
    });
  } else if (s.kind === "shield") {
    applyBarrier(u, Math.floor(u.attack * s.multiplier), b.elapsed);
  } else if (s.kind === "area") {
    const radius = s.condition.type === "cluster" ? s.condition.radius : 50;
    b.units
      .filter(
        (t) => t.side !== u.side && living(t) && distance(t, target) <= radius,
      )
      .forEach((t) => applyDamage(b, u, t, u.attack * s.multiplier));
  } else if (rear(u)) launchProjectile(b, u, target, u.attack * s.multiplier);
  else applyDamage(b, u, target, u.attack * s.multiplier);
}
