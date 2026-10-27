import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { decodeSave, encodeSave, readSave, writeSave } from "./save";
import { newGuild } from "../domain/guild";
describe("세이브 버전과 검증", () => {
  it("모든 생성 정보를 JSON round-trip 한다", () => {
    const guild = newGuild();
    expect(decodeSave(encodeSave(guild))).toEqual(guild);
  });
  it("손상 JSON·미래 버전·범위 밖 능력치를 거부한다", () => {
    expect(() => decodeSave("{")).toThrow();
    const data = JSON.parse(encodeSave(newGuild()));
    data.version = 9;
    expect(() => decodeSave(data)).toThrow("버전");
    data.version = 1;
    data.state.gold = -1;
    expect(() => decodeSave(data)).toThrow("형식");
  });
  it("없는 용병 참조, 중복 파티와 용병 ID를 거부한다", () => {
    const g = newGuild();
    expect(() => decodeSave(encodeSave({ ...g, party: ["missing"] }))).toThrow(
      "참조",
    );
    expect(() =>
      decodeSave(encodeSave({ ...g, party: ["hero", "hero"] })),
    ).toThrow("참조");
    expect(() =>
      decodeSave(encodeSave({ ...g, candidates: [g.roster[0]] })),
    ).toThrow("참조");
  });
  it("알 수 없는 장비와 경험치 임계값을 거부한다", () => {
    const g = newGuild();
    g.roster[0].equipment.weapon = "invalid";
    expect(() => decodeSave(encodeSave(g))).toThrow();
    g.roster[0].equipment.weapon = "sword";
    g.roster[0].xp = 40;
    expect(() => decodeSave(encodeSave(g))).toThrow("성장");
  });
  it("IndexedDB 읽기·쓰기 및 연속 쓰기 순서를 보장한다", async () => {
    const g = newGuild();
    expect(await readSave()).toBeNull();
    await Promise.all([
      writeSave(g),
      writeSave({ ...g, gold: 777 }),
      writeSave({ ...g, gold: 888 }),
    ]);
    expect((await readSave())?.gold).toBe(888);
  });
});
