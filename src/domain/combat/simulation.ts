import {
  AUTO_SKILLS,
  COMBAT_PROFILES,
  FIELD,
  TACTICS,
} from "../../data/combat";
import { gainXp, statsOf, isHero } from "../characters";
import { NORMAL_PARTY_LIMIT } from "../../data/party";
import { combatParty } from "../guild";
import type { Guild, Mercenary } from "../types";
import { decideIntent, distance, living, rear } from "./ai";
import type {
  CombatBattle,
  CombatEvent,
  CombatUnit,
  Point,
  TacticId,
  AttackPriority,
} from "./types";

function fighter(m: Mercenary, index: number, home: Point): CombatUnit {
  const s = statsOf(m),
    p = COMBAT_PROFILES[m.classId];
  return {
    id: m.id,
    name: m.name,
    side: "party",
    hp: s.hp,
    maxHp: s.hp,
    attack: s.attack,
    defense: s.defense,
    speed: s.speed,
    healer: p.role === "healer",
    mercenary: m,
    ...home,
    home: { ...home },
    moveSpeed: p.movement + s.speed * 0.6,
    range: p.range,
    radius: FIELD.radius,
    attackInterval: p.interval,
    attackCooldown: 0.2 + index * 0.08,
    skillCooldowns: {},
    // The initial protagonist has no combat skills. A future story unlock can
    // extend this resolver without changing movement, targeting or basic attacks.
    skillIds: isHero(m) ? [] : [...p.skills],
    targetId: null,
    direction: "up",
    action: "idle",
    actionUntil: 0,
    role: p.role,
    threat: p.role === "healer" ? 3 : 2,
    boss: false,
    shield: 0,
    shieldUntil: 0,
    escaped: false,
  };
}
export function startBattle(guild: Guild): CombatBattle {
  const party = combatParty(guild).slice(0, NORMAL_PARTY_LIMIT);
  if (!party.length) throw Error("출전할 인물을 편성해 주세요.");
  const back = (m: Mercenary) =>
    ["ranged", "healer"].includes(COMBAT_PROFILES[m.classId].role);
  const rearCount = party.filter(back).length,
    frontCount = party.length - rearCount;
  let frontIndex = 0,
    rearIndex = 0;
  const units = party.map((m, index) => {
    const ranged = back(m),
      slot = ranged ? ++rearIndex : ++frontIndex,
      count = ranged ? rearCount : frontCount;
    return fighter(m, index, {
      x: (FIELD.width * slot) / (count + 1),
      y: ranged ? 345 : 285,
    });
  });
  for (let i = 0; i < 5; i++) {
    const boss = i === 4,
      ranged = i === 2;
    const home = {
      x: [55, 125, 235, 305, 180][i],
      y: [85, 65, 65, 85, 115][i],
    };
    units.push({
      id: `goblin-${i}`,
      name: boss ? "고블린 대장" : ranged ? "고블린 궁수" : `고블린 ${i + 1}`,
      side: "enemy",
      hp: boss ? 95 : 64,
      maxHp: boss ? 95 : 64,
      attack: boss ? 12 : ranged ? 8 : 9,
      defense: 2,
      speed: 6,
      healer: false,
      ...home,
      home: { ...home },
      moveSpeed: boss ? 39 : 44,
      range: ranged ? 125 : 25,
      radius: 10,
      attackInterval: boss ? 1.45 : 1.6,
      attackCooldown: 0.4 + i * 0.1,
      skillCooldowns: {},
      skillIds: boss ? ["power"] : [],
      targetId: null,
      direction: "down",
      action: "idle",
      actionUntil: 0,
      role: ranged ? "ranged" : "melee",
      threat: boss ? 4 : ranged ? 3 : 1,
      boss,
      shield: 0,
      shieldUntil: 0,
      escaped: false,
    });
  }
  return {
    units,
    tick: 0,
    elapsed: 0,
    status: "active",
    tactic: "balanced",
    priority: "threat",
    focusId: null,
    events: [],
    projectiles: [],
    nextEventId: 1,
    logs: [
      "주인공과 동료들이 전장에 진입했습니다. 고블린 5마리와 조우했습니다.",
    ],
    participants: party.map((m) => m.id),
    rewarded: false,
    escaping: false,
    speed: 1,
  };
}
function event(b: CombatBattle, value: Omit<CombatEvent, "id" | "time">) {
  b.events.push({ ...value, id: b.nextEventId++, time: b.elapsed });
}
function log(b: CombatBattle, text: string) {
  b.logs.push(text);
  b.logs = b.logs.slice(-40);
}
function damage(b: CombatBattle, a: CombatUnit, t: CombatUnit, power: number) {
  if (!living(t)) return;
  let hit = Math.max(1, Math.floor(power) - t.defense);
  const blocked = Math.min(t.shield, hit);
  t.shield -= blocked;
  hit -= blocked;
  const actual = Math.min(t.hp, hit);
  t.hp -= actual;
  t.action = t.hp <= 0 ? "dead" : "hurt";
  t.actionUntil = b.elapsed + 0.22;
  event(b, {
    type: "damage",
    sourceId: a.id,
    targetId: t.id,
    x: t.x,
    y: t.y,
    amount: actual,
  });
  if (t.hp <= 0) {
    t.targetId = null;
    event(b, { type: "death", targetId: t.id, x: t.x, y: t.y });
    log(b, `${t.name} 전투 불능`);
  }
}
function shoot(b: CombatBattle, a: CombatUnit, t: CombatUnit, power: number) {
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
function useSkill(
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
  event(b, {
    type: "skill",
    sourceId: u.id,
    targetId: target.id,
    x: target.x,
    y: target.y,
    label: s.name,
  });
  log(b, `${u.name} · ${s.name} 자동 발동`);
  if (s.kind === "heal") {
    const amount = Math.min(
      target.maxHp - target.hp,
      Math.floor(u.attack * s.multiplier),
    );
    target.hp += amount;
    event(b, {
      type: "heal",
      sourceId: u.id,
      targetId: target.id,
      x: target.x,
      y: target.y,
      amount,
    });
  } else if (s.kind === "shield") {
    u.shield = Math.floor(u.attack * s.multiplier);
    u.shieldUntil = b.elapsed + 3;
  } else if (s.kind === "area") {
    const radius = s.condition.type === "cluster" ? s.condition.radius : 50;
    b.units
      .filter(
        (t) => t.side !== u.side && living(t) && distance(t, target) <= radius,
      )
      .forEach((t) => damage(b, u, t, u.attack * s.multiplier));
  } else if (rear(u)) shoot(b, u, target, u.attack * s.multiplier);
  else damage(b, u, target, u.attack * s.multiplier);
}
function face(u: CombatUnit, p: Point) {
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
function clamp(u: CombatUnit) {
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
        clamp(a);
        clamp(b);
      }
}
function sharedFocus(b: CombatBattle) {
  const allies = b.units.filter((u) => u.side === "party" && living(u));
  const center = {
    x: allies.reduce((sum, u) => sum + u.x, 0) / (allies.length || 1),
    y: allies.reduce((sum, u) => sum + u.y, 0) / (allies.length || 1),
  };
  const score = (u: CombatUnit) =>
    b.priority === "nearest"
      ? distance(u, center)
      : b.priority === "weakest"
        ? (u.hp / u.maxHp) * 100
        : -u.threat;
  return (
    b.units
      .filter((u) => u.side === "enemy" && living(u))
      .sort((a, c) => score(a) - score(c) || a.hp - c.hp)[0]?.id ?? null
  );
}
export function changePriority(
  b: CombatBattle,
  priority: AttackPriority,
): CombatBattle {
  if (
    b.status !== "active" ||
    b.escaping ||
    !["threat", "nearest", "weakest"].includes(priority)
  )
    return b;
  const next = {
    ...b,
    priority,
    units: b.units.map((u) => ({
      ...u,
      targetId: u.side === "party" ? null : u.targetId,
    })),
  };
  return {
    ...next,
    focusId: next.tactic === "focus" ? sharedFocus(next) : null,
  };
}
export function changeTactic(b: CombatBattle, tactic: TacticId): CombatBattle {
  if (b.status !== "active" || b.escaping || !Object.hasOwn(TACTICS, tactic))
    return b;
  const next = {
    ...b,
    tactic,
    focusId: tactic === "focus" ? sharedFocus(b) : null,
    units: b.units.map((u) => ({
      ...u,
      targetId: u.side === "party" ? null : u.targetId,
    })),
    logs: [...b.logs, `전술 변경 · ${TACTICS[tactic].name}`].slice(-40),
  };
  return next;
}
export function requestEscape(b: CombatBattle): CombatBattle {
  if (b.status !== "active" || b.escaping) return b;
  return {
    ...b,
    escaping: true,
    units: b.units.map((u) => ({
      ...u,
      targetId: u.side === "party" ? null : u.targetId,
    })),
    logs: [...b.logs, "도주 명령! 하단 탈출 지점으로 이동합니다."].slice(-40),
  };
}
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
    b.focusId = sharedFocus(b);
  for (const u of b.units) {
    if (!living(u)) continue;
    u.attackCooldown = Math.max(0, u.attackCooldown - dt);
    for (const id of Object.keys(u.skillCooldowns))
      u.skillCooldowns[id] = Math.max(0, u.skillCooldowns[id] - dt);
    if (u.shieldUntil <= b.elapsed) u.shield = 0;
    if (u.actionUntil <= b.elapsed) u.action = "idle";
  }
  // Decisions use one common snapshot so ordering never changes target/movement choices.
  const plans = b.units.map((u) => ({ id: u.id, intent: decideIntent(u, b) }));
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
        clamp(u);
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
      if (intent.kind === "skill") useSkill(b, u, t, intent.skillId);
      else {
        u.attackCooldown = u.attackInterval;
        u.action = "attack";
        u.actionUntil = b.elapsed + 0.25;
        event(b, {
          type: "attack",
          sourceId: u.id,
          targetId: t.id,
          x: t.x,
          y: t.y,
        });
        if (rear(u)) shoot(b, u, t, u.attack);
        else damage(b, u, t, u.attack);
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
    if (d <= p.speed * dt + t.radius) damage(b, a, t, p.damage);
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
      event(b, { type: "escape", targetId: u.id, x: u.x, y: u.y });
    }
  const allies = b.units.filter((u) => u.side === "party");
  if (!allies.some(living))
    b.status = allies.some((u) => u.escaped) ? "escaped" : "defeat";
  else if (!b.escaping && !b.units.some((u) => u.side === "enemy" && living(u)))
    b.status = "victory";
  if (b.elapsed >= 180 && b.status === "active") {
    b.status = b.escaping ? "escaped" : "defeat";
    log(b, "장기전으로 철수했습니다.");
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
export function applyReward(
  guild: Guild,
  battle: CombatBattle,
): { guild: Guild; battle: CombatBattle } {
  if (battle.status === "active" || battle.rewarded) return { guild, battle };
  const result = { ...battle, rewarded: true };
  if (battle.status !== "victory") return { guild, battle: result };
  return {
    guild: {
      ...guild,
      gold: guild.gold + 120,
      victories: guild.victories + 1,
      roster: guild.roster.map((m) =>
        battle.participants.includes(m.id) ? gainXp(m, 55) : m,
      ),
    },
    battle: result,
  };
}
