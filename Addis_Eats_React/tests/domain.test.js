import test from "node:test";
import assert from "node:assert/strict";
import {
  cartReducer,
  cartSubtotal,
  cartCount,
  reconcileCart,
  validCart,
} from "../src/cart/cartReducer.js";
import {
  validateCheckout,
  validateCustomer,
  normalizePhone,
} from "../src/checkout/validate.js";
import { deliveryEstimate } from "../src/utils/deliveryEstimate.js";
import { orderAnalytics } from "../src/admin/analytics.js";
const dish = { id: "doro", name: "Doro Wat", price: 350 };

test("cart merges matching dishes and derives quantities and ETB totals", () => {
  let cart = cartReducer([], { type: "add", dish });
  cart = cartReducer(cart, { type: "add", dish, quantity: 2 });
  cart = cartReducer(cart, {
    type: "add",
    dish: { id: "juice", name: "Juice", price: 180 },
  });
  assert.equal(cart.length, 2);
  assert.equal(cartCount(cart), 4);
  assert.equal(cartSubtotal(cart), 1230);
  cart = cartReducer(cart, { type: "quantity", id: "doro", quantity: 2 });
  assert.equal(cartSubtotal(cart), 880);
  cart = cartReducer(cart, { type: "remove", id: "juice" });
  assert.equal(cartSubtotal(cart), 700);
  assert.deepEqual(cartReducer(cart, { type: "clear" }), []);
});
test("invalid quantities and corrupted persisted items cannot poison the cart", () => {
  const cart = [{ ...dish, quantity: 1 }];
  for (const quantity of [0, -2, NaN, 1.5, 100])
    assert.deepEqual(
      cartReducer(cart, { type: "quantity", id: dish.id, quantity }),
      cart,
    );
  assert.equal(
    cartReducer(cart, { type: "add", dish, quantity: 200 })[0].quantity,
    99,
  );
  assert.deepEqual(
    validCart([null, {}, { ...dish, quantity: -1 }, ...cart]),
    cart,
  );
  assert.deepEqual(
    cartReducer([], { type: "add", dish: { ...dish, price: -1 } }),
    [],
  );
});
test("checkout validates name, Ethiopian phone, area and notes", () => {
  assert.deepEqual(
    validateCheckout({
      name: "Hana Bekele",
      phone: "+251 912 345 678",
      area: "Bole",
      notes: "",
    }),
    {},
  );
  assert.deepEqual(validateCustomer({ name: "ሀና", phone: "0712345678" }), {});
  assert.equal(normalizePhone("+251912345678"), "0912345678");
  assert.deepEqual(
    Object.keys(
      validateCheckout({
        name: "1",
        phone: "123",
        area: "unknown",
        notes: "x".repeat(501),
      }),
    ).sort(),
    ["area", "name", "notes", "phone"],
  );
});
test("delivery fees are derived by area and reject unknown areas", () => {
  assert.equal(deliveryEstimate("Bole").fee, 50);
  assert.equal(deliveryEstimate("CMC").fee, 90);
  assert.equal(deliveryEstimate("missing"), null);
  assert.equal(deliveryEstimate("__proto__"), null);
});
test("reorder reconciles price changes and removed dishes without mutating history", () => {
  const old = [
    { ...dish, quantity: 2 },
    { id: "gone", name: "Removed", price: 20, quantity: 1 },
  ];
  const result = reconcileCart(old, [{ ...dish, price: 400 }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].price, 400);
  assert.equal(result[0].quantity, 2);
  assert.equal(old[0].price, 350);
});
test("analytics aggregates actual orders, quantities and status counts", () => {
  assert.deepEqual(orderAnalytics([]), {
    revenue: 0,
    count: 0,
    average: 0,
    counts: { pending: 0, preparing: 0, delivering: 0, delivered: 0 },
    top: [],
  });
  const stats = orderAnalytics([
    { total: 750, status: "pending", items: [{ ...dish, quantity: 2 }] },
    { total: 400, status: "delivered", items: [{ ...dish, quantity: 1 }] },
  ]);
  assert.equal(stats.revenue, 1150);
  assert.equal(stats.average, 575);
  assert.equal(stats.top[0].quantity, 3);
  assert.equal(stats.counts.delivered, 1);
});
