import { expect, it } from "vitest";
import { STATUS_EFFECTS } from "../data/statusEffects";
import {
  applyBarrier,
  absorbBarrierDamage,
  advanceStatusEffects,
} from "./statusEffects";

it("기존 보호막은 전투 유형 없이 피해를 흡수하고 데이터에 지정한 시점에 만료된다", () => {
  const state = { shield: 0, shieldUntil: 0 };
  applyBarrier(state, 30, 10);
  expect(state.shieldUntil).toBe(10 + STATUS_EFFECTS.barrier.duration);
  expect(absorbBarrierDamage(state, 12)).toBe(0);
  expect(state.shield).toBe(18);
  advanceStatusEffects(state, 12.99);
  expect(state.shield).toBe(18);
  advanceStatusEffects(state, 13);
  expect(state.shield).toBe(0);
  expect(absorbBarrierDamage(state, 9)).toBe(9);
});
it("보호막 재사용은 기존처럼 중첩 없이 대체하고 지속 시간을 갱신한다", () => {
  const state = { shield: 0, shieldUntil: 0 };
  applyBarrier(state, 30, 0);
  applyBarrier(state, 20, 1);
  expect(state).toEqual({ shield: 20, shieldUntil: 4 });
  expect(absorbBarrierDamage(state, 25)).toBe(5);
  expect(state.shield).toBe(0);
});
