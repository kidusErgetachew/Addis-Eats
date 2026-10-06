import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
test("profile real menu interactions without production instrumentation", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/src/main.jsx*", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const reactURL = body.match(
      /from\s+["']([^"']*\/react\.js[^"']*)["']/,
    )?.[1];
    const domURL = body.match(
      /from\s+["']([^"']*react-dom_client\.js[^"']*)["']/,
    )?.[1];
    if (!reactURL || !domURL)
      throw new Error("Could not locate Vite React modules for profiling");
    await route.fulfill({
      contentType: "application/javascript",
      body: `import React from '${reactURL}';
       import ReactDOMClient from '${domURL}';
       import App from '/src/App.jsx';
       import '/src/theme/index.css';
       const { Profiler } = React; const { createRoot } = ReactDOMClient; window.__reactProfile = [];
       createRoot(document.getElementById('root')).render(
         React.createElement(Profiler, {id:'Addis Eats',onRender:(id,phase,actualDuration,baseDuration) => window.__reactProfile.push({phase,actualDuration,baseDuration})}, React.createElement(App))
       );`,
    });
  });
  await page.goto("/menu");
  await expect(page.locator(".dish-card")).toHaveCount(5);
  await page
    .getByLabel("Search dishes", { exact: true })
    .pressSequentially("doro", { delay: 100 });
  await expect(page.locator(".dish-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Add Doro Wat to cart", exact: true })
    .click();
  const samples = await page.evaluate(() => window.__reactProfile);
  expect(samples.length).toBeGreaterThan(1);
  expect(
    samples.every((sample) => Number.isFinite(sample.actualDuration)),
  ).toBe(true);
  expect(errors).toEqual([]);
  const durations = samples.map((sample) => sample.actualDuration);
  const report = {
    note: "React development Profiler; five seeded dishes; menu mount, search typing and add-to-cart. Not a production benchmark.",
    commits: samples.length,
    totalActualDurationMs: durations.reduce((sum, value) => sum + value, 0),
    maxActualDurationMs: Math.max(...durations),
    samples,
  };
  console.log(
    "React profiling: " +
      JSON.stringify({
        commits: report.commits,
        totalMs: report.totalActualDurationMs,
        maxMs: report.maxActualDurationMs,
      }),
  );
  writeFileSync(
    "test-results/react-profile.json",
    JSON.stringify(report, null, 2),
  );
  await testInfo.attach("react-profile", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
});
test("tablet layout, light theme and spicy information", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/menu");
  await expect(
    page
      .locator(".dish-card")
      .filter({ hasText: "Doro Wat" })
      .locator(".spicy-badge"),
  ).toHaveText("Spicy");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/menu/doro-wat");
  await expect(page.getByText("Spicy · made with berbere")).toBeVisible();
  await page.goto("/profile");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/home-tablet-light.png",
    fullPage: true,
  });
});
