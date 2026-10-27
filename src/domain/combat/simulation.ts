import { FIELD } from "../../data/combat";
import { AUTO_SKILLS } from "../../data/skills";
import { advanceStatusEffects } from "../statusEffects";
import { decideIntent } from "./ai";
import { getBattleOrders, refreshFocus } from "./commands";
import {
  distance,
  living,
  rear,
  face,
  clampToField,
  separateUnits,
} from "./spatial";
import {
  emitCombatEvent,
  appendCombatLog,
  applyDamage,
  launchProjectile,
  useAutomaticSkill,
} from "./actions";
import type { CombatBattle } from "./types";

export function stepBattle(input: CombatBattle, dt = FIELD.step): CombatBattle {
  if (input.status !== "active") return input;
  if (!Number.isFinite(dt) || dt <= 0 || dt > FIELD.step + 0.000001)
    throw Error("전투 스텝은 0~50ms 범위여야 합니다.");
  const b: CombatBattle = {
    ...input,
    units: input.units.map((u) => ({
      ...u,
      home: { ...u.home },
      skillCooldowns: { ...u.skillCooldowns },
    })),
    elapsed: Math.round((input.elapsed + dt) * 100000) / 100000,
    tick: input.tick + 1,
    events: input.events.filter((e) => input.elapsed - e.time < 1.6),
    projectiles: input.projectiles.map((p) => ({ ...p })),
    logs: [...input.logs],
  };
  if (
    b.tactic === "focus" &&
    !b.units.some((u) => u.id === b.focusId && living(u))
  )
    b.focusId = refreshFocus(b);
  for (const u of b.units) {
    if (!living(u)) continue;
    u.attackCooldown = Math.max(0, u.attackCooldown - dt);
    for (const id of Object.keys(u.skillCooldowns))
      u.skillCooldowns[id] = Math.max(0, u.skillCooldowns[id] - dt);
    advanceStatusEffects(u, b.elapsed);
    if (u.actionUntil <= b.elapsed) u.action = "idle";
  }
  // Decisions use one common snapshot so ordering never changes target/movement choices.
  const orders = getBattleOrders(b);
  const plans = b.units.map((u) => ({
    id: u.id,
    intent: decideIntent(u, b, orders),
  }));
  for (const plan of plans) {
    const u = b.units.find((u) => u.id === plan.id)!;
    if (!living(u)) continue;
    const intent = plan.intent;
    u.targetId = intent.targetId;
    if (intent.kind === "move") {
      const gap = distance(u, intent.point);
      if (gap > 1) {
        face(u, intent.point);
        const travel = Math.min(gap, u.moveSpeed * dt);
        u.x += ((intent.point.x - u.x) / gap) * travel;
        u.y += ((intent.point.y - u.y) / gap) * travel;
        clampToField(u);
        if (u.actionUntil <= b.elapsed) u.action = "move";
      }
    } else if (intent.kind === "attack" || intent.kind === "skill") {
      const t = b.units.find((t) => t.id === intent.targetId);
      if (!t || !living(t)) continue;
      const reach =
        intent.kind === "skill" ? AUTO_SKILLS[intent.skillId].range : u.range;
      if (
        !(
          intent.kind === "skill" &&
          AUTO_SKILLS[intent.skillId].kind === "shield"
        ) &&
        distance(u, t) > reach + 0.001
      )
        continue;
      face(u, t);
      if (intent.kind === "skill") useAutomaticSkill(b, u, t, intent.skillId);
      else {
        u.attackCooldown = u.attackInterval;
        u.action = "attack";
        u.actionUntil = b.elapsed + 0.25;
        emitCombatEvent(b, {
          type: "attack",
          sourceId: u.id,
          targetId: t.id,
          x: t.x,
          y: t.y,
        });
        if (rear(u)) launchProjectile(b, u, t, u.attack);
        else applyDamage(b, u, t, u.attack);
      }
    }
  }
  separateUnits(b.units);
  const remaining = [];
  for (const p of b.projectiles) {
    const t = b.units.find((u) => u.id === p.targetId),
      a = b.units.find((u) => u.id === p.sourceId);
    if (!t || !a || !living(t)) continue;
    const d = distance(p, t);
    if (d <= p.speed * dt + t.radius) applyDamage(b, a, t, p.damage);
    else {
      p.x += ((t.x - p.x) / d) * p.speed * dt;
      p.y += ((t.y - p.y) / d) * p.speed * dt;
      remaining.push(p);
    }
  }
  b.projectiles = remaining;
  if (b.escaping)
    for (const u of b.units.filter(
      (u) => u.side === "party" && living(u) && u.y >= FIELD.exitY,
    )) {
      u.escaped = true;
      u.action = "escaped";
      u.targetId = null;
      emitCombatEvent(b, { type: "escape", targetId: u.id, x: u.x, y: u.y });
    }
  const allies = b.units.filter((u) => u.side === "party");
  if (!allies.some(living))
    b.status = allies.some((u) => u.escaped) ? "escaped" : "defeat";
  else if (!b.escaping && !b.units.some((u) => u.side === "enemy" && living(u)))
    b.status = "victory";
  if (b.elapsed >= 180 && b.status === "active") {
    b.status = b.escaping ? "escaped" : "defeat";
    appendCombatLog(b, "장기전으로 철수했습니다.");
  }
  if (b.status !== "active") b.projectiles = [];
  b.events = b.events.slice(-100);
  return b;
}
export function advanceBattle(b: CombatBattle, seconds: number): CombatBattle {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 1)
    throw Error("한 번에 진행할 시간은 0~1초입니다.");
  let result = b,
    left = seconds;
  while (left > 1e-8 && result.status === "active") {
    const dt = Math.min(FIELD.step, left);
    result = stepBattle(result, dt);
    left -= dt;
  }
  return result;
}
