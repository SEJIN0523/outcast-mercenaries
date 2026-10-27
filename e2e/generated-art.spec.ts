import { test, expect } from "@playwright/test";

test("생성 PNG가 초기 동료 초상화에 실제 사용되고 랜덤 지원자는 합성을 유지한다", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".storage-status")).toContainText("저장 완료");
  await page
    .getByRole("navigation", { name: "주 메뉴" })
    .getByRole("button", { name: "용병", exact: true })
    .click();
  await expect(
    page.locator('.merc-row img[data-art-source="generated-v1"]'),
  ).toHaveCount(5);
  const hero = page.locator('img[alt="단장 · 전사"]').first();
  const equal = await hero.evaluate(async (img: HTMLImageElement) => {
    const sheet = new Image();
    sheet.src = new URL("art/generated/warrior.png", document.baseURI).href;
    await sheet.decode();
    await img.decode();
    const a = document.createElement("canvas"),
      b = document.createElement("canvas");
    a.width = b.width = 64;
    a.height = b.height = 80;
    const ac = a.getContext("2d")!,
      bc = b.getContext("2d")!;
    ac.drawImage(img, 0, 0);
    bc.drawImage(sheet, 0, 0, 64, 80, 0, 0, 64, 80);
    const x = ac.getImageData(0, 0, 64, 80).data,
      y = bc.getImageData(0, 0, 64, 80).data;
    return x.every((v, i) => v === y[i]);
  });
  expect(equal).toBe(true);
  await page.screenshot({ path: "test-results/generated-portraits.png" });
  await page.getByRole("button", { name: /모집소/ }).click();
  await expect(
    page.locator('.merc-row img[data-art-source="procedural"]'),
  ).toHaveCount(6);
});

test("PNG 로딩 실패 시 기존 도트로 전환하고 게임과 저장을 계속 사용할 수 있다", async ({
  page,
}) => {
  await page.route("**/art/generated/*.png", (route) => route.abort());
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
