import {presetFor,selectPreset} from './battlePresets';
import {ATTRIBUTE_BASE} from "../data/weapons";
import { createMercenary, recruitCost, isHero } from "./characters";
import { NORMAL_PARTY_LIMIT } from "../data/party";
import type { Guild } from "./types";
export function candidatesFor(batch:number,guild?:Guild){
 const owned=new Set(guild?.roster.map(m=>presetFor(m)?.id)??[]),recent=new Set([...(guild?.recentPresetIds??[]),...(guild?.candidates.map(m=>presetFor(m)?.id??'')??[])]),used=new Set<string>();
 return Array.from({length:6},(_,i)=>{let best=createMercenary('recruit-'+batch+'-'+i),score=Infinity;for(let attempt=0;attempt<96;attempt++){const m=createMercenary('recruit-'+batch+'-'+i+(attempt?'-'+attempt:'')),p=presetFor(m),n=(used.has(p?.id??'')?1000:0)+(owned.has(p?.id)?100:0)+(recent.has(p?.id??'')?10:0);if(n<score){best=m;score=n;}if(!n)break;}const p=presetFor(best);if(p){best=selectPreset(best,p.id);used.add(p.id);}return best;});
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
    coreStats:{...ATTRIBUTE_BASE.warrior},
    story: "hero" as const,
    battlePresetId:"warrior_m_01",
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
    coreStats:{...ATTRIBUTE_BASE.archer},
    story: "ria" as const,
    battlePresetId:"archer_f_01",
    equipment: { weapon: "bow", armor: "cloth" },
    appearance: {
      hairStyle: 2,
      hairColor: "#d5b36c",
      skinColor: "#f3cda5",
      bodyType: 0,
    },
  };
  const guild:Guild = {
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
        coreStats:{...ATTRIBUTE_BASE[classId]},
        battlePresetId:undefined,
        equipment: { weapon, armor: "cloth" },
      })),
    ],
    candidates: candidatesFor(0),
    party: ["hero", "kael", "ria", "mira", "noel"],
    recruitBatch: 0,
    victories: 0,
  };
  guild.candidates=candidatesFor(0,guild);return guild;
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
  if (isHero(guild.roster.find((m) => m.id === id)!))
    throw Error("주인공은 일반 전투에 고정 출전합니다. 동료를 편성해 주세요.");
  const party = combatParty(guild).map((m) => m.id);
  if (party.includes(id)) {
    if (party.length === 1) throw Error("파티에는 최소 1명이 필요합니다.");
    return { ...guild, party: party.filter((x) => x !== id), formation: undefined };
  }
  if (party.length >= NORMAL_PARTY_LIMIT)
    throw Error(`파티는 주인공 포함 최대 ${NORMAL_PARTY_LIMIT}명입니다.`);
  return { ...guild, party: [...party, id], formation: undefined };
}
export function combatParty(guild: Guild) {
  const hero = guild.roster.find(isHero);
  const ids = [...(hero ? [hero.id] : []), ...guild.party];
  return [...new Set(ids)]
    .map((id) => guild.roster.find((m) => m.id === id))
    .filter((m): m is Guild["roster"][number] => !!m)
    .slice(0, NORMAL_PARTY_LIMIT);
}
