import { TACTICS } from "../../data/tactics";
import { distance, living } from "./spatial";
import type {
  CombatBattle,
  CombatUnit,
  TacticId,
  AttackPriority,
  TacticalOrders,
} from "./types";

/** Detached order snapshot for this simulation step; no unit behaviour here. */
export function getBattleOrders(b: TacticalOrders): TacticalOrders {
  return {
    tactic: b.tactic,
    priority: b.priority,
    focusId: b.focusId,
    escaping: b.escaping,
  };
}

export function refreshFocus(b: CombatBattle) {
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
    focusId: next.tactic === "focus" ? refreshFocus(next) : null,
  };
}
export function changeTactic(b: CombatBattle, tactic: TacticId): CombatBattle {
  if (b.status !== "active" || b.escaping || !Object.hasOwn(TACTICS, tactic))
    return b;
  const next = {
    ...b,
    tactic,
    focusId: tactic === "focus" ? refreshFocus(b) : null,
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
