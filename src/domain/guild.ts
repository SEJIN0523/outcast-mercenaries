import { createMercenary, recruitCost } from "./characters";
import type { Guild } from "./types";
export function candidatesFor(batch: number) {
  return Array.from({ length: 6 }, (_, i) =>
    createMercenary(`recruit-${batch}-${i}`),
  );
}
export function newGuild(): Guild {
  const hero = {
    ...createMercenary("outcast"),
    id: "hero",
    name: "단장",
    gender: "male" as const,
    race: "human" as const,
    classId: "warrior" as const,
    talent: 2,
    potential: 5,
    story: "hero" as const,
    equipment: { weapon: "sword", armor: "cloth" },
  };
  const ria = {
    ...createMercenary("ria"),
    id: "ria",
    name: "리아",
    gender: "female" as const,
    race: "elf" as const,
    classId: "archer" as const,
    talent: 3,
    potential: 4,
    story: "ria" as const,
    equipment: { weapon: "bow", armor: "cloth" },
    appearance: {
      hairStyle: 2,
      hairColor: "#d5b36c",
      skinColor: "#f3cda5",
      bodyType: 0,
    },
  };
  return {
    name: "새벽의 여명",
    gold: 240,
    roster: [
      hero,
      ria,
      ...(
        [
          ["kael", "카엘", "warrior", "sword"],
          ["mira", "미라", "priest", "staff"],
          ["noel", "노엘", "mage", "staff"],
        ] as const
      ).map(([id, name, classId, weapon]) => ({
        ...createMercenary(`starter-${id}`),
        id,
        name,
        classId,
        equipment: { weapon, armor: "cloth" },
      })),
    ],
    candidates: candidatesFor(0),
    party: ["kael", "ria", "mira", "noel"],
    recruitBatch: 0,
    victories: 0,
  };
}
export function recruit(guild: Guild, id: string): Guild {
  const m = guild.candidates.find((m) => m.id === id);
  if (!m) throw Error("모집할 용병을 찾을 수 없습니다.");
  if (guild.roster.length >= 24)
    throw Error("명부가 가득 찼습니다. 최대 24명입니다.");
  if (guild.gold < recruitCost(m))
    throw Error("모집에 필요한 골드가 부족합니다.");
  return {
    ...guild,
    gold: guild.gold - recruitCost(m),
    roster: [...guild.roster, m],
    candidates: guild.candidates.filter((c) => c.id !== id),
  };
}
export function toggleParty(guild: Guild, id: string): Guild {
  if (!guild.roster.some((m) => m.id === id))
    throw Error("소속 용병만 편성할 수 있습니다.");
  if (guild.roster.find((m) => m.id === id)?.story === "hero")
    throw Error("단장은 전장에 나가지 않고 전술을 지휘합니다.");
  const party = combatParty(guild).map((m) => m.id);
  if (party.includes(id)) {
    if (party.length === 1) throw Error("파티에는 최소 1명이 필요합니다.");
    return { ...guild, party: party.filter((x) => x !== id) };
  }
  if (party.length >= 4) throw Error("파티는 최대 4명까지 편성할 수 있습니다.");
  return { ...guild, party: [...party, id] };
}
export function combatParty(guild: Guild) {
  return guild.party
    .map((id) => guild.roster.find((m) => m.id === id))
    .filter((m): m is Guild["roster"][number] => !!m && m.story !== "hero");
}
