export interface AutoSkill {
  name: string;
  kind: "heal" | "area" | "shield" | "power";
  cooldown: number;
  range: number;
  multiplier: number;
  condition:
    | { type: "hp-below"; threshold: number }
    | { type: "cluster"; radius: number; minCount: number }
    | { type: "threat"; radius: number; minCount: number; hpThreshold: number }
    | { type: "priority"; minThreat: number };
}
export const AUTO_SKILLS: Record<string, AutoSkill> = {
  heal: {
    name: "작은 치유",
    kind: "heal",
    cooldown: 4,
    range: 165,
    multiplier: 1.8,
    condition: { type: "hp-below", threshold: 0.5 },
  },
  melody: {
    name: "회복의 선율",
    kind: "heal",
    cooldown: 5,
    range: 155,
    multiplier: 1.5,
    condition: { type: "hp-below", threshold: 0.5 },
  },
  burst: {
    name: "화염 폭발",
    kind: "area",
    cooldown: 6,
    range: 145,
    multiplier: 1.4,
    condition: { type: "cluster", radius: 62, minCount: 3 },
  },
  sweep: {
    name: "회전 창격",
    kind: "area",
    cooldown: 5,
    range: 35,
    multiplier: 1.3,
    condition: { type: "cluster", radius: 52, minCount: 3 },
  },
  shield: {
    name: "수호의 방벽",
    kind: "shield",
    cooldown: 7,
    range: 0,
    multiplier: 2.5,
    condition: { type: "threat", radius: 70, minCount: 2, hpThreshold: 0.45 },
  },
  power: {
    name: "강타",
    kind: "power",
    cooldown: 4,
    range: 28,
    multiplier: 1.8,
    condition: { type: "priority", minThreat: 2 },
  },
  aimed: {
    name: "정밀 사격",
    kind: "power",
    cooldown: 5,
    range: 150,
    multiplier: 1.8,
    condition: { type: "priority", minThreat: 2 },
  },
  ambush: {
    name: "급소 찌르기",
    kind: "power",
    cooldown: 4,
    range: 25,
    multiplier: 2,
    condition: { type: "priority", minThreat: 2 },
  },
};
