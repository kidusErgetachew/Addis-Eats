import { memo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../cart/CartProvider.jsx";
import FavoriteButton from "../favorites/FavoriteButton.jsx";
import { useToast } from "../ui/ToastProvider.jsx";
import { FoodImage } from "../ui/Feedback.jsx";
import Icon from "../ui/Icon.jsx";
import { formatCurrency } from "../utils/formatCurrency.js";
export default memo(function DishCard({ dish }) {
  const cart = useCart();
  const notify = useToast();
  const quantity =
    cart.items.find((item) => item.id === dish.id)?.quantity || 0;
  return (
    <article className="dish-card">
      <div className="dish-photo">
        <Link to={"/menu/" + dish.id} aria-label={"View " + dish.name}>
          <FoodImage src={dish.image} alt={dish.name} loading="lazy" />
        </Link>
        <FavoriteButton dish={dish} />
        {dish.popular && (
          <span className="photo-label">
            <Icon name="star" size={12} /> Popular
          </span>
        )}
      </div>
      <div className="dish-card-body">
        <div className="dish-category">
          {dish.category}
          <span className="card-tags">
            {dish.spicy && <span className="spicy-badge">Spicy</span>}
            <span className="rating">
              <Icon name="star" size={13} />
              {dish.rating || "New"}
            </span>
          </span>
        </div>
        <h3>
          <Link to={"/menu/" + dish.id}>{dish.name}</Link>
        </h3>
        <p>{dish.description}</p>
        <div className="dish-card-bottom">
          <strong>{formatCurrency(dish.price)}</strong>
          <button
            className="add-button"
            aria-label={"Add " + dish.name + " to cart"}
            disabled={quantity >= 99}
            onClick={() => {
              cart.add(dish);
              notify(dish.name + " added to your cart");
            }}
          >
            <Icon name="plus" size={17} />
            Add{quantity > 0 && <span> · {quantity}</span>}
          </button>
        </div>
      </div>
    </article>
  );
});
