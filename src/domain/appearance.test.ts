import { describe, it, expect } from "vitest";
import {
  generateCosmetics,
  resolveCosmetics,
  appearanceSignature,
} from "./appearance";
import { generateMercenary, statsOf } from "./characters";
import { CLASSES } from "../data/catalog";
import { EYE_COLORS, OUTFIT_COLORS } from "../data/appearance";
import { decodeSave, encodeSave } from "../persistence/save";
import { newGuild } from "./guild";

describe("랜덤 공용 에셋 베리에이션", () => {
  it("시드별 외형이 재현되고 모든 색·복장·무기 옵션이 생성된다", () => {
    expect(generateCosmetics("same", "archer")).toEqual(
      generateCosmetics("same", "archer"),
    );
    const choices = Array.from({ length: 300 }, (_, i) =>
      generateCosmetics(`variant-${i}`, "archer"),
    );
    expect(new Set(choices.map((v) => v.eyeColor)).size).toBe(
      EYE_COLORS.length,
    );
    expect(new Set(choices.map((v) => v.outfitColor)).size).toBe(
      OUTFIT_COLORS.archer.length,
    );
    expect(new Set(choices.map((v) => v.outfitStyle)).size).toBe(3);
    expect(new Set(choices.map((v) => v.weaponStyle)).size).toBe(3);
    for (const classId of Object.keys(CLASSES) as (keyof typeof CLASSES)[]) {
      const m = generateMercenary(`class-${classId}`);
      const v = generateCosmetics(m.appearanceSeed, classId);
      expect(OUTFIT_COLORS[classId]).toContain(v.outfitColor);
    }
  });
  it("베리에이션이 장비 종류·능력치·캐릭터 정체성을 바꾸지 않는다", () => {
    const m = generateMercenary("visual-only"),
      changed = {
        ...m,
        appearance: {
          ...m.appearance,
          eyeColor: "#abcdef",
          outfitColor: "#123456",
          outfitStyle: 2,
          weaponStyle: 2,
        },
      };
    expect(statsOf(changed)).toEqual(statsOf(m));
    expect(changed.equipment).toEqual(m.equipment);
    expect(appearanceSignature(changed)).not.toBe(appearanceSignature(m));
    expect(appearanceSignature({ ...m, level: 8, xp: 0 })).toBe(
      appearanceSignature(m),
    );
  });
  it("새 외형 필드가 version1 저장 후에도 정확히 유지된다", () => {
    const g = newGuild();
    g.roster[0] = generateMercenary("persist-variants");
    g.party[0] = g.roster[0].id;
    const restored = decodeSave(encodeSave(g));
    expect(restored).toEqual(g);
    expect(
      resolveCosmetics(
        restored.roster[0].appearance,
        restored.roster[0].classId,
      ),
    ).toEqual(generateCosmetics("persist-variants", g.roster[0].classId));
  });
  it("구 저장의 누락 항목은 예전 외형으로 표시하며 원본은 바꾸지 않는다", () => {
    const g = newGuild();
    for (const m of [...g.roster, ...g.candidates]) {
      delete m.appearance.eyeColor;
      delete m.appearance.outfitColor;
      delete m.appearance.outfitStyle;
      delete m.appearance.weaponStyle;
    }
    const before = structuredClone(g),
      restored = decodeSave(encodeSave(g));
    expect(restored).toEqual(before);
    const m = restored.roster[0];
    expect(resolveCosmetics(m.appearance, m.classId)).toEqual({
      eyeColor: "#7893a0",
      outfitColor: CLASSES[m.classId].color,
      outfitStyle: 0,
      weaponStyle: 0,
    });
    expect(g).toEqual(before);
  });
  it("잘못된 색·베리에이션 번호는 저장에서 거부한다", () => {
    for (const bad of [
      { eyeColor: "red" },
      { outfitColor: "#123" },
      { outfitStyle: 3 },
      { weaponStyle: -1 },
    ]) {
      const g = newGuild();
      Object.assign(g.roster[0].appearance, bad);
      expect(() => decodeSave(encodeSave(g))).toThrow("형식");
    }
  });
});
