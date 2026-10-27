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
    roster: [hero, ria],
    candidates: candidatesFor(0),
    party: ["hero", "ria"],
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
  if (guild.party.includes(id)) {
    if (guild.party.length === 1)
      throw Error("파티에는 최소 1명이 필요합니다.");
    return { ...guild, party: guild.party.filter((x) => x !== id) };
  }
  if (guild.party.length >= 4)
    throw Error("파티는 최대 4명까지 편성할 수 있습니다.");
  return { ...guild, party: [...guild.party, id] };
}
