import { afterEach, expect, it, vi } from "vitest";
vi.mock("../persistence/save", () => ({
  readSave: async () => null,
  writeSave: async () => {},
  decodeSave: vi.fn(),
}));
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("일시정지는 자동 진행을 막고 전술 지휘 및 2배속 재개를 지원한다", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("document", { hidden: false });
  vi.resetModules();
  const { store } = await import("./store");
  await store.init();
  store.start();
  const battle = store.getSnapshot().battle!;
  store.togglePause();
  store.tick();
  expect(store.getSnapshot().paused).toBe(true);
  expect(store.getSnapshot().battle).toBe(battle);
  store.tactic("focus");
  expect(store.getSnapshot().battle!.tactic).toBe("focus");
  expect(store.getSnapshot().battle!.units.map((u) => u.hp)).toEqual(
    battle.units.map((u) => u.hp),
  );
  store.togglePause();
  store.tick();
  expect(store.getSnapshot().battle!.tick).toBe(1);
  store.speed();
  store.tick();
  expect(store.getSnapshot().battle!.tick).toBe(3);
  expect(store.getSnapshot().guild.gold).toBe(240);
});
