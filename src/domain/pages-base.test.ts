import { describe, expect, it } from "vitest";
import { resolvePagesBase } from "../../scripts/pages-base";

describe("GitHub Pages base 경로", () => {
  it("로컬 및 사용자 사이트는 루트 경로", () => {
    expect(resolvePagesBase()).toBe("/");
    expect(resolvePagesBase("SEJIN0523/sejin0523.github.io")).toBe("/");
  });
  it("프로젝트 저장소 경로와 이름 변경을 반영한다", () => {
    expect(resolvePagesBase("SEJIN0523/outcast-mercenaries")).toBe(
      "/outcast-mercenaries/",
    );
    expect(resolvePagesBase("SEJIN0523/another-game")).toBe("/another-game/");
  });
  it("configure-pages 경로를 우선하고 커스텀 도메인 루트를 지원한다", () => {
    expect(resolvePagesBase("SEJIN0523/game", "")).toBe("/");
    expect(resolvePagesBase("SEJIN0523/game", "/game")).toBe("/game/");
    expect(resolvePagesBase(undefined, "game/")).toBe("/game/");
  });
  it("잘못된 저장소 형식과 외부 URL/경로 탈출을 거부한다", () => {
    expect(() => resolvePagesBase("missing-owner")).toThrow();
    expect(() => resolvePagesBase(undefined, "https://example.com")).toThrow();
    expect(() => resolvePagesBase(undefined, "../other")).toThrow();
  });
});
