import { gainXp, statsOf } from "../characters";
import { SKILLS } from "../../data/catalog";
import type { Battle, Guild, Unit } from "../types";
export function startBattle(guild: Guild): Battle {
  if (!guild.party.length) throw Error("출전할 용병을 편성해 주세요.");
  const party = guild.party.map((id) => guild.roster.find((m) => m.id === id)!);
  const units: Unit[] = party.map((m) => {
    const s = statsOf(m);
    return {
      id: m.id,
      name: m.name,
      side: "party",
      hp: s.hp,
      maxHp: s.hp,
      attack: s.attack,
      defense: s.defense,
      speed: s.speed,
      healer: m.classId === "priest",
      mercenary: m,
    };
  });
  for (let i = 0; i < 3; i++)
    units.push({
      id: `goblin-${i}`,
      name: i === 2 ? "고블린 대장" : `고블린 ${i + 1}`,
      side: "enemy",
      hp: i === 2 ? 95 : 64,
      maxHp: i === 2 ? 95 : 64,
      attack: i === 2 ? 13 : 10,
      defense: 2,
      speed: 5 + i,
      healer: false,
    });
  return {
    units,
    tick: 0,
    cooldown: 0,
    logs: ["속삭임의 숲에 진입했습니다."],
    status: "active",
    rewarded: false,
    participants: [...guild.party],
  };
}
function settle(b: Battle) {
  if (!b.units.some((u) => u.side === "enemy" && u.hp > 0))
    b.status = "victory";
  else if (!b.units.some((u) => u.side === "party" && u.hp > 0))
    b.status = "defeat";
  b.logs = b.logs.slice(-40);
  return b;
}
export function tickBattle(input: Battle): Battle {
  if (input.status !== "active") return input;
  const b: Battle = {
    ...input,
    units: input.units.map((u) => ({ ...u })),
    logs: [...input.logs],
    tick: input.tick + 1,
    cooldown: Math.max(0, input.cooldown - 1),
  };
  const order = [...b.units].sort((a, c) => c.speed - a.speed);
  for (const u of order) {
    if (u.hp <= 0) continue;
    const hurt = b.units
      .filter((t) => t.side === u.side && t.hp > 0 && t.hp < t.maxHp)
      .sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
    if (u.healer && hurt) {
      const heal = Math.min(
        hurt.maxHp - hurt.hp,
        Math.floor(u.attack * SKILLS.heal.multiplier),
      );
      hurt.hp += heal;
      b.logs.push(`${u.name} → ${hurt.name} 치유 +${heal}`);
    } else {
      const t = b.units.find((t) => t.side !== u.side && t.hp > 0);
      if (!t) break;
      const damage = Math.max(1, u.attack - t.defense);
      t.hp = Math.max(0, t.hp - damage);
      b.logs.push(
        `${u.name} → ${t.name} ${damage} 피해${t.hp === 0 ? " · 쓰러짐" : ""}`,
      );
    }
    settle(b);
    if (b.status !== "active") break;
  }
  // Defensive cap guarantees termination if future healing configurations stalemate.
  if (b.tick >= 100 && b.status === "active") {
    b.status = "defeat";
    b.logs.push("장기전으로 철수했습니다.");
  }
  return settle(b);
}
export function focusAttack(input: Battle): Battle {
  if (input.status !== "active" || input.cooldown > 0) return input;
  const b = {
    ...input,
    units: input.units.map((u) => ({ ...u })),
    logs: [...input.logs],
    cooldown: SKILLS.focus.cooldown,
  };
  const a = b.units.find((u) => u.side === "party" && u.hp > 0);
  const t = b.units.find((u) => u.side === "enemy" && u.hp > 0);
  if (a && t) {
    const damage = Math.max(
      1,
      Math.floor(a.attack * SKILLS.focus.multiplier) - t.defense,
    );
    t.hp = Math.max(0, t.hp - damage);
    b.logs.push(`집중 공격! ${a.name} → ${t.name} ${damage} 피해`);
  }
  return settle(b);
}
export function applyReward(
  guild: Guild,
  battle: Battle,
): { guild: Guild; battle: Battle } {
  if (battle.status === "active" || battle.rewarded) return { guild, battle };
  const result = { ...battle, rewarded: true };
  if (battle.status === "defeat") return { guild, battle: result };
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
