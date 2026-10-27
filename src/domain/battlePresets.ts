import catalog from '../data/battle-presets.json';
import {random} from './random';
import type {Mercenary,ClassId,Gender} from './types';
export const BATTLE_PRESETS=catalog;
export type BattlePreset=typeof catalog[number];
export const PRESET_JOBS:Partial<Record<ClassId,string>>={warrior:'warrior',guardian:'knight',archer:'archer',mage:'mage',priest:'priest',rogue:'thief',lancer:'lancer',alchemist:'alchemist'};
export function availablePresets(classId:ClassId,gender:Gender){return catalog.filter(p=>p.classId===classId&&p.gender===gender);}
export function presetFor(m:Mercenary):BattlePreset|undefined{
 const pool=availablePresets(m.classId,m.gender);if(!pool.length)return;
 const chosen=pool.find(p=>p.id===m.battlePresetId);if(chosen)return chosen;
 const fixed:Record<string,string>={hero:'warrior_m_01',ria:'archer_f_01',kael:'warrior_m_02',mira:'priest_m_02',noel:'mage_m_01'};
 const story=pool.find(p=>p.id===fixed[m.id]);if(story)return story;
 return pool[Math.floor(random('battle-preset-v1:'+m.appearanceSeed)()*pool.length)];
}
export function generatedPresetId(seed:string,classId:ClassId,gender:Gender){const pool=availablePresets(classId,gender);return pool.length?pool[Math.floor(random('battle-preset-v1:'+seed)()*pool.length)].id:undefined;}
export function selectPreset(m:Mercenary,id:string):Mercenary{const p=availablePresets(m.classId,m.gender).find(p=>p.id===id);if(!p)throw Error('직업과 성별이 일치하는 프리셋을 선택해 주세요.');return {...m,battlePresetId:id,appearance:{...m.appearance,bodyPreset:p.bodyType as Mercenary['appearance']['bodyPreset'],facePreset:m.appearance.facePreset??p.id+'-face',hairPreset:m.appearance.hairPreset??p.id+'-hair',advancementTier:m.appearance.advancementTier??1}};}
