import type { ClassId } from "../domain/types";
import type { TacticId } from "../domain/combat/types";
export const ATTACK_PRIORITIES = {
  threat: "고위협",
  nearest: "가까운 적",
  weakest: "낮은 HP",
} as const;
export const FIELD = {
  width: 360,
  height: 420,
  exitY: 402,
  step: 0.05,
  radius: 10,
};
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
export const TACTICS: Record<
  TacticId,
  { name: string; description: string; pursuit: number }
> = {
  charge: {
    name: "전체 돌격",
    description: "진형보다 접근을 우선하고 전장 끝까지 추격합니다.",
    pursuit: 500,
  },
  balanced: {
    name: "균형 전술",
    description: "역할별 사거리와 진형을 고려해 제한적으로 추격합니다.",
    pursuit: 190,
  },
  protect: {
    name: "후위 보호",
    description: "전위가 지원자를 위협하는 적을 우선 차단합니다.",
    pursuit: 140,
  },
  hold: {
    name: "진형 유지",
    description: "홈 진형을 중심으로 짧게 추격하고 복귀합니다.",
    pursuit: 65,
  },
  focus: {
    name: "집중 공격",
    description: "공격 우선순위에 맞춰 고른 적 하나를 함께 공격합니다.",
    pursuit: 260,
  },
  retreat: {
    name: "전술적 후퇴",
    description: "후방 진형으로 이동하며 사거리 안의 적만 공격합니다.",
    pursuit: 45,
  },
};
