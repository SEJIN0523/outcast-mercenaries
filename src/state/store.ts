import {setFormationRow,placeCharacter,formationPreset,saveFormation,loadFormation} from "../domain/combat/formation";
import type {FormationMode} from "../domain/combat/formation";
import {equipWeapon,equipShield} from "../domain/equipment";
import {selectPreset} from "../domain/battlePresets";
import { newGuild, recruit, toggleParty, candidatesFor,combatParty } from "../domain/guild";
import {
  applyReward,
  startBattle,
  advanceBattle,
  changeTactic,
  changePriority,
  requestEscape,
} from "../domain/battle";
import { decodeSave, readSave, writeSave } from "../persistence/save";
import type { Guild,SlotId,Race } from "../domain/types";
import type { CombatBattle as Battle, TacticId } from "../domain/combat/types";
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
        : battle.status === "escaped"
          ? "도주했습니다. 보상 없이 본부로 복귀할 수 있습니다."
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
          candidates: candidatesFor(batch,state.guild),
          recentPresetIds:[...(state.guild.recentPresetIds??[]),...state.guild.candidates.map(m=>m.battlePresetId??'')].filter(Boolean).slice(-32),
        },
        "새로운 지원자들이 모집소를 찾았습니다.",
      );
    }),
  setRow:(id:string,row:"front"|"rear")=>action(()=>{unlocked();updateGuild(setFormationRow(state.guild,id,row),"전열·후열 배치를 변경했습니다.");}),
  place:(slot:SlotId,id:string)=>action(()=>{unlocked();updateGuild(placeCharacter(state.guild,slot,id),"진형 배치를 저장했습니다.");}),
  formation:(mode:FormationMode)=>action(()=>{unlocked();updateGuild({...state.guild,formation:formationPreset(state.guild,mode)},"진형 프리셋을 적용했습니다.");}),
  saveFormation:(name:string)=>action(()=>{unlocked();updateGuild(saveFormation(state.guild,name),"현재 진형을 저장했습니다.");}),
  loadFormation:(id:string)=>action(()=>{unlocked();updateGuild(loadFormation(state.guild,id),"저장한 진형을 불러왔습니다.");}),
  equip:(id:string,slot:'weapon'|'shield',item:string)=>action(()=>{unlocked();const m=state.guild.roster.find(m=>m.id===id);if(!m)throw Error('소속 용병만 장비를 변경할 수 있습니다.');const changed=slot==='weapon'?equipWeapon(m,item):equipShield(m,item||undefined);updateGuild({...state.guild,roster:state.guild.roster.map(m=>m.id===id?changed:m)},"장비를 변경했습니다.");}),
  race:(id:string,race:Race)=>action(()=>{unlocked();updateGuild({...state.guild,roster:state.guild.roster.map(m=>m.id===id?{...m,race}:m)},"종족 외형을 저장했습니다. 능력치는 그대로입니다.");}),
  setPreset:(id:string,presetId:string)=>action(()=>{unlocked();const m=state.guild.roster.find(m=>m.id===id);if(!m)throw Error("소속 용병만 변경할 수 있습니다.");const changed=selectPreset(m,presetId);updateGuild({...state.guild,roster:state.guild.roster.map(m=>m.id===id?changed:m)},"전투 프리셋을 저장했습니다.");}),
  start: (count?:1|2|5) =>
    action(() => {
      unlocked();
      emit({
        battle: count?startBattle({...state.guild,party:combatParty(state.guild).slice(0,count).map(m=>m.id),formation:undefined},{enemyCount:count}):startBattle(state.guild),
        paused: false,
        notice:
          "주인공과 동료의 자율전투 시작. 전술·우선순위·도주를 지휘하세요.",
      });
    }),
  tick: () => {
    if (state.battle?.status === "active" && !state.paused && !document.hidden)
      resolveBattle(advanceBattle(state.battle, 0.05 * state.battle.speed));
  },
  tactic: (tactic: TacticId) => {
    if (state.battle) emit({ battle: changeTactic(state.battle, tactic) });
  },
  priority: () => {
    if (state.battle) {
      const ids = ["threat", "nearest", "weakest"] as const;
      const next = ids[(ids.indexOf(state.battle.priority) + 1) % ids.length];
      emit({ battle: changePriority(state.battle, next) });
    }
  },
  escape: () => {
    if (state.battle) emit({ battle: requestEscape(state.battle) });
  },
  speed: () => {
    if (state.battle?.status === "active")
      emit({
        battle: { ...state.battle, speed: state.battle.speed === 1 ? 2 : 1 },
      });
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
