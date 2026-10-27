import type {Attributes,ClassId,WeaponType} from '../domain/types';
export interface WeaponDefinition{type:WeaponType;label:string;requirements:Partial<Attributes>;weights:Partial<Attributes>;base:number;range:number;interval:number;twoHanded:boolean;mode:'melee'|'ranged'|'magic';assetId:string}
export const WEAPONS:Record<string,WeaponDefinition>={
 sword:{type:'sword',label:'한손검',requirements:{STR:6},weights:{STR:.9,DEX:.2},base:5,range:28,interval:1.25,twoHanded:false,mode:'melee',assetId:'sword'},
 greatsword:{type:'greatsword',label:'양손검',requirements:{STR:16},weights:{STR:1.3,DEX:.1},base:8,range:35,interval:1.85,twoHanded:true,mode:'melee',assetId:'greatsword'},
 dagger:{type:'dagger',label:'단검',requirements:{DEX:6},weights:{DEX:.8,STR:.2},base:3,range:25,interval:.95,twoHanded:false,mode:'melee',assetId:'dagger'},
 axe:{type:'axe',label:'도끼',requirements:{STR:10},weights:{STR:1.15},base:7,range:30,interval:1.65,twoHanded:false,mode:'melee',assetId:'axe'},
 spear:{type:'spear',label:'창',requirements:{STR:8,DEX:8},weights:{STR:.65,DEX:.55},base:5,range:42,interval:1.4,twoHanded:true,mode:'melee',assetId:'spear'},
 bow:{type:'bow',label:'활',requirements:{DEX:8},weights:{DEX:1.05,STR:.1},base:4,range:300,interval:1.4,twoHanded:true,mode:'ranged',assetId:'bow'},
 staff:{type:'staff',label:'지팡이',requirements:{INT:8},weights:{INT:1.05,SPI:.2},base:4,range:280,interval:1.65,twoHanded:false,mode:'magic',assetId:'staff'},
 club:{type:'club',label:'둔기',requirements:{STR:6},weights:{STR:.85,VIT:.25},base:5,range:28,interval:1.45,twoHanded:false,mode:'melee',assetId:'club'},
};
// Existing save IDs are aliases, never removed or converted into missing items.
WEAPONS.flask={...WEAPONS.staff,label:'연금 도구',assetId:'staff'};
WEAPONS.lute={...WEAPONS.staff,requirements:{SPI:6},weights:{SPI:.9,DEX:.2},label:'여행자의 류트',assetId:'staff'};
export const SHIELDS:Record<string,{name:string;defense:number;assetId:string;scale:number}>={
 'wood-shield':{name:'작은 나무 방패',defense:2,assetId:'shield',scale:1},
 'iron-shield':{name:'견습 철제 방패',defense:3,assetId:'shield',scale:1.1},
 'tower-shield':{name:'큰 보병 방패',defense:4,assetId:'shield',scale:1.2},
};
export const ATTRIBUTE_BASE:Record<ClassId,Attributes>={
 warrior:{STR:12,DEX:9,VIT:11,INT:7,SPI:7},guardian:{STR:11,DEX:8,VIT:13,INT:8,SPI:8},archer:{STR:8,DEX:14,VIT:8,INT:8,SPI:8},mage:{STR:6,DEX:9,VIT:7,INT:14,SPI:10},priest:{STR:7,DEX:8,VIT:9,INT:10,SPI:14},rogue:{STR:8,DEX:14,VIT:8,INT:8,SPI:7},lancer:{STR:11,DEX:11,VIT:10,INT:7,SPI:7},alchemist:{STR:7,DEX:11,VIT:8,INT:13,SPI:9},bard:{STR:8,DEX:10,VIT:9,INT:9,SPI:11},
};
export const ATTRIBUTE_GROWTH:Record<ClassId,Attributes>={
 warrior:{STR:2,DEX:1,VIT:2,INT:.5,SPI:.5},guardian:{STR:1.5,DEX:.5,VIT:2.5,INT:.5,SPI:1},archer:{STR:.5,DEX:2.5,VIT:1,INT:.5,SPI:.5},mage:{STR:.5,DEX:1,VIT:.5,INT:2.5,SPI:1.5},priest:{STR:.5,DEX:.5,VIT:1.5,INT:1,SPI:2.5},rogue:{STR:1,DEX:2.5,VIT:1,INT:.5,SPI:.5},lancer:{STR:1.5,DEX:1.5,VIT:1.5,INT:.5,SPI:.5},alchemist:{STR:.5,DEX:1.5,VIT:1,INT:2,SPI:1},bard:{STR:.5,DEX:1.5,VIT:1,INT:1,SPI:2},
};
export const MASTERY_GRADES=[{rank:'F',xp:0,efficiency:1,speed:1},{rank:'E',xp:30,efficiency:1.02,speed:.99},{rank:'D',xp:90,efficiency:1.04,speed:.98},{rank:'C',xp:210,efficiency:1.06,speed:.97},{rank:'B',xp:450,efficiency:1.08,speed:.96},{rank:'A',xp:900,efficiency:1.1,speed:.95},{rank:'S',xp:1800,efficiency:1.12,speed:.94}] as const;
