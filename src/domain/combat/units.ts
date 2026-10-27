import {weaponOf,mastery} from "../equipment";
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
    p = COMBAT_PROFILES[m.classId],w=weaponOf(m),grade=mastery(m);
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
    moveSpeed: 185 + p.movement + s.speed * 0.6,
    range:w.range,
    attackMode:w.mode,weaponType:w.type,statuses:[],
    radius: FIELD.radius,
    attackInterval:w.interval*grade.speed,
    attackCooldown: 0.2 + index * 0.08,
    skillCooldowns: Object.fromEntries((isHero(m)?[]:p.skills).map(id=>[id,2.5+index*.15])),
    // The initial protagonist has no combat skills. A future story unlock can
    // extend this resolver without changing movement, targeting or basic attacks.
    skillIds:[...(isHero(m)?[]:p.skills),...(["D","C","B","A","S"].includes(grade.rank)?[w.type==="bow"?"weaponShot":w.type==="staff"?"weaponArc":"weaponStrike"]:[])],
    targetId: null,
    direction: "right",
    action: "idle",
    actionUntil: 0,
    role:p.role==="healer"?"healer":w.mode!=="melee"?"ranged":p.role==="tank"?"tank":"melee",
    threat: p.role === "healer" ? 3 : 2,
    boss: false,
    shield: 0,
    shieldUntil: 0,
    escaped: false,
  };
}
