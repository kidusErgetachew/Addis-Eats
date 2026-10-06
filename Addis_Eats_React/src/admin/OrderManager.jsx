import { useState } from "react";
import { useOrders, statuses, orderNumber } from "../orders/OrdersProvider.jsx";
import { PageHeading, EmptyState } from "../ui/Feedback.jsx";
import { formatCurrency, formatDate } from "../utils/formatCurrency.js";
import Modal from "../ui/Modal.jsx";
import Icon from "../ui/Icon.jsx";
import { useToast } from "../ui/ToastProvider.jsx";
export default function OrderManager() {
  const { orders, error, updateStatus, deleteOrder } = useOrders();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [deleting, setDeleting] = useState(null);
  const notify = useToast();
  const selected = orders.find((order) => order.id === selectedId);
  const filtered = orders.filter(
    (order) =>
      (filter === "all" || filter === order.status) &&
      (
        orderNumber(order.id) +
        " " +
        order.customer.name +
        " " +
        order.customer.phone
      )
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="FROM YOUR KITCHEN TO THEIR DOOR"
        title="Orders"
        description="Every order deserves a little care."
      />
      <div className="search-input admin-search">
        <Icon name="search" />
        <input
          aria-label="Search orders"
          placeholder="Search order number, name, or phone…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search && (
          <button aria-label="Clear order search" onClick={() => setSearch("")}>
            <Icon name="close" size={17} />
          </button>
        )}
      </div>
      <div className="tabs" aria-label="Order status filters">
        {["all", ...statuses].map((status) => (
          <button
            className={filter === status ? "active" : ""}
            key={status}
            aria-pressed={filter === status}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {filtered.length ? (
        <section className="panel management-list">
          {filtered.map((order) => (
            <article className="admin-order-row" key={order.id}>
              <button
                className="order-open"
                onClick={() => setSelectedId(order.id)}
                aria-label={"View order " + orderNumber(order.id)}
              >
                <strong>{orderNumber(order.id)}</strong>
                <span>{order.customer.name}</span>
                <small className="muted">{formatDate(order.createdAt)}</small>
              </button>
              <span className={"status status-" + order.status}>
                {order.status}
              </span>
              <strong>{formatCurrency(order.total)}</strong>
              <div className="row-actions">
                <button
                  className="button button-secondary button-small"
                  onClick={() => setSelectedId(order.id)}
                >
                  Details
                </button>
                <button
                  className="icon-button danger"
                  aria-label={"Delete order " + orderNumber(order.id)}
                  onClick={() => setDeleting(order)}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon="orders"
          title={
            orders.length ? "No matching orders" : "Ready for the first order"
          }
          description={
            orders.length
              ? "Try another search or status filter."
              : "Orders placed in the customer app will appear here."
          }
          action={orders.length ? "Clear filters" : undefined}
          onAction={
            orders.length
              ? () => {
                  setSearch("");
                  setFilter("all");
                }
              : undefined
          }
        />
      )}
      {selected && (
        <Modal
          title={"Order " + orderNumber(selected.id)}
          onClose={() => setSelectedId("")}
        >
          <span className={"status status-" + selected.status}>
            {selected.status}
          </span>
          <h3 className="spaced">Customer details</h3>
          <p>
            {selected.customer.name}
            <br />
            {selected.customer.phone}
            <br />
            {selected.customer.area}, Addis Ababa
          </p>
          {selected.customer.notes && (
            <p className="note-box">{selected.customer.notes}</p>
          )}
          <h3 className="spaced">Order summary</h3>
          {selected.items.map((item) => (
            <div className="summary-row" key={item.id}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="summary-row">
            <span>Delivery fee</span>
            <span>{formatCurrency(selected.fee)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatCurrency(selected.total)}</strong>
          </div>
          <p className="small muted">
            {formatDate(selected.createdAt)} · {selected.estimate} estimated at
            checkout
          </p>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          {selected.status !== "delivered" ? (
            <button
              className="button full-width"
              onClick={() => {
                const next = statuses[statuses.indexOf(selected.status) + 1];
                if (updateStatus(selected.id, next))
                  notify("Order marked as " + next);
              }}
            >
              Mark as {statuses[statuses.indexOf(selected.status) + 1]}
              <Icon name="arrow" size={17} />
            </button>
          ) : (
            <div className="delivery-estimate">
              <Icon name="check" />
              This order has been delivered.
            </div>
          )}
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete this order?" onClose={() => setDeleting(null)}>
          <p>
            Order <strong>{orderNumber(deleting.id)}</strong> will be removed
            from both the admin list and the customer's history. This cannot be
            undone.
          </p>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button button-secondary"
              onClick={() => setDeleting(null)}
            >
              Keep order
            </button>
            <button
              className="button button-danger"
              onClick={() => {
                if (deleteOrder(deleting.id)) {
                  setDeleting(null);
                  notify("Order deleted");
                }
              }}
            >
              Delete order
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
