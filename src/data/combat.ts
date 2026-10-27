import type { ClassId } from "../domain/types";
export const FIELD = {
  width: 360,
  height: 420,
  exitY: 402,
  step: 0.05,
  radius: 10,
};
export const COMBAT_PROFILES: Record<
  ClassId,
  {
    role: "melee" | "ranged" | "healer" | "tank";
    range: number;
    interval: number;
    movement: number;
    skills: string[];
  }
> = {
  warrior: {
    role: "melee",
    range: 26,
    interval: 1.15,
    movement: 43,
    skills: ["power"],
  },
  archer: {
    role: "ranged",
    range: 145,
    interval: 1.3,
    movement: 48,
    skills: ["aimed"],
  },
  mage: {
    role: "ranged",
    range: 140,
    interval: 1.6,
    movement: 38,
    skills: ["burst"],
  },
  priest: {
    role: "healer",
    range: 120,
    interval: 1.6,
    movement: 40,
    skills: ["heal"],
  },
  rogue: {
    role: "melee",
    range: 24,
    interval: 0.9,
    movement: 58,
    skills: ["ambush"],
  },
  lancer: {
    role: "melee",
    range: 35,
    interval: 1.25,
    movement: 44,
    skills: ["sweep"],
  },
  guardian: {
    role: "tank",
    range: 26,
    interval: 1.5,
    movement: 35,
    skills: ["shield"],
  },
  bard: {
    role: "healer",
    range: 125,
    interval: 1.45,
    movement: 45,
    skills: ["melody"],
  },
};

// Compatibility exports; definitions remain independent of encounter type.
export { AUTO_SKILLS } from "./skills";
export type { AutoSkill } from "./skills";
export { TACTICS, ATTACK_PRIORITIES } from "./tactics";
