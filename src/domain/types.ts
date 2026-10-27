export type Gender = "male" | "female";
export type Race = "human" | "elf" | "dark-elf" | "half-elf" | "catkin" | "foxkin" | "wolfkin" | "dwarf";
export type BodyPreset="petite"|"slim"|"standard"|"curvy"|"broad";
export type Attributes={STR:number;DEX:number;VIT:number;INT:number;SPI:number};
export type WeaponType="sword"|"greatsword"|"dagger"|"axe"|"spear"|"bow"|"staff"|"club";
export type SlotId=`F${1|2|3|4|5}`|`B${1|2|3|4|5}`;
export type Formation={slots:Partial<Record<SlotId,string>>};
export type ClassId =
  | "warrior"
  | "archer"
  | "mage"
  | "priest"
  | "rogue"
  | "lancer"
  | "guardian"
  | "alchemist"
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
  bodyPreset?:BodyPreset;
  facePreset?:string;
  hairPreset?:string;
  advancementTier?:number;
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
  equipment: { weapon: string; armor: string; shield?:string };
  coreStats?:Attributes;
  weaponProficiency?:Partial<Record<WeaponType,number>>;
  story?: "hero" | "ria";
  battlePresetId?: string;
}
export interface Guild {
  name: string;
  gold: number;
  roster: Mercenary[];
  candidates: Mercenary[];
  party: string[];
  recruitBatch: number;
  victories: number;
  formation?: Formation;
  formationPresets?:{id:string;name:string;formation:Formation}[];
  recentPresetIds?:string[];
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
