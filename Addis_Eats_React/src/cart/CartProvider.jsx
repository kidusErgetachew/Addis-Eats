import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import {
  cartReducer,
  validCart,
  cartCount,
  cartSubtotal,
} from "./cartReducer.js";
import { readStorage, writeStorage } from "../utils/storage.js";
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, () =>
    validCart(readStorage("addis:cart", [])),
  );
  const [error, setError] = useState("");
  useEffect(() => {
    setError(
      writeStorage("addis:cart", items)
        ? ""
        : "Your cart could not be saved. Enable site storage before refreshing.",
    );
  }, [items]);
  const value = {
    items,
    error,
    count: cartCount(items),
    subtotal: cartSubtotal(items),
    add: (dish, quantity = 1) => dispatch({ type: "add", dish, quantity }),
    setQuantity: (id, quantity) => dispatch({ type: "quantity", id, quantity }),
    remove: (id) => dispatch({ type: "remove", id }),
    clear: () => dispatch({ type: "clear" }),
    replace: (items) => dispatch({ type: "replace", items }),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
