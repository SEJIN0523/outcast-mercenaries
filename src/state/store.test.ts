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
it("일시정지는 자동 진행과 수동 공격을 막고 재개 후 계속한다", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("document", { hidden: false });
  vi.resetModules();
  const { store } = await import("./store");
  await store.init();
  store.start();
  const battle = store.getSnapshot().battle!;
  store.togglePause();
  store.tick();
  store.focus();
  expect(store.getSnapshot().paused).toBe(true);
  expect(store.getSnapshot().battle).toBe(battle);
  store.togglePause();
  store.tick();
  expect(store.getSnapshot().battle!.tick).toBe(1);
  expect(store.getSnapshot().guild.gold).toBe(240);
});
