import { expect, it } from "vitest";
import { newGuild } from "../guild";
import { statsOf } from "../characters";
import { createCombatant } from "./units";
import { startBattle } from "./normalBattle";
import { getBattleOrders, changeTactic } from "./commands";
import { decideIntent } from "./ai";

it("독립된 명령 스냅샷을 AI에 전달해도 공유 전장이나 다른 유닛 명령을 바꾸지 않는다", () => {
  const b = startBattle(newGuild()),
    unit = b.units[0];
  const charge = getBattleOrders(changeTactic(b, "charge")),
    hold = getBattleOrders(changeTactic(b, "hold"));
  expect(decideIntent(unit, b, charge).kind).toBe("move");
  expect(decideIntent(unit, b, hold).kind).toBe("idle");
  expect(b.tactic).toBe("balanced");
  charge.priority = "weakest";
  expect(b.priority).toBe("threat");
  expect(hold.priority).toBe("threat");
});
it("같은 캐릭터 성장·장비를 공통 유닛 생성에 재사용해도 전투 상태는 서로 격리된다", () => {
  const hero = newGuild().roster[0],
    before = structuredClone(hero);
  const first = createCombatant(hero, 0, { x: 100, y: 285 }),
    second = createCombatant(hero, 1, { x: 240, y: 285 });
  expect(first.maxHp).toBe(statsOf(hero).hp);
  expect(second.attack).toBe(statsOf(hero).attack);
  expect(first.skillIds).toEqual([]);
  first.hp = 1;
  first.home.x = 0;
  first.skillCooldowns.example = 2;
  expect(second.hp).toBe(statsOf(hero).hp);
  expect(second.home.x).toBe(240);
  expect(second.skillCooldowns).toEqual({});
  expect(hero).toEqual(before);
  const grown = {
    ...hero,
    level: 3,
    equipment: { weapon: "spear", armor: "cloth" },
  };
  expect(createCombatant(grown, 0, { x: 100, y: 285 }).attack).toBe(
    statsOf(grown).attack,
  );
});
