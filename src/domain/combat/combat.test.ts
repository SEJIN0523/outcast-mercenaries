import { describe, expect, it } from "vitest";
import { newGuild, combatParty, toggleParty } from "../guild";
import { createMercenary } from "../characters";
import { CLASSES } from "../../data/catalog";
import { COMBAT_PROFILES, FIELD } from "../../data/combat";
import {
  startBattle,
  stepBattle,
  advanceBattle,
  changeTactic,
  requestEscape,
  applyReward,
  separateUnits,
} from "./simulation";
import { chooseAutoSkill, decideIntent, selectTarget, distance } from "./ai";
import type { CombatBattle, CombatUnit } from "./types";
import type { ClassId } from "../types";

function unit(
  job: ClassId,
  id: string,
  side: "party" | "enemy" = "party",
): CombatUnit {
  const g = newGuild(),
    m = {
      ...createMercenary(id),
      id,
      classId: job,
      equipment: { weapon: CLASSES[job].weapon, armor: "cloth" },
    };
  g.roster = [m];
  g.party = [id];
  const u = startBattle(g).units[0];
  return {
    ...u,
    side,
    x: 100,
    y: 200,
    home: { x: 100, y: 200 },
    attackCooldown: 0,
  };
}
function battle(...units: CombatUnit[]): CombatBattle {
  return {
    ...startBattle(newGuild()),
    units,
    participants: units.filter((u) => u.side === "party").map((u) => u.id),
  };
}
function finish(input: CombatBattle) {
  let b = input;
  for (let i = 0; i < 3600 && b.status === "active"; i++) b = stepBattle(b);
  return b;
}
describe("실시간 전투와 단장", () => {
  it("신규 전투는 전투원 4명 대 고블린 5명이며 단장은 전장에 없다", () => {
    const g = newGuild(),
      b = startBattle(g);
    expect(b.units.filter((u) => u.side === "party")).toHaveLength(4);
    expect(b.units.filter((u) => u.side === "enemy")).toHaveLength(5);
    expect(b.units.some((u) => u.id === "hero")).toBe(false);
    expect(g.roster.some((m) => m.story === "hero")).toBe(true);
  });
  it("기존 편성에서 단장을 전투 계산에만 제외하고 저장 원본을 바꾸지 않는다", () => {
    const g = newGuild();
    g.party = ["hero", "ria"];
    expect(combatParty(g).map((m) => m.id)).toEqual(["ria"]);
    expect(startBattle(g).participants).toEqual(["ria"]);
    expect(g.party).toEqual(["hero", "ria"]);
    expect(() => toggleParty(g, "hero")).toThrow("단장");
    expect(toggleParty(g, "kael").party).toEqual(["ria", "kael"]);
  });
  it("단장만 편성한 기존 기록은 출전을 막는다", () => {
    const g = newGuild();
    g.party = ["hero"];
    expect(() => startBattle(g)).toThrow("단장 외");
  });
  it("기본 4인 파티가 승리하며 120G/전투원55XP를 한 번 지급한다", () => {
    const g = newGuild(),
      b = finish(startBattle(g));
    expect(b.status).toBe("victory");
    expect(b.elapsed).toBeLessThan(120);
    const result = applyReward(g, b);
    expect(result.guild.gold).toBe(360);
    expect(result.guild.roster.find((m) => m.id === "hero")!.xp).toBe(0);
    expect(result.guild.roster.find((m) => m.id === "ria")!.level).toBe(2);
    expect(applyReward(result.guild, result.battle).guild).toEqual(
      result.guild,
    );
  });
  it("동일 입력은 결정적이며 2배속 두 스텝은 같은 시간의 1배속과 일치한다", () => {
    const b = startBattle(newGuild());
    expect(advanceBattle(b, 0.1)).toEqual(stepBattle(stepBattle(b)));
    expect(finish(b)).toEqual(finish(b));
    expect(b.tick).toBe(0);
    expect(b.units[0].y).toBe(285);
  });
  it("잘못된 시간 간격을 거부하고 종료 후에는 더 진행하지 않는다", () => {
    const b = startBattle(newGuild());
    expect(() => stepBattle(b, 0.2)).toThrow();
    expect(() => advanceBattle(b, NaN)).toThrow();
    const done = { ...b, status: "defeat" as const };
    expect(stepBattle(done)).toBe(done);
  });
});
describe("이동·목표·사거리·위험", () => {
  it("근접 유닛은 적에게 접근하고 사거리 밖에서는 피해를 주지 않는다", () => {
    const a = unit("warrior", "a"),
      e = {
        ...unit("warrior", "e", "enemy"),
        y: 70,
        home: { x: 100, y: 70 },
        attackCooldown: 10,
      };
    const b = stepBattle(changeTactic(battle(a, e), "charge"));
    expect(b.units[0].y).toBeLessThan(a.y);
    expect(b.units[1].hp).toBe(e.hp);
  });
  it("원거리는 투사체를 발사하고 실제 도착 후 피해가 발생한다", () => {
    const a = unit("archer", "a"),
      e = {
        ...unit("warrior", "e", "enemy"),
        y: 100,
        attackCooldown: 10,
        moveSpeed: 0,
        skillIds: [],
      };
    let b = stepBattle(battle(a, e));
    expect(b.projectiles).toHaveLength(1);
    expect(b.units[1].hp).toBe(e.hp);
    b = advanceBattle(b, 0.5);
    expect(b.units[1].hp).toBeLessThan(e.hp);
  });
  it("궁수는 가까운 적으로부터 사거리를 벌린다", () => {
    const a = unit("archer", "a"),
      e = { ...unit("warrior", "e", "enemy"), y: 175, threat: 1 };
    const intent = decideIntent(a, battle(a, e));
    expect(intent.kind).toBe("move");
    if (intent.kind === "move") expect(intent.point.y).toBeGreaterThan(a.y);
  });
  it("죽은 목표는 버리고 다른 생존 적을 선택한다", () => {
    const a = unit("warrior", "a"),
      dead = { ...unit("warrior", "dead", "enemy"), hp: 0 },
      other = { ...unit("mage", "other", "enemy"), x: 220 };
    expect(
      selectTarget({ ...a, targetId: "dead" }, battle(a, dead, other))?.id,
    ).toBe("other");
  });
  it("죽은/이탈 유닛은 행동하지 않고 전장 경계와 분리를 유지한다", () => {
    const a = unit("warrior", "a"),
      e = unit("warrior", "e", "enemy");
    const units = [a, e];
    separateUnits(units);
    expect(distance(units[0], units[1])).toBeGreaterThanOrEqual(20);
    const dead = { ...a, hp: 0 };
    expect(decideIntent(dead, battle(dead, e)).kind).toBe("idle");
    let b = startBattle(newGuild());
    for (let i = 0; i < 400 && b.status === "active"; i++) b = stepBattle(b);
    expect(
      b.units.every(
        (u) =>
          u.x >= 14 &&
          u.x <= FIELD.width - 14 &&
          u.y >= 18 &&
          u.y <= FIELD.height - 12,
      ),
    ).toBe(true);
  });
});
describe("스킬 데이터 조건과 자동 발동", () => {
  it("치유는 HP50% 이하에 발동하고 범위와 쿨다운을 지킨다", () => {
    const healer = unit("priest", "h"),
      a = { ...unit("warrior", "a"), x: 120, hp: 50, maxHp: 100 },
      e = { ...unit("warrior", "e", "enemy"), y: 20 };
    expect(
      chooseAutoSkill(healer, battle(healer, { ...a, hp: 51 }, e)),
    ).toBeUndefined();
    expect(chooseAutoSkill(healer, battle(healer, a, e))).toMatchObject({
      skillId: "heal",
      targetId: "a",
    });
    const b = stepBattle(battle(healer, a, e));
    expect(b.units[1].hp).toBeGreaterThan(50);
    expect(b.units[0].skillCooldowns.heal).toBe(4);
    expect(
      chooseAutoSkill(
        { ...healer, skillCooldowns: { heal: 1 } },
        battle(healer, a, e),
      ),
    ).toBeUndefined();
    expect(
      chooseAutoSkill(healer, battle(healer, { ...a, x: 350, y: 400 }, e)),
    ).toBeUndefined();
  });
  it("광역 공격은 적3명 군집에서만 발동한다", () => {
    const m = unit("mage", "m"),
      enemies = [0, 1, 2].map((i) => ({
        ...unit("warrior", `e${i}`, "enemy"),
        x: 95 + i * 16,
        y: 110,
        attackCooldown: 10,
      }));
    expect(
      chooseAutoSkill(m, battle(m, ...enemies.slice(0, 2))),
    ).toBeUndefined();
    const b = stepBattle(battle(m, ...enemies));
    expect(b.events.some((e) => e.label === "화염 폭발")).toBe(true);
    expect(b.units.slice(1).every((u, i) => u.hp < enemies[i].hp)).toBe(true);
  });
  it("수호자는 여러 근접 위협에 방벽을 사용한다", () => {
    const g = unit("guardian", "g"),
      e1 = {
        ...unit("warrior", "e1", "enemy"),
        x: 130,
        attackCooldown: 10,
        skillIds: [],
      },
      e2 = {
        ...unit("warrior", "e2", "enemy"),
        x: 75,
        attackCooldown: 10,
        skillIds: [],
      };
    expect(chooseAutoSkill(g, battle(g, e1))).toBeUndefined();
    expect(chooseAutoSkill(g, battle(g, e1, e2))).toMatchObject({
      skillId: "shield",
    });
    expect(stepBattle(battle(g, e1, e2)).units[0].shield).toBeGreaterThan(0);
  });
  it("강력한 단일 공격은 보스/고위협 적을 우선한다", () => {
    const a = unit("archer", "a"),
      near = { ...unit("warrior", "near", "enemy"), y: 150, threat: 1 },
      boss = {
        ...unit("warrior", "boss", "enemy"),
        x: 150,
        y: 110,
        boss: true,
        threat: 4,
      };
    expect(chooseAutoSkill(a, battle(a, near, boss))).toMatchObject({
      skillId: "aimed",
      targetId: "boss",
    });
  });
  it("8개 기본 직업에 전투 역할과 자동 스킬이 정의되어 있다", () => {
    expect(Object.keys(COMBAT_PROFILES)).toHaveLength(8);
    expect(
      Object.values(COMBAT_PROFILES).every((p) => p.skills.length > 0),
    ).toBe(true);
  });
});
describe("전술의 실제 행동 차이", () => {
  it("돌격은 긴 추격, 진형 유지는 홈에서 대기한다", () => {
    const a = unit("warrior", "a"),
      e = { ...unit("warrior", "e", "enemy"), y: 50 };
    expect(decideIntent(a, changeTactic(battle(a, e), "charge")).kind).toBe(
      "move",
    );
    expect(decideIntent(a, changeTactic(battle(a, e), "hold")).kind).toBe(
      "idle",
    );
  });
  it("진형에서 이탈하면 공격 추격 대신 복귀한다", () => {
    const a = { ...unit("warrior", "a"), y: 140 },
      e = { ...unit("warrior", "e", "enemy"), y: 100 };
    const plan = decideIntent(a, changeTactic(battle(a, e), "hold"));
    expect(plan.kind).toBe("move");
    if (plan.kind === "move") expect(plan.point).toEqual(a.home);
  });
  it("후위 보호는 가까운 적보다 지원자를 위협하는 적을 선택한다", () => {
    const a = unit("guardian", "a"),
      h = { ...unit("priest", "h"), x: 250, y: 330 },
      near = { ...unit("warrior", "near", "enemy"), y: 175, threat: 1 },
      threat = {
        ...unit("warrior", "threat", "enemy"),
        x: 250,
        y: 300,
        targetId: "h",
        threat: 1,
      };
    expect(selectTarget(a, battle(a, h, near, threat))?.id).toBe("near");
    expect(
      selectTarget(a, changeTactic(battle(a, h, near, threat), "protect"))?.id,
    ).toBe("threat");
  });
  it("집중 공격은 모든 전투원의 공통 목표를 바꾸며 능력치는 바꾸지 않는다", () => {
    const b = startBattle(newGuild()),
      focused = changeTactic(b, "focus");
    expect(focused.focusId).toBe("goblin-4");
    expect(
      focused.units
        .filter((u) => u.side === "party")
        .every((u) => selectTarget(u, focused)?.id === "goblin-4"),
    ).toBe(true);
    expect(focused.units.map((u) => [u.attack, u.defense])).toEqual(
      b.units.map((u) => [u.attack, u.defense]),
    );
  });
  it("전술적 후퇴는 후방 진형으로 이동하지만 도주 상태가 아니다", () => {
    const a = unit("warrior", "a"),
      e = { ...unit("warrior", "e", "enemy"), y: 175 };
    const b = changeTactic(battle(a, e), "retreat"),
      plan = decideIntent(a, b);
    expect(plan.kind).toBe("move");
    if (plan.kind === "move") expect(plan.point.y).toBeGreaterThan(a.home.y);
    expect(b.escaping).toBe(false);
  });
});
describe("도주와 결과", () => {
  it("도주 중에는 공격 대신 탈출지점으로 이동하며 보상이 없다", () => {
    const g = newGuild(),
      b = requestEscape(startBattle(g));
    expect(decideIntent(b.units[0], b).kind).toBe("move");
    const done = finish(b);
    expect(done.status).toBe("escaped");
    expect(done.units.some((u) => u.escaped)).toBe(true);
    expect(applyReward(g, done).guild).toEqual(g);
    expect(changeTactic(b, "charge")).toBe(b);
  });
  it("도주 중 적은 계속 공격하며 이탈한 유닛은 표적이 되지 않는다", () => {
    const a = { ...unit("warrior", "a"), y: 390 },
      e = { ...unit("warrior", "e", "enemy"), y: 368, skillIds: [] };
    const b = stepBattle(requestEscape(battle(a, e)));
    expect(b.units[0].hp).toBeLessThan(a.hp);
    const escaped = { ...a, escaped: true };
    expect(selectTarget(e, battle(escaped, e))).toBeUndefined();
  });
  it("전멸은 패배이며 경험치/골드를 주지 않는다", () => {
    const g = newGuild();
    const b = startBattle(g);
    b.units = b.units.map((u) => (u.side === "party" ? { ...u, hp: 0 } : u));
    const done = stepBattle(b);
    expect(done.status).toBe("defeat");
    expect(applyReward(g, done).guild).toEqual(g);
  });
});
