import { Link } from "react-router-dom";
import { useOrders, orderNumber } from "../orders/OrdersProvider.jsx";
import { useDishes } from "../hooks/useDishes.js";
import { orderAnalytics } from "./analytics.js";
import { formatCurrency, formatDate } from "../utils/formatCurrency.js";
import { PageHeading, ErrorState, EmptyState } from "../ui/Feedback.jsx";
import Icon from "../ui/Icon.jsx";
export default function Dashboard({ analyticsOnly = false }) {
  const { orders, error } = useOrders();
  const dishes = useDishes();
  const stats = orderAnalytics(orders);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    return {
      date,
      total: orders
        .filter(
          (order) =>
            new Date(order.createdAt).toDateString() === date.toDateString(),
        )
        .reduce((sum, order) => sum + order.total, 0),
    };
  });
  const max = Math.max(1, ...days.map((day) => day.total));
  const points = days
    .map(
      (day, index) => 20 + index * 75 + "," + (150 - (day.total / max) * 120),
    )
    .join(" ");
  return (
    <>
      <PageHeading
        eyebrow={
          analyticsOnly ? "THE BIGGER PICTURE" : "YOUR KITCHEN AT A GLANCE"
        }
        title={analyticsOnly ? "Analytics" : "Welcome back, Admin."}
        description={
          analyticsOnly
            ? "Real insights from the orders saved on this device."
            : "Here's what's happening at Addis Eats."
        }
        action={
          <Link className="button" to="/admin/menu">
            <Icon name="plus" size={17} />
            Manage menu
          </Link>
        }
      />
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="stat-grid">
        {[
          [
            "Total order value",
            formatCurrency(stats.revenue),
            "chart",
            "All saved orders, including delivery",
          ],
          ["Orders", stats.count, "orders", "Across all statuses"],
          [
            "Average order value",
            formatCurrency(stats.average),
            "bag",
            "Total value divided by orders",
          ],
          [
            "Dishes",
            dishes.loading ? "…" : dishes.error ? "—" : dishes.dishes.length,
            "dish",
            "Currently on your menu",
          ],
        ].map(([label, value, icon, note]) => (
          <article className="panel stat-card" key={label}>
            <div>
              <span>{label}</span>
              <Icon name={icon} />
            </div>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>
      {dishes.error && (
        <ErrorState message={dishes.error} retry={dishes.retry} />
      )}
      <div className="analytics-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Order value</h2>
            <span className="small muted">Last 7 days</span>
          </div>
          <strong className="chart-value">
            {formatCurrency(days.reduce((sum, day) => sum + day.total, 0))}
          </strong>
          <svg
            className="line-chart"
            viewBox="0 0 490 180"
            role="img"
            aria-label={
              "Daily order values: " +
              days
                .map(
                  (day) =>
                    formatDate(day.date) + ": " + formatCurrency(day.total),
                )
                .join("; ")
            }
          >
            <defs>
              <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c879" stopOpacity=".25" />
                <stop offset="100%" stopColor="#22c879" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[30, 70, 110, 150].map((y) => (
              <line
                key={y}
                x1="20"
                y1={y}
                x2="470"
                y2={y}
                stroke="currentColor"
                opacity=".1"
              />
            ))}
            <polygon
              points={"20,150 " + points + " 470,150"}
              fill="url(#chart-fill)"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#35d58c"
              strokeWidth="3"
            />
            {days.map((day, index) => (
              <circle
                key={index}
                cx={20 + index * 75}
                cy={150 - (day.total / max) * 120}
                r="4"
                fill="#35d58c"
              >
                <title>
                  {formatDate(day.date)}: {formatCurrency(day.total)}
                </title>
              </circle>
            ))}
          </svg>
          <div className="chart-labels">
            {days.map((day, index) => (
              <span key={index}>
                {day.date.toLocaleDateString("en", { weekday: "short" })}
              </span>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Order status</h2>
          <p className="small muted">{stats.count} total orders</p>
          <div className="status-chart">
            {Object.entries(stats.counts).map(([status, count]) => (
              <div key={status}>
                <div className="summary-row">
                  <span className={"status status-" + status}>{status}</span>
                  <span>
                    {count}{" "}
                    <small className="muted">
                      (
                      {stats.count
                        ? Math.round((count / stats.count) * 100)
                        : 0}
                      %)
                    </small>
                  </span>
                </div>
                <div className="status-track">
                  <span
                    className={"bar-" + status}
                    style={{
                      width:
                        (stats.count ? (count / stats.count) * 100 : 0) + "%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="analytics-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Top-selling dishes</h2>
            <Icon name="star" />
          </div>
          {stats.top.length ? (
            stats.top.map((dish, index) => (
              <div className="top-dish" key={dish.id}>
                <span className="rank">{index + 1}</span>
                <div>
                  <strong>{dish.name}</strong>
                  <small>{formatCurrency(dish.revenue)}</small>
                </div>
                <span>{dish.quantity} sold</span>
              </div>
            ))
          ) : (
            <EmptyState
              title="Your next bestseller awaits"
              description="Top dishes will appear after your first order."
            />
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Recent orders</h2>
            <Link className="text-link" to="/admin/orders">
              View all
              <Icon name="arrow" size={16} />
            </Link>
          </div>
          {orders.length ? (
            orders.slice(0, 4).map((order) => (
              <Link to="/admin/orders" className="recent-order" key={order.id}>
                <div>
                  <strong>{orderNumber(order.id)}</strong>
                  <small>{order.customer.name}</small>
                </div>
                <span className={"status status-" + order.status}>
                  {order.status}
                </span>
                <strong>{formatCurrency(order.total)}</strong>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="orders"
              title="Ready for your first order"
              description="Placed customer orders will appear here."
            />
          )}
        </section>
      </div>
    </>
  );
}
