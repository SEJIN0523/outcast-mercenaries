import { test, expect } from "@playwright/test";
import legacySave from "./fixtures/v1-save.json" with { type: "json" };

async function navigate(page: import("@playwright/test").Page, name: string) {
  await page
    .getByRole("navigation", { name: "주 메뉴" })
    .getByRole("button", { name, exact: true })
    .click();
}
async function inViewport(
  page: import("@playwright/test").Page,
  selector: string,
) {
  const clipped = await page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.width > 0 &&
          r.height > 0 &&
          (r.left < -0.5 ||
            r.top < -0.5 ||
            r.right > innerWidth + 0.5 ||
            r.bottom > innerHeight + 0.5)
        );
      })
      .map((el) => el.textContent?.trim()),
  );
  expect(clipped).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
}
for (const size of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
]) {
  test.describe(`${size.width}×${size.height} 세로 터치`, () => {
    test.use({ viewport: size, isMobile: true, hasTouch: true });
    test("독립 화면·4인 편성·스크롤 없는 전투·일시정지·저장", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("./");
      await expect(page.locator(".storage-status")).toContainText("저장 완료");
      await expect(page.locator(".screen-content")).toHaveAttribute(
        "data-screen",
        "home",
      );
      await expect(
        page.locator(".merc-list,.party-grid,.quest-detail"),
      ).toHaveCount(0);
      await inViewport(page, ".bottom-nav button");
      await inViewport(page, ".home-shortcuts button");
      expect(
        await page
          .locator(".screen-content")
          .evaluate((el) => el.scrollHeight <= el.clientHeight),
      ).toBe(true);
      await page.screenshot({ path: `test-results/home-${size.width}.png` });
      await navigate(page, "용병");
      await page.getByRole("button", { name: /모집소/ }).click();
      await expect(page.locator(".merc-row")).toHaveCount(6);
      await page.locator(".recruit-button").first().click();
      await page.locator(".recruit-button").first().click();
      await page.getByRole("button", { name: /소속 용병/ }).click();
      await expect(page.locator(".merc-row")).toHaveCount(4);
      await page.locator(".merc-inspect").first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: "장비", exact: true }).click();
      await expect(page.locator(".equipment-list article")).toHaveCount(2);
      await inViewport(page, ".sheet,.sheet-header,.sheet-header button");
      await page.screenshot({
        path: `test-results/equipment-${size.width}.png`,
      });
      await page.getByRole("button", { name: "닫기", exact: true }).click();
      await navigate(page, "편성");
      for (const index of [2, 3])
        await page.locator(".party-toggle").nth(index).click();
      await expect(page.locator(".party-slot.filled")).toHaveCount(4);
      await inViewport(page, ".party-slot,.bottom-nav button");
      await page.screenshot({ path: `test-results/party-${size.width}.png` });
      await navigate(page, "의뢰");
      await expect(
        page.locator(".headquarters-art,.party-grid,.merc-list"),
      ).toHaveCount(0);
      const gold = Number(
        (await page.locator(".gold b").innerText()).replace(/,/g, ""),
      );
      await page.getByRole("button", { name: /출전하기/ }).click();
      await expect(page.getByTestId("battle-screen")).toBeVisible();
      await expect(
        page.locator(".bottom-nav,.app-header,.screen-content"),
      ).toHaveCount(0);
      await page.getByRole("button", { name: "일시정지", exact: true }).click();
      const turn = await page.getByTestId("battle-turn").innerText();
      await expect(
        page.getByRole("button", { name: "집중 공격 발동" }),
      ).toBeDisabled();
      await page.waitForTimeout(1600);
      await expect(page.getByTestId("battle-turn")).toHaveText(turn);
      await expect(page.locator(".enemy-health .unit-card")).toHaveCount(3);
      await expect(page.locator(".ally-health .unit-card")).toHaveCount(4);
      await inViewport(
        page,
        ".battle-header button,.battle-meta,.unit-card,.skill-button,.battlefield",
      );
      expect(
        await page
          .locator(".battle-screen")
          .evaluate((el) => el.scrollHeight <= el.clientHeight),
      ).toBe(true);
      await page.screenshot({ path: `test-results/battle-${size.width}.png` });
      // Address bars and system UI can reduce the usable viewport without rotating.
      await page.setViewportSize({
        width: size.width,
        height: size.height - 160,
      });
      await inViewport(
        page,
        ".battle-header button,.battle-meta,.unit-card,.skill-button,.battlefield",
      );
      expect(
        await page
          .locator(".battle-screen")
          .evaluate((el) => el.scrollHeight <= el.clientHeight),
      ).toBe(true);
      await page.setViewportSize(size);
      await page
        .getByRole("button", { name: "전투 계속", exact: true })
        .click();
      await page.getByRole("button", { name: "집중 공격 발동" }).click();
      await expect(
        page.getByRole("heading", { name: "의뢰를 완수했습니다!" }),
      ).toBeVisible({ timeout: 30000 });
      await inViewport(page, ".battle-result,.battle-result button,.unit-card");
      await page.getByRole("button", { name: "본부로 복귀 →" }).click();
      await expect(page.locator(".gold b")).toHaveText(String(gold + 120));
      await expect(page.locator(".storage-status")).toContainText("저장 완료");
      await page.reload();
      await expect(page.getByTestId("victories")).toHaveText("1");
      await navigate(page, "편성");
      await expect(page.locator(".party-slot.filled")).toHaveCount(4);
      expect(errors).toEqual([]);
    });
  });
}
test("기존 버전 1 세이브의 골드·동료·성장·장비·편성 유지", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator(".storage-status")).toContainText("저장 완료");
  await page.evaluate(async (raw) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("outcast-guild", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("saves", "readwrite");
      tx.objectStore("saves").put(JSON.stringify(raw), "main");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, legacySave);
  await page.reload();
  await expect(page.locator(".gold b")).toHaveText("432");
  await expect(page.getByTestId("victories")).toHaveText("7");
  await navigate(page, "편성");
  await expect(page.locator(".party-slot.filled")).toHaveCount(2);
  await page.getByRole("button", { name: "단장 상세 정보" }).click();
  await expect(page.locator(".class-label")).toContainText("Lv.2");
  await expect(page.locator(".xp-line")).toContainText("15 / 80");
  await page.getByRole("button", { name: "장비", exact: true }).click();
  await expect(page.locator(".equipment-list")).toContainText("낡은 철검");
});
test("PWA portrait 경로·아이콘·캐시 후 오프라인 실행", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect(page.locator(".storage-status")).toContainText(
    "오프라인 준비 완료",
    { timeout: 30000 },
  );
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    )!;
    return (await fetch(link.href)).json();
  });
  expect(manifest.orientation).toBe("portrait");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toHaveLength(3);
  expect(new URL(manifest.start_url, page.url()).pathname).toBe(
    new URL(page.url()).pathname,
  );
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "돌아오셨군요, 단장님." }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await context.setOffline(false);
});
test("PC도 세로 앱 구조와 키보드 팝업 탐색 지원", async ({ page }) => {
  await page.goto("./");
  await navigate(page, "용병");
  await page.locator(".merc-inspect").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await navigate(page, "본부");
  await expect(page.locator(".screen-content")).toHaveAttribute(
    "data-screen",
    "home",
  );
  await page.getByRole("button", { name: "저장 및 설정" }).click();
  await expect(page.getByRole("dialog")).toContainText("기록과 설정");
  await page.getByRole("button", { name: "지금 저장" }).click();
  await expect(page.locator(".settings-status")).toContainText("저장 완료");
});
test("360×640 가용 화면 및 시스템 안전 영역에서도 전투 조작 유지", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("./");
  await expect(page.locator(".storage-status")).toContainText("저장 완료");
  await navigate(page, "용병");
  await page.getByRole("button", { name: /모집소/ }).click();
  await page.locator(".recruit-button").first().click();
  await page.locator(".recruit-button").first().click();
  await navigate(page, "편성");
  for (const index of [2, 3])
    await page.locator(".party-toggle").nth(index).click();
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--safe-top", "24px");
    document.documentElement.style.setProperty("--safe-bottom", "24px");
  });
  await navigate(page, "의뢰");
  await page.getByRole("button", { name: /출전하기/ }).click();
  await page.getByRole("button", { name: "일시정지", exact: true }).click();
  await expect(page.locator(".ally-health .unit-card")).toHaveCount(4);
  await inViewport(
    page,
    ".battle-header button,.battle-meta,.unit-card,.skill-button,.battlefield",
  );
  expect(
    await page
      .locator(".battle-screen")
      .evaluate((el) => el.scrollHeight <= el.clientHeight),
  ).toBe(true);
  await page.screenshot({ path: "test-results/battle-safe-area.png" });
});
