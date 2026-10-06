import { Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { formatCurrency } from "../utils/formatCurrency.js";
import { orderNumber } from "../orders/OrdersProvider.jsx";
export default function OrderConfirmation({ order }) {
  return (
    <section className="confirmation">
      <div className="confirmation-art">
        <span className="confetti c1">✦</span>
        <span className="confetti c2">✧</span>
        <span className="confetti c3">✦</span>
        <div className="success-check">
          <Icon name="check" size={50} />
        </div>
      </div>
      <span className="eyebrow">GOOD FOOD, ON ITS WAY</span>
      <h1>Thank you, {order.customer.name.split(" ")[0]}!</h1>
      <p>
        Your demo order has been placed successfully.
        <br />A delicious choice, if we say so ourselves.
      </p>
      <div className="panel confirmation-summary">
        <div className="summary-row">
          <span>Order number</span>
          <strong>{orderNumber(order.id)}</strong>
        </div>
        <div className="summary-row">
          <span>Total</span>
          <strong>{formatCurrency(order.total)}</strong>
        </div>
        <div className="summary-row">
          <span>Delivery to</span>
          <strong>{order.customer.area}</strong>
        </div>
        <div className="summary-row">
          <span>Estimated delivery</span>
          <strong className="accent">{order.estimate}</strong>
        </div>
      </div>
      <Link className="button full-width" to="/orders">
        View my orders
        <Icon name="arrow" size={18} />
      </Link>
      <Link className="button button-secondary full-width" to="/">
        Back to home
      </Link>
      <p className="small muted">
        This is a local demo. No real delivery is scheduled.
      </p>
    </section>
  );
}
