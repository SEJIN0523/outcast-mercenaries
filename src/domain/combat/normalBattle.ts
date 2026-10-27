import { createCombatant } from "./units";
import { COMBAT_PROFILES, FIELD } from "../../data/combat";
import { NORMAL_PARTY_LIMIT } from "../../data/party";
import { gainXp } from "../characters";
import { combatParty } from "../guild";
import type { Guild, Mercenary } from "../types";
import type { CombatBattle } from "./types";

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
    return createCombatant(m, index, {
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
