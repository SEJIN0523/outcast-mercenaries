import { STATUS_EFFECTS } from "../data/statusEffects";

/** Ephemeral effect state, independent of battle type and persisted characters. */
export interface BarrierState {
  shield: number;
  shieldUntil: number;
}
export function applyBarrier(
  state: BarrierState,
  amount: number,
  time: number,
) {
  state.shield = amount;
  state.shieldUntil = time + STATUS_EFFECTS.barrier.duration;
}
export function advanceStatusEffects(state: BarrierState, time: number) {
  if (state.shieldUntil <= time) state.shield = 0;
}
export function absorbBarrierDamage(
  state: BarrierState,
  incoming: number,
): number {
  const blocked = Math.min(state.shield, incoming);
  state.shield -= blocked;
  return incoming - blocked;
}
