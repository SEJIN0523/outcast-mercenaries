import type { Unit } from "../types";
export type AttackPriority = "threat" | "nearest" | "weakest";
export type TacticId =
  "charge" | "balanced" | "protect" | "hold" | "focus" | "retreat";
export type Direction = "up" | "down" | "left" | "right";
export type Action =
  "idle" | "move" | "attack" | "cast" | "hurt" | "dead" | "escaped";
export interface Point {
  x: number;
  y: number;
}
export interface CombatUnit extends Unit, Point {
  home: Point;
  moveSpeed: number;
  range: number;
  radius: number;
  attackInterval: number;
  attackCooldown: number;
  skillCooldowns: Record<string, number>;
  skillIds: string[];
  targetId: string | null;
  direction: Direction;
  action: Action;
  actionUntil: number;
  role: "melee" | "ranged" | "healer" | "tank";
  threat: number;
  boss: boolean;
  shield: number;
  shieldUntil: number;
  escaped: boolean;
}
export interface CombatEvent extends Point {
  id: number;
  time: number;
  type: "attack" | "damage" | "heal" | "skill" | "death" | "escape" | "tactic";
  sourceId?: string;
  targetId?: string;
  amount?: number;
  label?: string;
}
export interface Projectile extends Point {
  id: number;
  sourceId: string;
  targetId: string;
  speed: number;
  damage: number;
  kind: "arrow" | "magic";
}
export interface CombatBattle {
  units: CombatUnit[];
  tick: number;
  elapsed: number;
  status: "active" | "victory" | "defeat" | "escaped";
  tactic: TacticId;
  priority: AttackPriority;
  focusId: string | null;
  events: CombatEvent[];
  projectiles: Projectile[];
  nextEventId: number;
  logs: string[];
  participants: string[];
  rewarded: boolean;
  escaping: boolean;
  speed: 1 | 2;
}
export type Intent =
  | { kind: "move"; point: Point; targetId: string | null }
  | { kind: "attack"; targetId: string }
  | { kind: "skill"; skillId: string; targetId: string }
  | { kind: "idle"; targetId: string | null };
