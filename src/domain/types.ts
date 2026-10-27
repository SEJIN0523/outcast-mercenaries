export type Gender = "male" | "female";
export type Race = "human" | "elf" | "dwarf";
export type ClassId =
  | "warrior"
  | "archer"
  | "mage"
  | "priest"
  | "rogue"
  | "lancer"
  | "guardian"
  | "bard";
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}
export interface Appearance {
  hairStyle: number;
  hairColor: string;
  skinColor: string;
  bodyType: number;
  eyeColor?: string;
  outfitColor?: string;
  outfitStyle?: number;
  weaponStyle?: number;
}
export interface Mercenary {
  id: string;
  name: string;
  gender: Gender;
  race: Race;
  classId: ClassId;
  level: number;
  xp: number;
  talent: number;
  potential: number;
  traitId: string;
  appearanceSeed: string;
  appearance: Appearance;
  equipment: { weapon: string; armor: string };
  story?: "hero" | "ria";
}
export interface Guild {
  name: string;
  gold: number;
  roster: Mercenary[];
  candidates: Mercenary[];
  party: string[];
  recruitBatch: number;
  victories: number;
}
export interface Unit {
  id: string;
  name: string;
  side: "party" | "enemy";
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  healer: boolean;
  mercenary?: Mercenary;
}
export interface Battle {
  units: Unit[];
  tick: number;
  cooldown: number;
  logs: string[];
  status: "active" | "victory" | "defeat";
  rewarded: boolean;
  participants: string[];
}
