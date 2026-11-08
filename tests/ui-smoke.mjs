import { chromium } from "playwright";
import { createServer } from "vite";

const externalUrl = process.env.MEDIAFILEZ_TEST_URL;
const browserChannel = process.env.MEDIAFILEZ_BROWSER_CHANNEL;
const updateScreenshot = process.env.MEDIAFILEZ_UPDATE_SCREENSHOT === "1";
const server = externalUrl
  ? null
  : await createServer({ server: { port: 4173, strictPort: false, hmr: false } });
if (server) await server.listen();
const url = externalUrl ?? server.resolvedUrls.local[0];

async function launchBrowser() {
  if (browserChannel) {
    return chromium.launch({ headless: true, channel: browserChannel });
  }
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    for (const channel of ["chrome", "msedge"]) {
      try {
        console.log(`bundled Chromium unavailable; using installed ${channel}`);
        return await chromium.launch({ headless: true, channel });
      } catch {
        // Try the next locally installed browser.
      }
    }
    throw error;
  }
}

let browser;
let failed = false;

try {
  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 960, height: 680 } });
  const browserErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto(url);
  await page.waitForLoadState("networkidle");

  await expectVisible(page.getByRole("heading", { name: "MediaFilez" }), "brand");
  await expectVisible(page.getByLabel("Media link"), "URL input");
  await expectVisible(page.getByText("Downloads will appear here."), "empty queue");
  await expectVisible(
    page
      .locator(".downloads-section [role='status']")
      .filter({ hasText: "Download queue is clear." }),
    "queue status",
  );
  const queueLive = await page.locator(".downloads-section").getAttribute("aria-live");
  if (queueLive) throw new Error("download history must not be a live region");
  if (updateScreenshot) {
    await page.screenshot({ path: "docs/screenshot.png", fullPage: true });
    console.log("ok: screenshot updated");
  }

  await page.getByLabel("Media link").fill("https://example.com/watch/demo");
  await page.getByRole("button", { name: "Download video" }).click();
  await expectVisible(page.getByText("https://example.com/watch/demo"), "queued job");
  await expectVisible(page.getByText("Complete"), "completed status");

  // Settings & Theme flow
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expectVisible(page.getByRole("dialog", { name: "Settings" }), "settings dialog");
  await expectVisible(page.getByText("Download folder"), "download folder");
  await expectVisible(page.getByRole("switch", { name: "Auto-start downloads" }), "auto-start");

  // Theme switch under Appearance
  await page.getByRole("button", { name: "Appearance" }).click();
  const wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  await page.getByRole("radio", { name: wasDark ? /Light mode/ : /Dark mode/ }).click();
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  if (isDark === wasDark) throw new Error("theme selection did not switch themes");

  // Advanced settings tab
  await page.getByRole("button", { name: "Advanced" }).click();
  await expectVisible(page.getByText("yt-dlp:"), "preview tool status");
  await page.getByRole("button", { name: "Check updates" }).click();
  await expectVisible(page.getByRole("dialog", { name: "You are up to date" }), "current version prompt");
  await page.getByRole("button", { name: "Done" }).click();

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Advanced" }).click();
  await page.getByRole("switch", { name: "Show advanced options" }).click();
  await expectVisible(page.getByText("Site sign-in"), "site sign-in settings");
  await page.getByRole("switch", { name: "Use browser session" }).click();
  const selectedBrowser = await page.locator(".cookie-browser-inputs select").first().inputValue();
  if (selectedBrowser !== "firefox") throw new Error("Firefox is not the default sign-in browser");
  await page.getByRole("button", { name: "Choose file" }).click();
  await expectVisible(page.getByText("C:\\Users\\Demo\\cookies.txt"), "cookie file selection");
  await expectVisible(page.getByText("Authorized Cobalt pool"), "authorized Cobalt pool");
  await expectVisible(page.getByRole("switch", { name: "Community fallback servers" }), "community fallback");
  await expectVisible(page.getByRole("switch", { name: "Instagram embed fallback" }), "Instagram fallback");
  await page.getByRole("button", { name: "Close settings" }).click();

  for (const width of [320, 375, 414, 720, 820, 960, 1024, 1180, 1440]) {
    await page.setViewportSize({ width, height: width === 820 ? 1180 : 680 });
    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (horizontalOverflow) throw new Error(`horizontal overflow at ${width}px`);
    await expectVisible(page.getByLabel("Media link"), `responsive input ${width}px`);
  }

  await page.setViewportSize({ width: 820, height: 1180 });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const dialogBounds = await page.getByRole("dialog", { name: "Settings" }).locator(".modal-panel").boundingBox();
  if (!dialogBounds || dialogBounds.x < 0 || dialogBounds.x + dialogBounds.width > 820) {
    throw new Error("settings dialog does not fit the viewport");
  }
  await page.getByRole("button", { name: "Close settings" }).click();

  if (browserErrors.length) {
    throw new Error(`browser console errors: ${browserErrors.join(" | ")}`);
  }

  const updatePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await updatePage.goto(`${url}?mockUpdate=1`);
  await expectVisible(
    updatePage.getByRole("dialog", { name: "Update available" }),
    "signed update prompt",
  );
  await expectVisible(updatePage.getByRole("button", { name: "Update now" }), "update action");
  await updatePage.getByRole("button", { name: "Later" }).click();
  await updatePage.close();

  console.log("smoke test passed");
} catch (error) {
  failed = true;
  console.error("smoke test failed:", error.message ?? error);
} finally {
  await browser?.close();
  await server?.close();
}

process.exit(failed ? 1 : 0);

async function expectVisible(locator, label) {
  await locator.first().waitFor({ state: "visible", timeout: 10_000 });
  console.log(`ok: ${label}`);
}
