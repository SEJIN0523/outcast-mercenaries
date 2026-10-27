import { test, expect } from "@playwright/test";

test("분리 본체 PNG와 장비 합성이 소속 동료와 랜덤 지원자에 적용된다", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".storage-status")).toContainText("저장 완료");
  await page
    .getByRole("navigation", { name: "주 메뉴" })
    .getByRole("button", { name: "용병", exact: true })
    .click();
  await expect(
    page.locator('.merc-row img[data-art-source="battle-preset"]'),
  ).toHaveCount(5);
  const hero = page.locator('img[alt="단장 · 전사"]').first();
  const equal = await hero.evaluate(async (img: HTMLImageElement) => {
    const sheet = new Image();
    sheet.src = new URL("assets/battle_units/warrior/warrior_m_01.png", document.baseURI).href;
    await sheet.decode();
    await img.decode();
    const a = document.createElement("canvas"),
      b = document.createElement("canvas");
    a.width = b.width = 256;
    a.height = b.height = 320;
    const ac = a.getContext("2d")!,
      bc = b.getContext("2d")!;
    ac.drawImage(img, 0, 0);
    bc.drawImage(sheet, 0, 0);
    const x = ac.getImageData(0, 0, 256, 320).data,
      y = bc.getImageData(0, 0, 256, 320).data;
    return x.every((v, i) => v === y[i]);
  });
  expect(equal).toBe(false); // independent weapon changes the unarmed source
  await page.screenshot({ path: "test-results/generated-portraits.png" });
  await page.getByRole("button", { name: /모집소/ }).click();
  await expect(
    page.locator('.merc-row img[data-art-source="battle-preset"]'),
  ).toHaveCount(6);
});

test("PNG 로딩 실패 시 기존 도트로 전환하고 게임과 저장을 계속 사용할 수 있다", async ({
  page,
}) => {
  await page.route("**/art/generated/*.png", (route) => route.abort());
  await page.route("**/assets/battle_units/**/*.png", (route) => route.abort());
  await page.goto("./");
  await expect(page.locator(".storage-status")).toContainText("저장 완료");
  await page
    .getByRole("navigation", { name: "주 메뉴" })
    .getByRole("button", { name: "용병", exact: true })
    .click();
  await expect(
    page.locator('.merc-row img[data-art-source="procedural"]'),
  ).toHaveCount(5);
  await expect(
    page.locator('.merc-row img[data-art-source="generated-v1"]'),
  ).toHaveCount(0);
});
