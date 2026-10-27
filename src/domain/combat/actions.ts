import {attributesOf} from "../equipment";
import { AUTO_SKILLS } from "../../data/skills";
import {STATUS_EFFECTS} from "../../data/statuses";
import { applyBarrier, absorbBarrierDamage } from "../statusEffects";
import { distance, living, rear } from "./spatial";
import type { CombatBattle, CombatUnit, CombatEvent } from "./types";

export function emitCombatEvent(
  b: CombatBattle,
  value: Omit<CombatEvent, "id" | "time">,
) {
  b.events.push({ ...value, id: b.nextEventId++, time: b.elapsed });
}
export function appendCombatLog(b: CombatBattle, text: string) {
  b.logs.push(text);
  b.logs = b.logs.slice(-40);
}
export function recordWeaponUse(b:CombatBattle,u:CombatUnit,amount=3){if(!u.mercenary||!u.weaponType)return;b.weaponXp??={};b.weaponXp[u.id]??={};b.weaponXp[u.id][u.weaponType]=Math.min(90,(b.weaponXp[u.id][u.weaponType]??0)+amount);}
export function applyDamage(
  b: CombatBattle,
  a: CombatUnit,
  t: CombatUnit,
  power: number,
  weaponAction=true,
) {
  if (!living(t)) return;
  const weak=(a.statuses??[]).filter(s=>s.until>b.elapsed).reduce((n,s)=>n*STATUS_EFFECTS[s.id].attackMultiplier,1),guard=(t.statuses??[]).filter(s=>s.until>b.elapsed).reduce((n,s)=>n+STATUS_EFFECTS[s.id].defense,0);
  let hit = Math.max(1, Math.floor(power*weak) - t.defense-guard);
  hit = absorbBarrierDamage(t, hit);
  const actual = Math.min(t.hp, hit);
  t.hp -= actual;
  if(actual>0&&weaponAction)recordWeaponUse(b,a,3+(t.boss?1:0));
  t.action = t.hp <= 0 ? "dead" : "hurt";
  t.actionUntil = b.elapsed + 0.22;
  emitCombatEvent(b, {
    type: "damage",
    sourceId: a.id,
    targetId: t.id,
    x: t.x,
    y: t.y,
    amount: actual,
  });
  if (t.hp <= 0) {
    t.targetId = null;
    emitCombatEvent(b, { type: "death", targetId: t.id, x: t.x, y: t.y });
    appendCombatLog(b, `${t.name} 전투 불능`);
  }
}
export function launchProjectile(
  b: CombatBattle,
  a: CombatUnit,
  t: CombatUnit,
  power: number,
  weaponAction=true,
) {
  b.projectiles.push({
    id: b.nextEventId++,
    sourceId: a.id,
    targetId: t.id,
    x: a.x,
    y: a.y,
    speed: 230,
    damage: power,weaponAction,
    kind:
      a.attackMode === "ranged" || a.side === "enemy"
        ? "arrow"
        : "magic",
  });
}
export function useAutomaticSkill(
  b: CombatBattle,
  u: CombatUnit,
  target: CombatUnit,
  id: string,
) {
  const s = AUTO_SKILLS[id];
  const base=s.scaling&&u.mercenary?attributesOf(u.mercenary)[s.scaling]*1.4:u.attack;
  const weaponAction=s.category==="weapon"||!!(s.requiredWeapons&&u.weaponType&&s.requiredWeapons.includes(u.weaponType));
  u.skillCooldowns[id] = s.cooldown;
  u.attackCooldown = Math.max(u.attackCooldown, 0.35);
  u.action = "cast";
  u.actionUntil = b.elapsed + 0.35;
  emitCombatEvent(b, {
    type: "skill",
    sourceId: u.id,
    targetId: target.id,
    x: target.x,
    y: target.y,
    label: s.name,
  });
  appendCombatLog(b, `${u.name} · ${s.name} 자동 발동`);
  if (s.kind === "heal") {
    const amount = Math.min(
      target.maxHp - target.hp,
      Math.floor(base * s.multiplier),
    );
    target.hp += amount;
    if(amount>0&&u.weaponType==="staff")recordWeaponUse(b,u,3);
    emitCombatEvent(b, {
      type: "heal",
      sourceId: u.id,
      targetId: target.id,
      x: target.x,
      y: target.y,
      amount,
    });
  } else if(s.kind==='buff'||s.kind==='debuff'){
    const targets=s.kind==='buff'?b.units.filter(a=>a.side===u.side&&living(a)&&distance(a,u)<150):[target];
    const status=s.status??(s.kind==='buff'?'guard':'weaken');
    for(const t of targets){t.statuses=(t.statuses??[]).filter(x=>x.id!==status);t.statuses.push({id:status,until:b.elapsed+STATUS_EFFECTS[status].duration});}
  } else if (s.kind === "shield") {
    applyBarrier(u, Math.floor(base * s.multiplier), b.elapsed);
  } else if (s.kind === "area") {
    const radius = s.condition.type === "cluster" ? s.condition.radius : 50;
    b.units
      .filter(
        (t) => t.side !== u.side && living(t) && distance(t, target) <= radius,
      )
      .forEach((t) => applyDamage(b, u, t, base * s.multiplier,weaponAction));
  } else if (rear(u)) launchProjectile(b, u, target, base * s.multiplier,weaponAction);
  else applyDamage(b, u, target, base * s.multiplier,weaponAction);
}
