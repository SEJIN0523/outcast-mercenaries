import type { ClassId, Stats } from "../domain/types";
export const CLASSES: Record<
  ClassId,
  {
    name: string;
    role: string;
    color: string;
    stats: Stats;
    growth: Stats;
    weapon: string;
    branches: string[];
    advanced: string[];
  }
> = {
  warrior: {
    name: "전사",
    role: "균형 잡힌 전위",
    color: "#b87055",
    stats: { hp: 100, attack: 17, defense: 5, speed: 7 },
    growth: { hp: 12, attack: 3, defense: 1, speed: 0.3 },
    weapon: "sword",
    branches: ["기사", "광전사"],
    advanced: ["성기사 · 수호기사", "학살자 · 검투사"],
  },
  archer: {
    name: "궁수",
    role: "민첩한 후위 공격수",
    color: "#7b9b65",
    stats: { hp: 76, attack: 20, defense: 2, speed: 12 },
    growth: { hp: 8, attack: 4, defense: 0.6, speed: 0.6 },
    weapon: "bow",
    branches: ["사냥꾼", "정찰병"],
    advanced: ["마수사냥꾼 · 저격수", "유격대장 · 그림자궁수"],
  },
  mage: {
    name: "마법사",
    role: "강력한 마법 공격수",
    color: "#9983b5",
    stats: { hp: 65, attack: 25, defense: 1, speed: 8 },
    growth: { hp: 7, attack: 5, defense: 0.5, speed: 0.3 },
    weapon: "staff",
    branches: ["원소술사", "비전술사"],
    advanced: ["폭풍현자 · 화염현자", "시공술사 · 마도학자"],
  },
  priest: {
    name: "사제",
    role: "아군을 치유하는 지원가",
    color: "#d5be87",
    stats: { hp: 75, attack: 14, defense: 3, speed: 9 },
    growth: { hp: 9, attack: 3, defense: 0.8, speed: 0.3 },
    weapon: "staff",
    branches: ["치유사", "수도사"],
    advanced: ["성녀(성자) · 대사제", "성권사 · 수행자"],
  },
  rogue: {
    name: "도적",
    role: "재빠른 선제 공격수",
    color: "#8c9cad",
    stats: { hp: 73, attack: 18, defense: 2, speed: 16 },
    growth: { hp: 8, attack: 4, defense: 0.5, speed: 0.8 },
    weapon: "dagger",
    branches: ["암살자", "척후병"],
    advanced: ["밤의칼날 · 독술사", "모험가 · 유령정찰자"],
  },
  lancer: {
    name: "창병",
    role: "단단한 전열 공격수",
    color: "#758eae",
    stats: { hp: 95, attack: 20, defense: 4, speed: 8 },
    growth: { hp: 11, attack: 4, defense: 0.9, speed: 0.4 },
    weapon: "spear",
    branches: ["장창병", "용기병"],
    advanced: ["철벽창병 · 전쟁군주", "천공기사 · 비룡기사"],
  },
  guardian: {
    name: "기사",
    role: "체력이 높은 방어수",
    color: "#a79463",
    stats: { hp: 130, attack: 12, defense: 9, speed: 4 },
    growth: { hp: 16, attack: 2, defense: 2, speed: 0.2 },
    weapon: "sword",
    branches: ["방패기사", "파수꾼"],
    advanced: ["성채기사 · 왕실근위", "결계수호자 · 숲의수호자"],
  },
  alchemist: {
    name: "연금술사", role: "약병과 회복제를 사용하는 후열", color: "#6faaa0",
    stats: { hp: 72, attack: 18, defense: 2, speed: 9 },
    growth: { hp: 8, attack: 4, defense: 0.6, speed: 0.4 },
    weapon: "flask", branches: ["약제사", "폭약사"], advanced: ["생명연구자", "연성술사"],
  },
  bard: {
    name: "음유시인",
    role: "균형형 지원 공격수",
    color: "#bd7f9b",
    stats: { hp: 80, attack: 16, defense: 3, speed: 11 },
    growth: { hp: 9, attack: 3, defense: 0.7, speed: 0.5 },
    weapon: "lute",
    branches: ["악사", "무희"],
    advanced: ["영혼연주자 · 궁정악사", "검무가 · 별의무희"],
  },
};
export const TRAITS: Record<
  string,
  { name: string; description: string; bonus: Partial<Stats> }
> = {
  brave: {
    name: "용감한 심장",
    description: "공격력 +3",
    bonus: { attack: 3 },
  },
  hardy: {
    name: "강인한 생명",
    description: "최대 체력 +18",
    bonus: { hp: 18 },
  },
  nimble: {
    name: "가벼운 발걸음",
    description: "속도 +3",
    bonus: { speed: 3 },
  },
  steady: {
    name: "굳건한 의지",
    description: "방어력 +2",
    bonus: { defense: 2 },
  },
};
export const EQUIPMENT: Record<
  string,
  { name: string; spriteKey: string; bonus: Partial<Stats> }
> = {
  greatsword:{name:'보병 양손검',spriteKey:'weapon/greatsword',bonus:{attack:3}},
  axe:{name:'견습 도끼',spriteKey:'weapon/axe',bonus:{attack:2}},
  club:{name:'튼튼한 둔기',spriteKey:'weapon/club',bonus:{attack:2}},
  flask: { name: "여행용 연금 도구", spriteKey: "weapon/alchemy-kit", bonus: { attack: 2 } },
  sword: {
    name: "낡은 철검",
    spriteKey: "weapon/iron-sword",
    bonus: { attack: 2 },
  },
  bow: { name: "참나무 활", spriteKey: "weapon/oak-bow", bonus: { attack: 2 } },
  staff: {
    name: "견습 지팡이",
    spriteKey: "weapon/apprentice-staff",
    bonus: { attack: 2 },
  },
  dagger: {
    name: "철제 단검",
    spriteKey: "weapon/iron-dagger",
    bonus: { attack: 2 },
  },
  spear: {
    name: "민병대의 창",
    spriteKey: "weapon/militia-spear",
    bonus: { attack: 2 },
  },
  lute: {
    name: "여행자의 류트",
    spriteKey: "weapon/traveler-lute",
    bonus: { attack: 2 },
  },
  cloth: {
    name: "여행자 방어구",
    spriteKey: "armor/traveler",
    bonus: { defense: 1 },
  },
};
/** Preserved sequential-combat data. Production AI uses AUTO_SKILLS in skills.ts. */
export const SKILLS = {
  focus: {
    name: "집중 공격",
    cooldown: 5,
    multiplier: 1.8,
    description: "첫 생존 아군이 적에게 180% 공격. 재사용 5턴.",
  },
  heal: {
    name: "작은 치유",
    multiplier: 1.3,
    description: "부상한 아군을 우선 치유한다.",
  },
};
export const RACES = {human:"인간",elf:"엘프","dark-elf":"다크 엘프","half-elf":"하프엘프",catkin:"고양이 수인",foxkin:"여우 수인",wolfkin:"늑대 수인",dwarf:"드워프"};
