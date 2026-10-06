import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../cart/CartProvider.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useOrders } from "../orders/OrdersProvider.jsx";
import { getDishes } from "../api/dishes.js";
import { cartSubtotal, reconcileCart } from "../cart/cartReducer.js";
import { validateCheckout, normalizePhone } from "./validate.js";
import { deliveryAreas, deliveryEstimate } from "../utils/deliveryEstimate.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { PageHeading, Field, EmptyState } from "../ui/Feedback.jsx";
import Icon from "../ui/Icon.jsx";
import OrderConfirmation from "./OrderConfirmation.jsx";
export default function Checkout() {
  const cart = useCart();
  const { customer } = useAuth();
  const { placeOrder } = useOrders();
  const location = useLocation();
  const [values, setValues] = useState({
    name: customer.name,
    phone: customer.phone,
    area: location.state?.area || "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  const formRef = useRef(null);
  const submitting = useRef(false);
  const delivery = deliveryEstimate(values.area);
  function change(key, value) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  }
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const validation = validateCheckout(values);
    setErrors(validation);
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const dishes = await getDishes();
      const currentItems = reconcileCart(cart.items, dishes);
      const changed =
        currentItems.length !== cart.items.length ||
        currentItems.some(
          (item, index) => item.price !== cart.items[index].price,
        );
      if (changed) {
        cart.replace(currentItems);
        throw new Error(
          "The menu has changed. Your cart now reflects current prices and availability. Please review it before placing your order again.",
        );
      }
      if (!currentItems.length) throw new Error("Your cart is empty.");
      const subtotal = cartSubtotal(currentItems);
      const placed = placeOrder({
        customerId: customer.id,
        customer: {
          ...values,
          name: values.name.trim(),
          phone: normalizePhone(values.phone),
          notes: values.notes.trim(),
        },
        items: currentItems,
        subtotal,
        fee: delivery.fee,
        total: subtotal + delivery.fee,
        estimate: delivery.estimate,
      });
      setOrder(placed);
      cart.clear();
    } catch (error) {
      setError(error.message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  if (order) return <OrderConfirmation order={order} />;
  if (!cart.items.length)
    return (
      <EmptyState
        icon="bag"
        title="Choose something delicious first"
        description={error || "Add a dish to your cart before checking out."}
        to="/menu"
        action="Explore the menu"
      />
    );
  return (
    <>
      <Link className="back-link" to="/cart">
        <Icon name="back" size={18} />
        Back to cart
      </Link>
      <PageHeading
        eyebrow="THE FINAL LITTLE DETAILS"
        title="Checkout"
        description="Tell us where your next good meal is going."
      />
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        className="checkout-layout"
      >
        <section className="panel checkout-form">
          <h2>Delivery details</h2>
          <p className="muted">
            All fields are required unless marked optional.
          </p>
          <Field
            id="checkout-name"
            label="Full name"
            autoComplete="name"
            maxLength={80}
            value={values.name}
            onChange={(event) => change("name", event.target.value)}
            error={errors.name}
          />
          <Field
            id="checkout-phone"
            label="Phone number"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            value={values.phone}
            onChange={(event) => change("phone", event.target.value)}
            error={errors.phone}
            placeholder="0912345678"
          />
          <Field id="checkout-area" label="Delivery area" error={errors.area}>
            <select
              id="checkout-area"
              value={values.area}
              aria-invalid={!!errors.area}
              aria-describedby={errors.area ? "checkout-area-error" : undefined}
              onChange={(event) => change("area", event.target.value)}
            >
              <option value="">Choose your area</option>
              {Object.keys(deliveryAreas).map((area) => (
                <option key={area}>{area}</option>
              ))}
            </select>
          </Field>
          <Field
            id="checkout-notes"
            label="Special instructions (optional)"
            error={errors.notes}
          >
            <textarea
              id="checkout-notes"
              maxLength={500}
              value={values.notes}
              aria-invalid={!!errors.notes}
              aria-describedby={
                errors.notes ? "checkout-notes-error" : undefined
              }
              onChange={(event) => change("notes", event.target.value)}
              placeholder="A landmark, gate number, or anything we should know…"
              rows={3}
            />
          </Field>
          <div className="payment-note">
            <Icon name="shield" />
            <div>
              <strong>Pay on delivery</strong>
              <p>No online payment is collected in this demo.</p>
            </div>
          </div>
        </section>
        <aside className="panel order-summary">
          <h2>Your order</h2>
          {cart.items.map((item) => (
            <div className="summary-row" key={item.id}>
              <span>
                {item.name} <small>× {item.quantity}</small>
              </span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="summary-row divider">
            <span>Subtotal</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery fee</span>
            <span>
              {delivery ? formatCurrency(delivery.fee) : "Choose area"}
            </span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <strong>
              {formatCurrency(cart.subtotal + (delivery?.fee || 0))}
            </strong>
          </div>
          {delivery && (
            <div className="delivery-estimate">
              <Icon name="clock" />
              <span>
                Estimated delivery<strong>{delivery.estimate}</strong>
              </span>
            </div>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button className="button full-width" type="submit" disabled={busy}>
            {busy ? "Placing your order…" : "Place order"}
            <Icon name="arrow" size={18} />
          </button>
          <p className="small muted center">
            Demo order · no real delivery will be dispatched.
          </p>
        </aside>
      </form>
    </>
  );
}
