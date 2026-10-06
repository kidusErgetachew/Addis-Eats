import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders, orderNumber } from "./OrdersProvider.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useCart } from "../cart/CartProvider.jsx";
import { getDishes } from "../api/dishes.js";
import { reconcileCart } from "../cart/cartReducer.js";
import { formatCurrency, formatDate } from "../utils/formatCurrency.js";
import { PageHeading, EmptyState } from "../ui/Feedback.jsx";
import { useToast } from "../ui/ToastProvider.jsx";
import Icon from "../ui/Icon.jsx";
import Modal from "../ui/Modal.jsx";
export default function OrderHistory() {
  const { orders, error } = useOrders();
  const { customer } = useAuth();
  const cart = useCart();
  const notify = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [busy, setBusy] = useState("");
  const [pending, setPending] = useState(null);
  const [reorderError, setReorderError] = useState("");
  const ownOrders = orders.filter((order) => order.customerId === customer.id);
  const filtered = ownOrders.filter(
    (order) =>
      filter === "All" ||
      (filter === "Delivered"
        ? order.status === "delivered"
        : order.status !== "delivered"),
  );
  async function reorder(order) {
    setBusy(order.id);
    setReorderError("");
    try {
      const dishes = await getDishes();
      const items = reconcileCart(order.items, dishes);
      if (!items.length)
        throw new Error(
          "These dishes are no longer available. Please explore the current menu.",
        );
      const removed = items.length !== order.items.length;
      if (cart.items.length) setPending({ items, removed });
      else {
        cart.replace(items);
        notify(
          removed
            ? "Available dishes added at current prices. Some dishes are no longer available."
            : "Your favorites are back in the cart, at current prices.",
        );
        navigate("/cart");
      }
    } catch (error) {
      setReorderError(error.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="GOOD MEALS, GOOD MEMORIES"
        title="Your orders"
        description="Revisit a favorite, or see what's on its way."
      />
      <div className="tabs" aria-label="Order filters">
        {["All", "Active", "Delivered"].map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {(error || reorderError) && (
        <p className="error-message" role="alert">
          {error || reorderError}
        </p>
      )}
      {filtered.length ? (
        <div className="orders-list">
          {filtered.map((order) => (
            <article className="panel order-card" key={order.id}>
              <div className="section-heading">
                <div>
                  <h2>{orderNumber(order.id)}</h2>
                  <p>
                    {formatDate(order.createdAt)} · {order.customer.area}
                  </p>
                </div>
                <span className={"status status-" + order.status}>
                  {order.status}
                </span>
              </div>
              <div className="order-items">
                {order.items.map((item) => (
                  <span key={item.id}>
                    {item.name} <b>× {item.quantity}</b>
                  </span>
                ))}
              </div>
              <div className="order-card-footer">
                <strong>{formatCurrency(order.total)}</strong>
                <button
                  className="button button-secondary"
                  disabled={!!busy}
                  onClick={() => reorder(order)}
                >
                  <Icon name="bag" size={17} />
                  {busy === order.id ? "Checking menu…" : "Reorder"}
                </button>
              </div>
              <details>
                <summary>Order details</summary>
                <div className="order-details">
                  <p>
                    {order.customer.name} · {order.customer.phone}
                  </p>
                  <p>Estimated delivery at checkout: {order.estimate}</p>
                  {order.customer.notes && <p>Note: {order.customer.notes}</p>}
                  <p>
                    Subtotal {formatCurrency(order.subtotal)} + delivery{" "}
                    {formatCurrency(order.fee)}
                  </p>
                </div>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="orders"
          title={
            ownOrders.length
              ? "No " + filter.toLowerCase() + " orders yet"
              : "Your first good meal awaits"
          }
          description="Your orders will appear here after checkout."
          to="/menu"
          action="Explore the menu"
        />
      )}
      {pending && (
        <Modal
          title="Replace your current cart?"
          onClose={() => setPending(null)}
        >
          <p>
            You already have food in your cart. Reordering will replace it with
            the available dishes from this order, at current prices.
          </p>
          {pending.removed && (
            <p className="error-message">
              Some dishes are no longer available and will be left out.
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button button-secondary"
              onClick={() => setPending(null)}
            >
              Keep current cart
            </button>
            <button
              className="button"
              onClick={() => {
                cart.replace(pending.items);
                setPending(null);
                navigate("/cart");
              }}
            >
              Replace and reorder
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
