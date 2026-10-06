import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "./CartProvider.jsx";
import QuantityControl from "./QuantityControl.jsx";
import { PageHeading, EmptyState, FoodImage } from "../ui/Feedback.jsx";
import { formatCurrency } from "../utils/formatCurrency.js";
import { deliveryAreas, deliveryEstimate } from "../utils/deliveryEstimate.js";
import Icon from "../ui/Icon.jsx";
import { useToast } from "../ui/ToastProvider.jsx";
export default function Cart() {
  const cart = useCart();
  const notify = useToast();
  const [area, setArea] = useState("Bole");
  const delivery = deliveryEstimate(area);
  return (
    <>
      <PageHeading
        eyebrow="SOMETHING GOOD IS COMING"
        title={"Your cart" + (cart.count ? " (" + cart.count + ")" : "")}
        description="A little closer to a delicious meal."
        action={
          <Link className="text-link" to="/menu">
            Keep exploring
            <Icon name="arrow" size={17} />
          </Link>
        }
      />
      {cart.error && (
        <p className="error-message" role="alert">
          {cart.error}
        </p>
      )}
      {!cart.items.length ? (
        <EmptyState
          icon="bag"
          title="Your cart is feeling a little empty"
          description="Let's fill it with something delicious."
          to="/menu"
          action="Explore the menu"
        />
      ) : (
        <div className="checkout-layout">
          <section className="panel cart-lines">
            {cart.items.map((item) => (
              <article className="cart-line" key={item.id}>
                <Link to={"/menu/" + item.id}>
                  <FoodImage src={item.image} alt={item.name} />
                </Link>
                <div className="cart-line-info">
                  <Link to={"/menu/" + item.id}>
                    <h3>{item.name}</h3>
                  </Link>
                  <span className="muted small">
                    {formatCurrency(item.price)} each
                  </span>
                  <QuantityControl
                    name={item.name}
                    quantity={item.quantity}
                    onChange={(quantity) => cart.setQuantity(item.id, quantity)}
                  />
                </div>
                <div className="cart-line-end">
                  <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  <button
                    className="remove-button"
                    aria-label={"Remove " + item.name + " from cart"}
                    onClick={() => {
                      cart.remove(item.id);
                      notify(item.name + " removed from your cart");
                    }}
                  >
                    <Icon name="trash" size={16} />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </section>
          <aside className="panel order-summary">
            <h2>Order summary</h2>
            <label className="label" htmlFor="cart-area">
              Estimate delivery to
            </label>
            <select
              id="cart-area"
              value={area}
              onChange={(event) => setArea(event.target.value)}
            >
              {Object.keys(deliveryAreas).map((area) => (
                <option key={area}>{area}</option>
              ))}
            </select>
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatCurrency(cart.subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Delivery fee</span>
              <span>{formatCurrency(delivery.fee)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <strong>{formatCurrency(cart.subtotal + delivery.fee)}</strong>
            </div>
            <div className="delivery-estimate">
              <Icon name="clock" size={18} />
              <span>
                Estimated delivery <strong>{delivery.estimate}</strong>
              </span>
            </div>
            <Link className="button full-width" to="/checkout" state={{ area }}>
              Proceed to checkout
              <Icon name="arrow" size={18} />
            </Link>
            <p className="small muted center">
              Freshly made. Delivered with care.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
