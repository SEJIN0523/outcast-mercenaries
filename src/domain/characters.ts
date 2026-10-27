import { CLASSES, EQUIPMENT, TRAITS } from "../data/catalog";
import { random } from "./random";
import type { ClassId, Mercenary, Stats } from "./types";
export const isHero = (m: Mercenary) => m.story === "hero" || m.id === "hero";
export const HAIR = [
  "#584135",
  "#d5b36c",
  "#a34e3a",
  "#c2c9d0",
  "#353241",
  "#73909a",
];
export const SKIN = ["#f3cda5", "#dca67b", "#bd805e", "#885b46"];
export function generateMercenary(seed: string): Mercenary {
  const rng = random(seed);
  const pick = <T>(a: T[]) => a[Math.floor(rng() * a.length)];
  const gender = pick<"male" | "female">(["male", "female"]);
  const classId = pick(Object.keys(CLASSES) as ClassId[]);
  const name =
    gender === "male"
      ? pick(["에단", "카일", "루카", "테오", "렌", "아론", "시온", "로웬"])
      : pick(["세나", "엘린", "미아", "루나", "이브", "유나", "노아", "아델"]);
  return {
    id: `merc-${seed}`,
    name,
    gender,
    race: pick(["human", "elf", "dwarf"]),
    classId,
    level: 1,
    xp: 0,
    talent: 1 + Math.floor(rng() * 5),
    potential: 1 + Math.floor(rng() * 5),
    traitId: pick(Object.keys(TRAITS)),
    appearanceSeed: seed,
    appearance: {
      hairStyle: Math.floor(rng() * 4),
      hairColor: pick(HAIR),
      skinColor: pick(SKIN),
      bodyType: Math.floor(rng() * 3),
    },
    equipment: { weapon: CLASSES[classId].weapon, armor: "cloth" },
  } satisfies Mercenary;
}
export const createMercenary = generateMercenary;
export function statsOf(m: Mercenary): Stats {
  const c = CLASSES[m.classId];
  const result = { ...c.stats };
  for (const key of Object.keys(result) as (keyof Stats)[]) {
    result[key] = Math.floor(
      c.stats[key] +
        c.growth[key] * (m.level - 1) * (1 + m.talent * 0.06) +
        (TRAITS[m.traitId]?.bonus[key] ?? 0) +
        (EQUIPMENT[m.equipment.weapon]?.bonus[key] ?? 0) +
        (EQUIPMENT[m.equipment.armor]?.bonus[key] ?? 0),
    );
  }
  return result;
}
export const xpNeeded = (level: number) => level * 40;
export function gainXp(m: Mercenary, amount: number): Mercenary {
  let { level, xp } = m;
  xp += amount;
  while (level < 50 && xp >= xpNeeded(level)) {
    xp -= xpNeeded(level);
    level++;
  }
  if (level === 50) xp = 0;
  return { ...m, level, xp };
}
export const recruitCost = (m: Mercenary) => 45 + (m.talent + m.potential) * 6;
