import { deliveryAreas } from "../utils/deliveryEstimate.js";
export const normalizePhone = (phone) =>
  phone.replace(/[\s()-]/g, "").replace(/^\+251/, "0");
export function validateCustomer(values) {
  const errors = {};
  if (
    !values.name?.trim() ||
    values.name.trim().length < 2 ||
    !/\p{L}/u.test(values.name)
  )
    errors.name = "Enter your name (at least 2 characters).";
  if (!/^(09|07)\d{8}$/.test(normalizePhone(values.phone || "")))
    errors.phone = "Use an Ethiopian number, e.g. 0912345678 or +251912345678.";
  return errors;
}
export function validateCheckout(values) {
  const errors = validateCustomer(values);
  if (!Object.hasOwn(deliveryAreas, values.area))
    errors.area = "Choose a delivery area.";
  if ((values.notes || "").length > 500)
    errors.notes = "Keep instructions under 500 characters.";
  return errors;
}
