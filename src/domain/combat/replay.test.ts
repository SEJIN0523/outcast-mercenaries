import { expect, it } from "vitest";
import { newGuild } from "../guild";
import { startBattle, stepBattle } from "../battle";

it("일반 전투 리플레이는 구조 변경 전의 이동·피해·스킬·종료 결과를 보존한다", () => {
  let battle = startBattle(newGuild());
  const marks: unknown[] = [];
  for (let i = 0; i < 3600 && battle.status === "active"; i++) {
    battle = stepBattle(battle);
    if ([20, 60, 120].includes(battle.tick) || battle.status !== "active")
      marks.push({
        tick: battle.tick,
        time: battle.elapsed,
        status: battle.status,
        units: battle.units.map((u) => ({
          id: u.id,
          x: +u.x.toFixed(4),
          y: +u.y.toFixed(4),
          hp: u.hp,
          shield: u.shield,
          target: u.targetId,
          action: u.action,
          cooldowns: u.skillCooldowns,
        })),
        logs: battle.logs,
        projectiles: battle.projectiles.map((p) => ({
          source: p.sourceId,
          target: p.targetId,
          damage: p.damage,
        })),
      });
  }
  expect(marks).toMatchSnapshot();
});
