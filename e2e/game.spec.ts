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
const controls =
  ".battle-header button,.battle-meta,.rt-health,.tactic-grid button,.battle-utility button,.battlefield";
for (const size of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
])
  test.describe(`${size.width}×${size.height} 실시간 자율전투`, () => {
    test.use({ viewport: size, isMobile: true, hasTouch: true });
    test("4대5 이동·전술·자동 스킬·2배속·보상·저장", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("./");
      await expect(page.locator(".storage-status")).toContainText("저장 완료");
      await inViewport(page, ".bottom-nav button,.home-shortcuts button");
      await page.screenshot({ path: `test-results/home-${size.width}.png` });
      await navigate(page, "용병");
      await page.getByRole("button", { name: /모집소/ }).click();
      await page.locator(".recruit-button").first().click();
      await page.getByRole("button", { name: /소속 용병/ }).click();
      await expect(page.locator(".merc-row")).toHaveCount(6);
      await page.locator(".merc-inspect").first().click();
      await expect(
        page.getByRole("button", { name: "단장은 직접 전투하지 않습니다" }),
      ).toBeDisabled();
      await page.getByRole("button", { name: "장비", exact: true }).click();
      await expect(page.locator(".equipment-list article")).toHaveCount(2);
      await page.getByRole("button", { name: "닫기", exact: true }).click();
      await navigate(page, "편성");
      await expect(page.locator(".party-slot.filled")).toHaveCount(4);
      await expect(page.locator(".party-roster")).not.toContainText("단장");
      await page.locator(".party-toggle").first().click();
      await page.locator(".party-toggle").first().click();
      await expect(page.locator(".party-slot.filled")).toHaveCount(4);
      const gold = Number(
        (await page.locator(".gold b").innerText()).replace(/,/g, ""),
      );
      await navigate(page, "의뢰");
      await page.getByRole("button", { name: /출전하기/ }).click();
      await page.getByRole("button", { name: "일시정지", exact: true }).click();
      await expect(page.locator(".rt-enemy-health .rt-health")).toHaveCount(5);
      await expect(page.locator(".rt-ally-health .rt-health")).toHaveCount(4);
      await expect(page.locator(".rt-ally-health")).not.toContainText("단장");
      await expect(page.locator(".skill-button")).toHaveCount(0);
      const clock = await page.getByTestId("battle-time").innerText(),
        positions = await page
          .getByTestId("battlefield")
          .getAttribute("data-positions");
      await page.waitForTimeout(1200);
      await expect(page.getByTestId("battle-time")).toHaveText(clock);
      await expect(page.getByTestId("battlefield")).toHaveAttribute(
        "data-positions",
        positions!,
      );
      for (const name of [
        "전체 돌격",
        "균형 전술",
        "후위 보호",
        "진형 유지",
        "집중 공격",
        "전술적 후퇴",
      ]) {
        await page.getByRole("button", { name, exact: true }).click();
        await expect(
          page.getByRole("button", { name, exact: true }),
        ).toHaveAttribute("aria-pressed", "true");
      }
      await page
        .getByRole("button", { name: "균형 전술", exact: true })
        .click();
      await inViewport(page, controls);
      expect(
        await page
          .locator(".battle-screen")
          .evaluate((el) => el.scrollHeight <= el.clientHeight),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/battle-paused-${size.width}.png`,
      });
      await page.setViewportSize({
        width: size.width,
        height: size.height - 160,
      });
      await inViewport(page, controls);
      expect(
        await page
          .locator(".battle-screen")
          .evaluate((el) => el.scrollHeight <= el.clientHeight),
      ).toBe(true);
      await page.setViewportSize(size);
      await page.getByRole("button", { name: "전투 속도 1배속" }).click();
      await expect(
        page.getByRole("button", { name: "전투 속도 2배속" }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "전투 계속", exact: true })
        .click();
      await expect(page.getByTestId("battlefield")).not.toHaveAttribute(
        "data-positions",
        positions!,
      );
      await page.waitForTimeout(1800);
      await page.screenshot({
        path: `test-results/battle-moving-${size.width}.png`,
      });
      await expect(
        page.getByRole("heading", { name: "의뢰를 완수했습니다!" }),
      ).toBeVisible({ timeout: 45000 });
      await inViewport(page, ".battle-result,.battle-result button,.rt-health");
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
test("도주 별도 명령과 무보상 결과", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator(".storage-status")).toContainText("저장 완료");
  await navigate(page, "의뢰");
  await page.getByRole("button", { name: /출전하기/ }).click();
  await page.getByRole("button", { name: "전투 속도 1배속" }).click();
  await page.getByRole("button", { name: "도주", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "전장에서 도주했습니다" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".battle-result")).toContainText("획득 보상 없음");
  await page.getByRole("button", { name: "본부로 복귀 →" }).click();
  await expect(page.locator(".gold b")).toHaveText("240");
  await expect(page.getByTestId("victories")).toHaveText("0");
});
test("기존 버전1 저장의 단장·능력·장비를 유지하고 전장 편성만 제외", async ({
  page,
}) => {
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
  await expect(page.locator(".party-slot.filled")).toHaveCount(1);
  await expect(page.locator(".party-roster")).not.toContainText("단장");
  await navigate(page, "용병");
  await page.getByRole("button", { name: "단장 상세 정보" }).click();
  await expect(page.locator(".class-label")).toContainText("용병단장");
  await expect(page.locator(".xp-line")).toContainText("15 / 80");
  await page.getByRole("button", { name: "장비", exact: true }).click();
  await expect(page.locator(".equipment-list")).toContainText("낡은 철검");
  const raw = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((r) => {
      const q = indexedDB.open("outcast-guild", 1);
      q.onsuccess = () => r(q.result);
    });
    const result = await new Promise<string>((r) => {
      const q = db.transaction("saves").objectStore("saves").get("main");
      q.onsuccess = () => r(q.result);
    });
    db.close();
    return JSON.parse(result);
  });
  expect(raw.state.party).toEqual(["hero", "ria"]);
  expect(raw.version).toBe(1);
});
test("세로 PWA 경로와 오프라인 재접속", async ({ page, context }) => {
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
test("PC 팝업·키보드·수동 저장", async ({ page }) => {
  await page.goto("./");
  await navigate(page, "용병");
  await page.locator(".merc-inspect").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "저장 및 설정" }).click();
  await page.getByRole("button", { name: "지금 저장" }).click();
  await expect(page.locator(".settings-status")).toContainText("저장 완료");
});
test("360×640 안전 영역에서도 전술 6개·도주·속도·4대5 HP 모두 표시", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("./");
  await expect(page.locator(".storage-status")).toContainText("저장 완료");
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--safe-top", "24px");
    document.documentElement.style.setProperty("--safe-bottom", "24px");
  });
  await navigate(page, "의뢰");
  await page.getByRole("button", { name: /출전하기/ }).click();
  await page.getByRole("button", { name: "일시정지", exact: true }).click();
  await expect(page.locator(".rt-ally-health .rt-health")).toHaveCount(4);
  await expect(page.locator(".tactic-grid button")).toHaveCount(6);
  await inViewport(page, controls);
  expect(
    await page
      .locator(".battle-screen")
      .evaluate((el) => el.scrollHeight <= el.clientHeight),
  ).toBe(true);
  await page.screenshot({ path: "test-results/realtime-safe-area.png" });
});
