// Stable application entry point; normal setup and shared simulation are separate.
export { startBattle, applyReward } from "./combat/normalBattle";
export { stepBattle, advanceBattle } from "./combat/simulation";
export { changeTactic, changePriority, requestEscape } from "./combat/commands";
export {
  decideIntent,
  selectTarget,
  chooseAutoSkill,
  formationPoint,
} from "./combat/ai";
export type { CombatBattle, CombatUnit, TacticId } from "./combat/types";
