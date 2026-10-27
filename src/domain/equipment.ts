import {ATTRIBUTE_BASE,ATTRIBUTE_GROWTH,WEAPONS,SHIELDS,MASTERY_GRADES} from '../data/weapons';
import type {Attributes,Mercenary,WeaponType} from './types';
export function attributesOf(m:Mercenary):Attributes{if(m.coreStats)return {...m.coreStats};const base=ATTRIBUTE_BASE[m.classId],growth=ATTRIBUTE_GROWTH[m.classId];return Object.fromEntries(Object.entries(base).map(([k,v])=>[k,v+growth[k as keyof Attributes]*(m.level-1)])) as Attributes;}
export function weaponOf(m:Mercenary){return WEAPONS[m.equipment.weapon]??WEAPONS.sword;}
export function mastery(m:Mercenary,type:WeaponType=weaponOf(m).type){const xp=m.weaponProficiency?.[type]??0;return [...MASTERY_GRADES].reverse().find(g=>xp>=g.xp)!;}
export function requirementErrors(m:Mercenary,id:string){const w=WEAPONS[id];if(!w)return ['알 수 없는 무기'];const a=attributesOf(m);return Object.entries(w.requirements).filter(([k,v])=>a[k as keyof Attributes]<v!).map(([k,v])=>`${k} ${v} 필요 (현재 ${Math.floor(a[k as keyof Attributes])})`);}
export function equipWeapon(m:Mercenary,id:string){const errors=requirementErrors(m,id);if(errors.length)throw Error(errors.join(', '));return {...m,equipment:{...m.equipment,weapon:id,...(WEAPONS[id].twoHanded?{shield:undefined}:{})}};}
export function equipShield(m:Mercenary,id:string|undefined){if(id&&!SHIELDS[id])throw Error('알 수 없는 방패');if(id&&weaponOf(m).twoHanded)throw Error('양손무기와 방패는 동시에 착용할 수 없습니다.');return {...m,equipment:{...m.equipment,shield:id}};}
export function weaponPower(m:Mercenary){const w=weaponOf(m),a=attributesOf(m);return Math.max(1,Math.floor((w.base+Object.entries(w.weights).reduce((s,[k,v])=>s+a[k as keyof Attributes]*v!,0))*mastery(m).efficiency));}
export function gainWeaponXp(m:Mercenary,type:WeaponType,xp:number):Mercenary{return {...m,weaponProficiency:{...m.weaponProficiency,[type]:Math.min(1e6,(m.weaponProficiency?.[type]??0)+Math.max(0,Math.floor(xp)))}};}
