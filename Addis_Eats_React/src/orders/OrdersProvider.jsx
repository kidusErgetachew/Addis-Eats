import { createContext, useContext } from "react";
import { usePersistentState } from "../hooks/usePersistentState.js";
export const statuses = ["pending", "preparing", "delivering", "delivered"];
const OrdersContext = createContext(null);
const validOrders = (value) =>
  Array.isArray(value) &&
  value.every(
    (order) =>
      order &&
      typeof order.id === "string" &&
      typeof order.customerId === "string" &&
      order.customer &&
      typeof order.customer.name === "string" &&
      typeof order.customer.phone === "string" &&
      Array.isArray(order.items) &&
      order.items.every(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.price),
      ) &&
      Number.isFinite(order.total) &&
      Number.isFinite(order.subtotal) &&
      Number.isFinite(order.fee) &&
      statuses.includes(order.status) &&
      Number.isFinite(Date.parse(order.createdAt)),
  );
export function OrdersProvider({ children }) {
  const [orders, setOrders, error] = usePersistentState(
    "addis:orders",
    [],
    validOrders,
  );
  function placeOrder(details) {
    const order = {
      ...details,
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    if (!setOrders((previous) => [order, ...previous]))
      throw new Error(
        "Your order was not saved. Please enable site storage and try again.",
      );
    return order;
  }
  function updateStatus(id, status) {
    const order = orders.find((item) => item.id === id);
    if (
      !order ||
      statuses.indexOf(status) !== statuses.indexOf(order.status) + 1
    )
      return false;
    return setOrders((previous) =>
      previous.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }
  return (
    <OrdersContext.Provider
      value={{
        orders,
        error,
        placeOrder,
        updateStatus,
        deleteOrder: (id) =>
          setOrders((previous) => previous.filter((order) => order.id !== id)),
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}
export const useOrders = () => useContext(OrdersContext);
export const orderNumber = (id) => "#" + id.slice(0, 8).toUpperCase();
