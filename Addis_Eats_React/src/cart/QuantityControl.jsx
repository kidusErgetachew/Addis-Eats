import Icon from "../ui/Icon.jsx";
import { MAX_QUANTITY } from "./cartReducer.js";
export default function QuantityControl({ name, quantity, onChange }) {
  return (
    <div
      className="quantity-control"
      role="group"
      aria-label={name + " quantity"}
    >
      <button
        aria-label={"Decrease " + name}
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
      >
        <Icon name="minus" size={16} />
      </button>
      <span aria-live="polite">{quantity}</span>
      <button
        aria-label={"Increase " + name}
        disabled={quantity >= MAX_QUANTITY}
        onClick={() => onChange(quantity + 1)}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
