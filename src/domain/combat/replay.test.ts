import {expect,it} from 'vitest';import {newGuild} from '../guild';import {startBattle,stepBattle,changeTactic} from '../battle';
// The pre-renewal snapshot is archived in docs/legacy; v4 intentionally changes movement.
function replay(){let b=startBattle(newGuild());const frames=[];for(let i=0;i<3600&&b.status==='active';i++){if(i===30)b=changeTactic(b,'protect');if(i===60)b=changeTactic(b,'charge');b=stepBattle(b);if([20,60,120].includes(b.tick)||b.status!=='active')frames.push(structuredClone(b));}return frames;}
it('같은 v4 입력과 전술 타임라인을 재생하면 위치·피해·숙련·결과가 동일하다',()=>{const a=replay(),b=replay();expect(a).toEqual(b);expect(a.at(-1)?.status).toBe('victory');expect(a.at(-1)?.weaponXp?.hero?.sword).toBeGreaterThan(0);});
