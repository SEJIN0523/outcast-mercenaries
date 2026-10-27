// Production real-time combat. The previous sequential battle is preserved in legacy/.
export {
  startBattle,
  stepBattle,
  advanceBattle,
  changeTactic,
  changePriority,
  requestEscape,
  applyReward,
} from "./combat/simulation";
export {
  decideIntent,
  selectTarget,
  chooseAutoSkill,
  formationPoint,
} from "./combat/ai";
export type { CombatBattle, CombatUnit, TacticId } from "./combat/types";
