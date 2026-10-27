import { COMBAT_PROFILES, FIELD } from "../../data/combat";
import { statsOf, isHero } from "../characters";
import type { Mercenary } from "../types";
import type { CombatUnit, Point } from "./types";
/** Build transient combat state from shared character data; never write to the character. */
export function createCombatant(
  m: Mercenary,
  index: number,
  home: Point,
): CombatUnit {
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
