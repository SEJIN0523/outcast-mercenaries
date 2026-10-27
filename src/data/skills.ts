import type {WeaponType} from "../domain/types";
export interface AutoSkill {
  category?:"class"|"weapon"|"general";
  requiredWeapons?:WeaponType[];
  scaling?:"INT"|"SPI";
  status?:"guard"|"weaken";
  name: string;
  kind: "heal" | "area" | "shield" | "power" | "buff" | "debuff";
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
 weaponStrike:{name:'숙련 타격',category:'weapon',requiredWeapons:['sword','greatsword','dagger','axe','spear','club'],kind:'power',range:45,cooldown:5,multiplier:1.45,condition:{type:'priority',minThreat:2}},
 weaponShot:{name:'숙련 사격',category:'weapon',requiredWeapons:['bow'],kind:'power',range:300,cooldown:6,multiplier:1.45,condition:{type:'priority',minThreat:2}},
 weaponArc:{name:'숙련 마력탄',category:'weapon',requiredWeapons:['staff'],kind:'area',range:280,cooldown:7,multiplier:1.2,condition:{type:'cluster',radius:125,minCount:2}},
 rally:{name:'호위 태세',category:'class',kind:'buff',range:0,cooldown:8,multiplier:1,status:'guard',condition:{type:'threat',radius:150,minCount:1,hpThreshold:.65}},
 hex:{name:'약화 시약',category:'class',kind:'debuff',range:280,cooldown:7,multiplier:0,status:'weaken',condition:{type:'priority',minThreat:2}},
  tonic:{name:'회복 약병',kind:'heal',cooldown:6,range:300,multiplier:1.8,condition:{type:'hp-below',threshold:.5}},
  bomb:{name:'연금 폭탄',kind:'area',cooldown:7,range:290,multiplier:1.3,condition:{type:'cluster',radius:125,minCount:2}},
  heal: {category:"class",scaling:"SPI",
    name: "작은 치유",
    kind: "heal",
    cooldown: 4,
    range: 270,
    multiplier: 1.8,
    condition: { type: "hp-below", threshold: 0.5 },
  },
  melody: {
    name: "회복의 선율",
    kind: "heal",
    cooldown: 5,
    range: 270,
    multiplier: 1.5,
    condition: { type: "hp-below", threshold: 0.5 },
  },
  burst: {category:"class",scaling:"INT",
    name: "화염 폭발",
    kind: "area",
    cooldown: 6,
    range: 290,
    multiplier: 1.4,
    condition: { type: "cluster", radius: 125, minCount: 2 },
  },
  sweep: {category:"class",requiredWeapons:["spear"],
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
  power: {category:"class",requiredWeapons:["sword","greatsword","dagger","axe","spear","club"],
    name: "강타",
    kind: "power",
    cooldown: 4,
    range: 28,
    multiplier: 1.8,
    condition: { type: "priority", minThreat: 2 },
  },
  aimed: {category:"class",requiredWeapons:["bow"],
    name: "정밀 사격",
    kind: "power",
    cooldown: 5,
    range: 290,
    multiplier: 1.8,
    condition: { type: "priority", minThreat: 2 },
  },
  ambush: {category:"class",requiredWeapons:["dagger","sword"],
    name: "급소 찌르기",
    kind: "power",
    cooldown: 4,
    range: 25,
    multiplier: 2,
    condition: { type: "priority", minThreat: 2 },
  },
};
