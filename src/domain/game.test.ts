import { describe, expect, it } from "vitest";
import { createMercenary, gainXp, recruitCost, statsOf } from "./characters";
import { newGuild, recruit, toggleParty, candidatesFor } from "./legacy/guild";
import {
  applyReward,
  focusAttack,
  startBattle,
  tickBattle,
} from "./legacy/battle";
import { CLASSES } from "../data/catalog";
describe("용병 생성과 성장", () => {
  it("같은 시드는 외형과 전체 인물을 재현한다", () => {
    expect(createMercenary("test")).toEqual(createMercenary("test"));
    expect(createMercenary("test")).not.toEqual(createMercenary("other"));
  });
  it("여러 시드에서 남녀·7종족·8직업 모두 생성된다", () => {
    const roster = Array.from({ length: 400 }, (_, i) =>
      createMercenary(`seed-${i}`),
    );
    expect(new Set(roster.map((m) => m.gender)).size).toBe(2);
    expect(new Set(roster.map((m) => m.race)).size).toBe(7);
    expect(new Set(roster.map((m) => m.classId)).size).toBe(8);
  });
  it("큰 경험치 보상으로 여러 레벨이 오르며 능력치가 성장한다", () => {
    const m = createMercenary("xp");
    const grown = gainXp(m, 250);
    expect(grown.level).toBe(4);
    expect(grown.xp).toBe(10);
    expect(statsOf(grown).attack).toBeGreaterThan(statsOf(m).attack);
  });
  it("레벨 상한에서 경험치를 넘기지 않는다", () => {
    expect(
      gainXp({ ...createMercenary("max"), level: 49 }, 10000),
    ).toMatchObject({ level: 50, xp: 0 });
  });
  it("직업별 기본 무기와 서로 다른 능력치를 갖는다", () => {
    expect(
      new Set(Object.values(CLASSES).map((c) => c.stats.hp)).size,
    ).toBeGreaterThan(4);
  });
});
describe("모집과 파티", () => {
  it("모집비를 정확히 차감하고 동일 후보를 두 번 모집하지 않는다", () => {
    const g = newGuild();
    const m = g.candidates[0];
    const next = recruit(g, m.id);
    expect(next.gold).toBe(g.gold - recruitCost(m));
    expect(next.roster).toHaveLength(3);
    expect(next.candidates).toHaveLength(5);
    expect(() => recruit(next, m.id)).toThrow();
    expect(g.roster).toHaveLength(2);
  });
  it("잔액과 정원 제한을 지킨다", () => {
    const g = newGuild();
    expect(() => recruit({ ...g, gold: 0 }, g.candidates[0].id)).toThrow(
      "골드",
    );
    expect(() =>
      recruit(
        {
          ...g,
          roster: Array.from({ length: 24 }, (_, i) =>
            createMercenary(`full${i}`),
          ),
        },
        g.candidates[0].id,
      ),
    ).toThrow("24");
  });
  it("보존된 legacy 파티의 최소 1명·최대 4명·소속 제한을 지킨다", () => {
    let g = newGuild();
    g = toggleParty(g, "ria");
    expect(() => toggleParty(g, "hero")).toThrow("최소");
    expect(() => toggleParty(g, "unknown")).toThrow("소속");
    g = { ...g, roster: [...g.roster, ...candidatesFor(4)] };
    for (const m of g.roster.slice(2, 5)) g = toggleParty(g, m.id);
    expect(() => toggleParty(g, g.roster[5].id)).toThrow("4명");
  });
  it("새 batch는 기존 후보와 다른 ID를 사용한다", () => {
    expect(
      candidatesFor(0).some((a) => candidatesFor(1).some((b) => a.id === b.id)),
    ).toBe(false);
  });
});
describe("자동전투와 보상", () => {
  it("기본 파티로 승리하고 한 번만 골드/경험치를 지급한다", () => {
    const g = newGuild();
    let b = startBattle(g);
    let steps = 0;
    while (b.status === "active" && steps++ < 100) b = tickBattle(b);
    expect(b.status).toBe("victory");
    const result = applyReward(g, b);
    expect(result.guild.gold).toBe(g.gold + 120);
    expect(result.guild.roster[0]).toMatchObject({ level: 2, xp: 15 });
    expect(applyReward(result.guild, result.battle).guild).toEqual(
      result.guild,
    );
    expect(g.gold).toBe(240);
  });
  it("집중 공격 피해와 쿨다운을 적용하고 중복 발동을 막는다", () => {
    const b = startBattle(newGuild());
    const focused = focusAttack(b);
    expect(focused.cooldown).toBe(5);
    expect(focused.units.find((u) => u.side === "enemy")!.hp).toBeLessThan(
      b.units.find((u) => u.side === "enemy")!.hp,
    );
    expect(focusAttack(focused)).toBe(focused);
    expect(tickBattle(focused).cooldown).toBe(4);
  });
  it("약한 파티 패배 시 보상을 지급하지 않는다", () => {
    const g = newGuild();
    let b = startBattle(g);
    b = {
      ...b,
      units: b.units.map((u) =>
        u.side === "party" ? { ...u, hp: 1, attack: 1 } : u,
      ),
    };
    while (b.status === "active") b = tickBattle(b);
    expect(b.status).toBe("defeat");
    expect(applyReward(g, b).guild).toEqual(g);
    expect(tickBattle(b)).toBe(b);
  });
  it("사제는 부상 아군을 치유한다", () => {
    const g = newGuild();
    g.roster[0] = { ...g.roster[0], classId: "priest" };
    const b = startBattle(g);
    b.units[1].hp = 10;
    expect(tickBattle(b).logs.some((s) => s.includes("치유"))).toBe(true);
  });
  it("출전하지 않은 용병은 경험치를 받지 않는다", () => {
    const g = newGuild();
    g.roster.push(createMercenary("bench"));
    let b = startBattle(g);
    while (b.status === "active") b = tickBattle(b);
    expect(applyReward(g, b).guild.roster[2].xp).toBe(0);
  });
});
