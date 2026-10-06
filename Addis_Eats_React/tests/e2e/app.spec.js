import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const seed = JSON.parse(
  readFileSync(
    new URL("../../public/menu-data.json", import.meta.url),
    "utf8",
  ).replace(/^\uFEFF/, ""),
);
const errors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const pageErrors = [];
  errors.set(page, pageErrors);
  page.on("pageerror", (error) => pageErrors.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

async function customerLogin(page) {
  await page.getByLabel("Your name", { exact: true }).fill("Hana Bekele");
  await page.getByLabel("Phone number", { exact: true }).fill("0912345678");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
async function adminLogin(page) {
  await page.goto("/admin/login");
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("Addis@123");
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
async function seedOrder(page) {
  await page.goto("/");
  await page.evaluate(
    ({ seed }) => {
      localStorage.setItem(
        "addis:orders",
        JSON.stringify([
          {
            id: "test-order-1001",
            customerId: "0912345678",
            customer: {
              name: "Hana Bekele",
              phone: "0912345678",
              area: "Bole",
              notes: "Please call at the gate.",
            },
            items: [{ ...seed[0], quantity: 2 }],
            subtotal: 700,
            fee: 50,
            total: 750,
            estimate: "25–35 min",
            status: "pending",
            createdAt: new Date().toISOString(),
          },
        ]),
      );
    },
    { seed },
  );
}

test("menu URL category, instant search, clear filters and missing dish recovery", async ({
  page,
}) => {
  await page.goto("/menu?category=Pizza");
  await expect(page.locator(".dish-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Margherita Pizza", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".dish-card")).toHaveCount(1);
  await page
    .getByLabel("Search dishes", { exact: true })
    .fill("nothingmatches");
  await expect(
    page.getByRole("heading", { name: "No dishes found" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/q=nothingmatches/);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".dish-card")).toHaveCount(5);
  await page.goto("/menu/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "This dish isn't on the menu" }),
  ).toBeVisible();
  await page.goto("/not-a-route");
  await expect(
    page.getByRole("heading", { name: "A little off the menu" }),
  ).toBeVisible();
});

test("favorites and theme persist after refresh", async ({ page }) => {
  await page.goto("/menu");
  await page
    .getByRole("button", { name: "Save Doro Wat to favorites" })
    .click();
  await page.goto("/favorites");
  await expect(page.locator(".dish-card")).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Doro Wat", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove Doro Wat from favorites" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your next favorite is out there" }),
  ).toBeVisible();
  await page.goto("/profile");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("cart math, quantity, removal and refresh persistence", async ({
  page,
}) => {
  await page.goto("/menu/doro-wat");
  await page.getByRole("button", { name: "Increase Doro Wat" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/cart");
  await expect(page.locator(".total strong")).toHaveText("750 ETB");
  await page.getByRole("button", { name: "Increase Doro Wat" }).click();
  await expect(page.locator(".total strong")).toHaveText("1,100 ETB");
  await page.reload();
  await expect(page.locator(".total strong")).toHaveText("1,100 ETB");
  await page.getByRole("button", { name: "Decrease Doro Wat" }).click();
  await page.getByLabel("Estimate delivery to").selectOption("CMC");
  await expect(page.locator(".total strong")).toHaveText("790 ETB");
  await page.getByRole("button", { name: "Remove Doro Wat from cart" }).click();
  await expect(
    page.getByRole("heading", { name: "Your cart is feeling a little empty" }),
  ).toBeVisible();
});

test("guarded checkout validates, places one order, clears cart and supports reorder", async ({
  page,
}) => {
  await page.goto("/menu");
  await page
    .getByRole("button", { name: "Add Doro Wat to cart", exact: true })
    .click();
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/login$/);
  await customerLogin(page);
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByLabel("Full name").fill("1");
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  await expect(
    page.getByText("Enter your name (at least 2 characters)."),
  ).toBeVisible();
  await expect(page.getByText("Choose a delivery area.")).toBeVisible();
  await page.getByLabel("Full name").fill("Hana Bekele");
  await page.getByLabel("Delivery area", { exact: true }).selectOption("Bole");
  await page
    .getByLabel("Special instructions (optional)")
    .fill("Please call at the gate.");
  await expect(page.locator(".total strong")).toHaveText("400 ETB");
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Thank you, Hana!" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("addis:orders")).length,
    ),
  ).toBe(1);
  await page.getByRole("link", { name: "View my orders" }).click();
  await expect(page.locator(".order-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Reorder", exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.locator(".cart-line")).toHaveCount(1);
  await page.goto("/orders");
  await page.getByRole("button", { name: "Reorder", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Replace your current cart?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep current cart" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("loading and fetch errors display recovery and retry works", async ({
  page,
}) => {
  let finish;
  await page.route("**/menu-data.json", async (route) => {
    await new Promise((resolve) => {
      finish = resolve;
    });
    await route.fulfill({ status: 503, body: "Unavailable" });
  });
  await page.goto("/menu");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Preparing something delicious" }),
  ).toBeVisible();
  finish();
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();
  await page.unroute("**/menu-data.json");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".dish-card")).toHaveCount(5);
});

test("admin guard, failed login, dish create/edit/delete and modal keyboard behavior", async ({
  page,
}) => {
  await page.goto("/admin/menu");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Username", { exact: true }).fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();
  await expect(page.getByRole("alert")).toContainText("Incorrect credentials");
  await page.getByLabel("Password", { exact: true }).fill("Addis@123");
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();
  await expect(page).toHaveURL(/\/admin\/menu$/);
  await page.getByRole("button", { name: "Add dish", exact: true }).click();
  await page.getByLabel("Dish name", { exact: true }).fill("Test Shiro");
  await page.getByLabel("Price (ETB)", { exact: true }).fill("220");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A warming chickpea stew with Ethiopian spices.");
  await page
    .getByLabel("Ingredients (separated by commas)")
    .fill("Chickpeas, Berbere");
  await page.getByRole("button", { name: "Save dish" }).click();
  await expect(
    page.getByRole("heading", { name: "Test Shiro", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit Test Shiro", exact: true })
    .click();
  await page.getByLabel("Price (ETB)", { exact: true }).fill("230");
  await page.getByRole("button", { name: "Save dish" }).click();
  await expect(
    page.locator(".management-row").filter({ hasText: "Test Shiro" }),
  ).toContainText("230 ETB");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Test Shiro", exact: true }),
  ).toBeVisible();
  const edit = page.getByRole("button", {
    name: "Edit Test Shiro",
    exact: true,
  });
  await edit.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(edit).toBeFocused();
  await page
    .getByRole("button", { name: "Delete Test Shiro", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep dish" }).click();
  await expect(
    page.getByRole("heading", { name: "Test Shiro", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete Test Shiro", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete dish", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Test Shiro", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/menu");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("admin order details, forward status updates, analytics and deletion", async ({
  page,
}) => {
  await seedOrder(page);
  await adminLogin(page);
  await expect(
    page.locator(".stat-card").filter({ hasText: "Total order value" }),
  ).toContainText("750 ETB");
  await page.goto("/admin/orders");
  await page.getByRole("button", { name: "Details", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Please call at the gate.",
  );
  for (const status of ["preparing", "delivering", "delivered"])
    await page.getByRole("button", { name: "Mark as " + status }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "This order has been delivered.",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(page.locator(".admin-order-row .status")).toHaveText(
    "delivered",
  );
  await page.getByRole("button", { name: "Delete order #TEST-ORD" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete order", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ready for the first order" }),
  ).toBeVisible();
});

test("checkout reconciles admin price changes before accepting order", async ({
  page,
}) => {
  await page.goto("/menu");
  await page
    .getByRole("button", { name: "Add Doro Wat to cart", exact: true })
    .click();
  await page.goto("/checkout");
  await customerLogin(page);
  await page.getByLabel("Delivery area", { exact: true }).selectOption("Bole");
  await page.evaluate(() => {
    const dishes = JSON.parse(localStorage.getItem("addis:dishes"));
    dishes[0].price = 450;
    localStorage.setItem("addis:dishes", JSON.stringify(dishes));
  });
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("The menu has changed");
  await expect(page.locator(".total strong")).toHaveText("500 ETB");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("addis:orders") || "[]").length,
    ),
  ).toBe(0);
});

test("desktop and mobile home screenshots and navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".dish-card")).toHaveCount(4);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Menu", exact: true })
    .click();
  await expect(page).toHaveURL(/\/menu$/);
});

test("mobile customer pages fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of [
    "/",
    "/menu",
    "/menu/doro-wat",
    "/cart",
    "/favorites",
    "/profile",
    "/login",
  ]) {
    await page.goto(url);
    await expect(page.locator("main").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("mobile admin pages fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await adminLogin(page);
  for (const url of [
    "/admin",
    "/admin/menu",
    "/admin/orders",
    "/admin/analytics",
  ]) {
    await page.goto(url);
    await expect(page.locator("#admin-main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
});

test("empty API data and malformed menu data have useful states", async ({
  page,
}) => {
  await page.route("**/menu-data.json", (route) =>
    route.fulfill({ contentType: "application/json", body: "[]" }),
  );
  await page.goto("/menu");
  await expect(
    page.getByRole("heading", { name: "No dishes found" }),
  ).toBeVisible();
  await page.evaluate(() => localStorage.removeItem("addis:dishes"));
  await page.unroute("**/menu-data.json");
  await page.route("**/menu-data.json", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: '{"unexpected":true}',
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "menu data could not be read",
  );
});

test("failed order storage preserves cart and never reports success", async ({
  page,
}) => {
  await page.goto("/menu");
  await page
    .getByRole("button", { name: "Add Doro Wat to cart", exact: true })
    .click();
  await page.goto("/checkout");
  await customerLogin(page);
  await page.getByLabel("Delivery area", { exact: true }).selectOption("Bole");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "addis:orders")
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Your order was not saved",
  );
  await expect(
    page.getByRole("heading", { name: "Thank you, Hana!" }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("addis:cart")).length,
    ),
  ).toBe(1);
});

test("route error boundary recovers from a rendering exception", async ({
  page,
}) => {
  await page.route("**/src/menu/Menu.jsx*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: 'export default function Menu() { throw new Error("Simulated component failure"); }',
    }),
  );
  await page.goto("/menu");
  await expect(
    page.getByRole("heading", { name: "We couldn't display this page." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Reload page" })).toBeVisible();
  await page.unroute("**/src/menu/Menu.jsx*");
  await page.getByRole("button", { name: "Reload page" }).click();
  await expect(page.locator(".dish-card")).toHaveCount(5);
});

test("admin image upload is persisted and modal contains keyboard focus", async ({
  page,
}) => {
  await adminLogin(page);
  await page.goto("/admin/menu");
  await page
    .getByRole("button", { name: "Edit Doro Wat", exact: true })
    .click();
  await page
    .getByLabel("Upload dish image", { exact: true })
    .setInputFiles(
      fileURLToPath(new URL("../../public/images/burger.jpg", import.meta.url)),
    );
  await expect(page.getByAltText("Dish preview")).toHaveAttribute(
    "src",
    /^data:image\/jpeg;base64,/,
  );
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Save dish" }).focus();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => !!document.activeElement.closest("dialog")),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Save dish" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Edit Doro Wat", exact: true })
    .click();
  await expect(page.getByAltText("Dish preview")).toHaveAttribute(
    "src",
    /^data:image\/jpeg;base64,/,
  );
});

test("selected delivery area survives sign-in; populated mobile checkout fits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/menu");
  await page
    .getByRole("button", { name: "Add Doro Wat to cart", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add Fresh Juice to cart", exact: true })
    .click();
  await page.goto("/cart");
  await page.getByLabel("Estimate delivery to").selectOption("CMC");
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await customerLogin(page);
  await expect(page.getByLabel("Delivery area", { exact: true })).toHaveValue(
    "CMC",
  );
  await expect(page.locator(".total strong")).toHaveText("620 ETB");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/checkout-mobile.png",
    fullPage: true,
  });
});
