export const MAX_QUANTITY = 99;
export const cartSubtotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const cartCount = (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0);
export function validCart(items) {
  return Array.isArray(items)
    ? items.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          Number.isFinite(item.price) &&
          item.price > 0 &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          item.quantity <= MAX_QUANTITY,
      )
    : [];
}
export function cartReducer(state, action) {
  switch (action.type) {
    case "add": {
      const quantity = action.quantity ?? 1;
      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !action.dish ||
        !Number.isFinite(action.dish.price) ||
        action.dish.price <= 0
      )
        return state;
      const existing = state.find((item) => item.id === action.dish.id);
      return existing
        ? state.map((item) =>
            item.id === action.dish.id
              ? {
                  ...action.dish,
                  quantity: Math.min(MAX_QUANTITY, item.quantity + quantity),
                }
              : item,
          )
        : [
            ...state,
            { ...action.dish, quantity: Math.min(MAX_QUANTITY, quantity) },
          ];
    }
    case "quantity":
      if (
        !Number.isInteger(action.quantity) ||
        action.quantity < 1 ||
        action.quantity > MAX_QUANTITY
      )
        return state;
      return state.map((item) =>
        item.id === action.id ? { ...item, quantity: action.quantity } : item,
      );
    case "remove":
      return state.filter((item) => item.id !== action.id);
    case "clear":
      return [];
    case "replace":
      return validCart(action.items);
    default:
      return state;
  }
}
export function reconcileCart(items, dishes) {
  return items.flatMap((item) => {
    const current = dishes.find((dish) => dish.id === item.id);
    return current ? [{ ...current, quantity: item.quantity }] : [];
  });
}
