import {formationSlots} from "./formation";
import type {SlotId,WeaponType} from "../types";
import {gainWeaponXp} from "../equipment";
import { assignedHomes,slotPoint } from "./formation";
import { createCombatant } from "./units";
import { NORMAL_PARTY_LIMIT } from "../../data/party";
import { gainXp } from "../characters";
import { combatParty } from "../guild";
import type { Guild } from "../types";
import type { CombatBattle,CombatUnit } from "./types";

export function startBattle(guild: Guild, options:{enemyCount?:number}={}): CombatBattle {
  const party = combatParty(guild).slice(0, NORMAL_PARTY_LIMIT);
  if (!party.length) throw Error("출전할 인물을 편성해 주세요.");
  const homes=assignedHomes(guild);
  const slots=formationSlots(guild);
  const units:CombatUnit[]=party.map((m,index)=>({...createCombatant(m,index,homes.get(m.id)!),slotId:Object.entries(slots).find(([,id])=>id===m.id)?.[0] as SlotId}));
  const enemyCount=options.enemyCount??5;
  if(!Number.isInteger(enemyCount)||enemyCount<1||enemyCount>5)throw Error("적 출전 인원은1~5명입니다.");
  for (let i = 0; i < enemyCount; i++) {
    const boss = i === 2,
      ranged = i >= 3;
    const home=slotPoint('enemy',ranged?'rear':'front',ranged?i-3:i,ranged?Math.max(1,enemyCount-3):Math.min(3,enemyCount));
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
      moveSpeed: boss ? 195 : 210,
      range: ranged ? 280 : 25,
      radius: 10,
      attackInterval: boss ? 1.45 : 1.6,
      attackCooldown: 0.4 + i * 0.1,
      skillCooldowns: {},
      skillIds: boss ? ["power"] : [],
      targetId: null,
      direction: "left",
      action: "idle",
      actionUntil: 0,
      role: ranged ? "ranged" : "melee",
      attackMode:ranged?"ranged":"melee",statuses:[],
      threat: boss ? 4 : ranged ? 3 : 1,
      boss,
      shield: 0,
      shieldUntil: 0,
      escaped: false,
    });
  }
  return {
    units,weaponXp:{},
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
      `주인공과 동료들이 전장에 진입했습니다. 고블린 ${enemyCount}마리와 조우했습니다.`,
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
  guild={...guild,roster:guild.roster.map(m=>Object.entries(battle.weaponXp?.[m.id]??{}).reduce((m,[type,xp])=>gainWeaponXp(m,type as WeaponType,xp??0),m))};
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
