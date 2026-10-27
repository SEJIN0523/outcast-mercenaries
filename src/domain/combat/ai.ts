import {FIELD} from '../../data/combat';
import {AUTO_SKILLS} from '../../data/skills';
import {getBattleOrders} from './commands';
import {distance,living,rear} from './spatial';
import {effectiveHome,rowOf} from './formation';
import type {CombatBattle,CombatUnit,Intent,Point,TacticalOrders} from './types';
export {distance,living,rear} from './spatial';
export const formationPoint=effectiveHome;
export function threatToRear(enemy:CombatUnit,b:CombatBattle){return Math.max(0,...b.units.filter(a=>a.side!==enemy.side&&living(a)&&rowOf(a)==='rear').map(a=>(enemy.targetId===a.id?180:0)+Math.max(0,100-distance(enemy,a))));}
export function selectTarget(u:CombatUnit,b:CombatBattle,orders:TacticalOrders=getBattleOrders(b)):CombatUnit|undefined{
 const enemies=b.units.filter(t=>t.side!==u.side&&living(t));
 if(u.side==='party'&&orders.tactic==='focus'){const target=enemies.find(t=>t.id===orders.focusId);if(target)return target;}
 const bypass=u.mercenary?.classId==='rogue'||u.side==='party'&&(orders.tactic==='charge'||orders.tactic==='protect');
 const front=enemies.filter(t=>rowOf(t)==='front');
 const pool=(!bypass&&!rear(u)&&front.length)?front:enemies;
 return [...pool].sort((a,c)=>score(a)-score(c))[0];
 function score(t:CombatUnit){let n=distance(u,t)*.3+Math.abs(u.home.y-t.home.y)*.3-(u.targetId===t.id?12:0);
  if(u.side==='party'){
   if(orders.priority==='threat')n-=t.threat*18;
   if(orders.priority==='weakest')n+=t.hp/t.maxHp*100;
   if(orders.tactic==='charge')n+=t.hp*.5;
   if(orders.tactic==='protect'&&rowOf(u)==='front')n-=threatToRear(t,b)*1.5;
  }else if(rear(u)){n-=t.healer?65:0;if(orders.tactic==='protect')n+=rowOf(t)==='rear'?100:-30;}
  return n;
 }
}
export function chooseAutoSkill(
  u: CombatUnit,
  b: CombatBattle,
): Intent | undefined {
  for (const skillId of u.skillIds) {
    const s = AUTO_SKILLS[skillId];
    if (!s || (u.skillCooldowns[skillId] ?? 0) > 0) continue;
    if(s.requiredWeapons&&(!u.weaponType||!s.requiredWeapons.includes(u.weaponType)))continue;
    const allies = b.units.filter((t) => t.side === u.side && living(t));
    const enemies = b.units.filter((t) => t.side !== u.side && living(t));
    const condition = s.condition;
    if (condition.type === "hp-below") {
      const hurt = allies
        .filter(
          (a) =>
            a.hp / a.maxHp <= condition.threshold && distance(u, a) <= s.range,
        )
        .sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp)[0];
      if (hurt) return { kind: "skill", skillId, targetId: hurt.id };
    } else if (condition.type === "cluster") {
      const target = enemies
        .filter(
          (t) =>
            distance(u, t) <= s.range &&
            enemies.filter((e) => distance(t, e) <= condition.radius).length >=
              condition.minCount,
        )
        .sort((a, c) => distance(u, a) - distance(u, c))[0];
      if (target) return { kind: "skill", skillId, targetId: target.id };
    } else if (condition.type === "threat") {
      if (
        u.hp / u.maxHp <= condition.hpThreshold ||
        enemies.filter((e) => distance(u, e) < condition.radius).length >=
          condition.minCount
      )
        return { kind: "skill", skillId, targetId: u.id };
    } else if (condition.type === "priority") {
      const target = enemies
        .filter(
          (t) =>
            (t.boss || t.threat >= condition.minThreat) &&
            distance(u, t) <= s.range,
        )
        .sort(
          (a, c) => c.threat - a.threat || distance(u, a) - distance(u, c),
        )[0];
      if (target) return { kind: "skill", skillId, targetId: target.id };
    }
  }
}
export function decideIntent(u:CombatUnit,b:CombatBattle,orders:TacticalOrders=getBattleOrders(b)):Intent{
 if(!living(u))return {kind:'idle',targetId:null};
 const home=formationPoint(u,orders),sign=u.side==='party'?1:-1;
 const move=(point:Point,targetId:string|null):Intent=>({kind:'move',point,targetId});
 if(orders.escaping&&u.side==='party')return move({x:FIELD.exitX-3,y:u.home.y},null);
 if(u.side==='party'&&orders.tactic==='retreat'&&distance(u,home)>3)return move(home,null);
 if(u.side==='party'&&orders.tactic==='hold'&&distance(u,home)>25)return move(home,u.targetId);
 // Every melee strike has a return phase. Ranged/support actors remain on their row.
 if((!rear(u)&&u.attackCooldown>.12)||rear(u)){
   if(distance(u,home)>3)return move(home,u.targetId);
 }
 const skill=chooseAutoSkill(u,b);if(skill)return skill;
 const target=selectTarget(u,b,orders);if(!target)return {kind:'idle',targetId:null};
 const gap=distance(u,target);
 if(rear(u)){
   if(gap<=u.range&&u.attackCooldown<=0)return {kind:'attack',targetId:target.id};
   return {kind:'idle',targetId:target.id};
 }
 if(u.attackCooldown>0)return {kind:'idle',targetId:target.id};
 if(u.side==='party'){
   if(orders.tactic==='hold'&&distance(target,home)>100)return distance(u,home)>3?move(home,target.id):{kind:'idle',targetId:target.id};
   if(orders.tactic==='retreat'&&gap>u.range+8)return {kind:'idle',targetId:target.id};
 }
 if(gap<=u.range)return {kind:'attack',targetId:target.id};
 const approach={x:target.x-sign*Math.max(14,u.range-2),y:target.y};
 if(u.side==='party'&&orders.tactic==='protect'&&threatToRear(target,b)===0&&distance(approach,home)>125)return {kind:'idle',targetId:target.id};
 return move(approach,target.id);
}
