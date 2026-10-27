import { newGuild, recruit, toggleParty, candidatesFor } from "../domain/guild";
import {
  applyReward,
  startBattle,
  tickBattle,
  focusAttack,
} from "../domain/battle";
import { decodeSave, readSave, writeSave } from "../persistence/save";
import type { Battle, Guild } from "../domain/types";
export interface Snapshot {
  guild: Guild;
  battle: Battle | null;
  paused: boolean;
  loaded: boolean;
  notice: string;
  saveStatus: string;
  saveBlocked: boolean;
}
let state: Snapshot = {
  guild: newGuild(),
  battle: null,
  paused: false,
  loaded: false,
  notice: "왕국의 끝에서, 우리의 이야기가 시작된다.",
  saveStatus: "불러오는 중",
  saveBlocked: false,
};
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;
function emit(patch: Partial<Snapshot>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
function report(e: unknown) {
  emit({
    notice: e instanceof Error ? e.message : "작업을 완료하지 못했습니다.",
  });
}
function scheduleSave() {
  clearTimeout(saveTimer);
  if (state.saveBlocked) return;
  emit({ saveStatus: "저장 대기" });
  saveTimer = setTimeout(() => void save(), 350);
}
function updateGuild(guild: Guild, notice: string) {
  emit({ guild, notice });
  scheduleSave();
}
function unlocked() {
  if (!state.loaded) throw Error("저장 데이터를 불러오는 중입니다.");
  if (state.battle) throw Error("전투를 마치고 본부로 복귀해 주세요.");
}
function action(fn: () => void) {
  try {
    fn();
  } catch (e) {
    report(e);
  }
}
async function save(explicit = false) {
  if (!state.loaded || (state.saveBlocked && !explicit)) return false;
  clearTimeout(saveTimer);
  const guild = state.guild;
  emit({ saveStatus: "저장 중" });
  try {
    await writeSave(guild);
    emit({
      saveStatus: "저장 완료",
      saveBlocked: false,
      ...(explicit ? { notice: "현재 용병단을 저장했습니다." } : {}),
    });
    return true;
  } catch (e) {
    emit({ saveStatus: "저장 실패", saveBlocked: true });
    report(e);
    return false;
  }
}
function resolveBattle(battle: Battle) {
  if (battle.status === "active") {
    emit({ battle });
    return;
  }
  const result = applyReward(state.guild, battle);
  emit({
    ...result,
    paused: false,
    notice:
      battle.status === "victory"
        ? "의뢰 완료! 120골드와 출전자 경험치 55를 획득했습니다."
        : "파티가 철수했습니다. 편성을 보강해 다시 도전해 보세요.",
  });
  scheduleSave();
}
export const store = {
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getSnapshot: () => state,
  async init() {
    try {
      const guild = await readSave();
      emit({
        guild: guild ?? state.guild,
        loaded: true,
        saveStatus: guild ? "저장 불러옴" : "새로운 기록",
      });
      if (!guild) scheduleSave();
    } catch (e) {
      emit({ loaded: true, saveBlocked: true, saveStatus: "불러오기 실패" });
      report(e);
    }
  },
  recruit: (id: string) =>
    action(() => {
      unlocked();
      updateGuild(
        recruit(state.guild, id),
        "새로운 동료가 용병단에 합류했습니다.",
      );
    }),
  toggleParty: (id: string) =>
    action(() => {
      unlocked();
      updateGuild(toggleParty(state.guild, id), "출전 파티를 변경했습니다.");
    }),
  refresh: () =>
    action(() => {
      unlocked();
      const batch = state.guild.recruitBatch + 1;
      updateGuild(
        {
          ...state.guild,
          recruitBatch: batch,
          candidates: candidatesFor(batch),
        },
        "새로운 지원자들이 모집소를 찾았습니다.",
      );
    }),
  start: () =>
    action(() => {
      unlocked();
      emit({
        battle: startBattle(state.guild),
        paused: false,
        notice: "고블린 토벌 시작. 집중 공격으로 동료를 지휘하세요.",
      });
    }),
  tick: () => {
    if (state.battle?.status === "active" && !state.paused && !document.hidden)
      resolveBattle(tickBattle(state.battle));
  },
  focus: () => {
    if (state.battle?.status === "active" && !state.paused)
      resolveBattle(focusAttack(state.battle));
  },
  togglePause: () => {
    if (state.battle?.status === "active") emit({ paused: !state.paused });
  },
  returnHome: () => {
    if (state.battle?.status !== "active")
      emit({ battle: null, paused: false });
  },
  save: () => save(true),
  async load() {
    try {
      unlocked();
      clearTimeout(saveTimer);
      const guild = await readSave();
      if (guild)
        emit({
          guild,
          saveBlocked: false,
          saveStatus: "저장 불러옴",
          notice: "저장된 용병단을 불러왔습니다.",
        });
      else emit({ notice: "저장된 기록이 없습니다." });
    } catch (e) {
      report(e);
    }
  },
  async import(raw: string) {
    try {
      unlocked();
      const guild = decodeSave(raw);
      clearTimeout(saveTimer);
      await writeSave(guild);
      emit({
        guild,
        saveBlocked: false,
        saveStatus: "복원 완료",
        notice: "백업을 복원했습니다.",
      });
    } catch (e) {
      report(e);
    }
  },
  notify: (notice: string) => emit({ notice }),
};
