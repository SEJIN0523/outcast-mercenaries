import { test, expect } from "@playwright/test";
test("PC: 모집·파티·전투·보상·새로고침 저장 복원", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(page.getByRole("status")).toContainText("왕국");
  await page.getByRole("button", { name: "모집소" }).click();
  await page.locator(".recruit-btn").first().click();
  await expect(page.getByRole("status")).toContainText("합류");
  await page.getByRole("button", { name: "용병 명부" }).click();
  await expect(page.locator(".merc-row")).toHaveCount(3);
  await page
    .locator(".merc-row")
    .last()
    .getByRole("button", { name: "＋ 편성" })
    .click();
  await page.getByRole("button", { name: "용병단 본부" }).click();
  await expect(page.locator(".party-card:not(.empty)")).toHaveCount(3);
  await page.screenshot({
    path: "test-results/headquarters-desktop.png",
    fullPage: true,
  });
  const gold = await page.locator(".gold b").innerText();
  await page.getByRole("button", { name: "출전하기" }).click();
  await page.getByRole("button", { name: /집중 공격 발동/ }).click();
  await expect(
    page.getByRole("heading", { name: "의뢰를 완수했습니다!" }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".gold b")).toHaveText(
    String(Number(gold.replace(/,/g, "")) + 120),
  );
  await page.getByRole("button", { name: "본부로 복귀 →" }).click();
  await expect(page.locator("footer")).toContainText("저장 완료");
  await page.reload();
  await expect(page.locator(".party-card:not(.empty)")).toHaveCount(3);
  await expect(page.locator(".day-tag b")).toContainText("01");
  expect(errors).toEqual([]);
});
test("모바일: 가로 넘침 없이 모집·정보·파티 편성 가능", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator("footer")).toContainText("저장 완료");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/headquarters-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "모집소" }).click();
  await expect(page.locator(".merc-row")).toHaveCount(6);
  await page.locator(".recruit-btn").first().click();
  await expect(page.getByRole("status")).toContainText("합류");
  await page.getByRole("button", { name: "용병 명부" }).click();
  await page
    .locator(".merc-row")
    .last()
    .getByRole("button", { name: "＋ 편성" })
    .click();
  await expect(page.getByRole("status")).toContainText("변경");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("프로덕션 PWA: manifest·아이콘·캐시 후 오프라인 재실행", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect(page.locator("footer")).toContainText("오프라인 준비 완료", {
    timeout: 30000,
  });
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    )!;
    return (await fetch(link.href)).json();
  });
  expect(manifest.display).toBe("standalone");
  expect(manifest.orientation).toBe("landscape");
  expect(new URL(manifest.start_url, page.url()).pathname).toBe(
    new URL(page.url()).pathname,
  );
  expect(manifest.icons).toHaveLength(3);
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /돌아오셨군요/ }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await context.setOffline(false);
});
test("360px·태블릿에서 레이아웃과 메뉴 탐색", async ({ page }) => {
  await page.goto("./");
  for (const width of [360, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ["용병단 본부", "용병 명부", "모집소", "의뢰 게시판"]) {
      await page.getByRole("button", { name, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("휴대폰 가로 터치: 모집·편성·전투와 회전 대응", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  // This context is independent of the test fixture, so use its configured Pages base URL.
  const { baseURL } = test.info().project.use;
  await page.goto(baseURL!);
  await expect(page.locator("footer")).toContainText("저장 완료");
  await page.getByRole("button", { name: "모집소", exact: true }).tap();
  await page.locator(".recruit-btn").first().tap();
  await expect(page.getByRole("status")).toContainText("합류");
  await page.getByRole("button", { name: "용병 명부", exact: true }).tap();
  await page
    .locator(".merc-row")
    .last()
    .getByRole("button", { name: "＋ 편성" })
    .tap();
  await page.getByRole("button", { name: "용병단 본부", exact: true }).tap();
  await page.screenshot({
    path: "test-results/headquarters-landscape.png",
    fullPage: true,
  });
  const nav = await page.locator(".sidebar").boundingBox();
  expect(nav!.width).toBeLessThan(120);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /출전하기/ }).tap();
  await page.getByRole("button", { name: /집중 공격 발동/ }).tap();
  await expect(
    page.getByRole("heading", { name: "의뢰를 완수했습니다!" }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "본부로 복귀 →" }).tap();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".orientation-hint")).toBeVisible();
  await expect(page.locator(".party-card:not(.empty)")).toHaveCount(3);
  await context.close();
});
