import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDishes } from "../hooks/useDishes.js";
import { useCart } from "../cart/CartProvider.jsx";
import QuantityControl from "../cart/QuantityControl.jsx";
import FavoriteButton from "../favorites/FavoriteButton.jsx";
import { Loading, ErrorState, EmptyState, FoodImage } from "../ui/Feedback.jsx";
import { useToast } from "../ui/ToastProvider.jsx";
import { formatCurrency } from "../utils/formatCurrency.js";
import Icon from "../ui/Icon.jsx";
export default function DishDetails() {
  const { id } = useParams();
  const { dishes, loading, error, retry } = useDishes();
  const cart = useCart();
  const notify = useToast();
  const [quantity, setQuantity] = useState(1);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={retry} />;
  const dish = dishes.find((item) => item.id === id);
  if (!dish)
    return (
      <EmptyState
        title="This dish isn't on the menu"
        description="It may have been removed. Let's find you something else."
        to="/menu"
        action="Explore the menu"
      />
    );
  const currentQuantity =
    cart.items.find((item) => item.id === dish.id)?.quantity || 0;
  return (
    <>
      <Link to="/menu" className="back-link">
        <Icon name="back" size={18} />
        Back to menu
      </Link>
      <div className="detail-layout">
        <div className="detail-photo">
          <FoodImage src={dish.image} alt={dish.name} />
          <FavoriteButton dish={dish} />
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{dish.category} · MADE FRESH</span>
          <h1>{dish.name}</h1>
          <div className="detail-meta">
            <span className={dish.spicy ? "spicy-badge" : "mild-badge"}>
              {dish.spicy
                ? "Spicy · made with berbere"
                : "Mild · no added chili"}
            </span>
            <span className="rating">
              <Icon name="star" size={16} />
              {dish.rating || "New"}
            </span>
            <span>
              <Icon name="clock" size={16} />
              {dish.minutes || 25} min preparation
            </span>
          </div>
          <strong className="detail-price">{formatCurrency(dish.price)}</strong>
          <p className="detail-description">{dish.description}</p>
          <h3>Good things inside</h3>
          <div className="ingredient-list">
            {dish.ingredients.map((ingredient) => (
              <span key={ingredient}>{ingredient}</span>
            ))}
          </div>
          <p className="small muted">
            Have a dietary requirement? Leave a note at checkout. Ingredients
            are listed above.
          </p>
          <div className="detail-actions">
            <QuantityControl
              name={dish.name}
              quantity={quantity}
              onChange={setQuantity}
            />
            <button
              className="button"
              disabled={currentQuantity + quantity > 99}
              onClick={() => {
                cart.add(dish, quantity);
                notify(quantity + " × " + dish.name + " added to your cart");
              }}
            >
              <Icon name="bag" size={18} />
              Add to cart · {formatCurrency(dish.price * quantity)}
            </button>
          </div>
          {currentQuantity + quantity > 99 && (
            <p role="status">
              You can have up to 99 of each dish in your cart.
            </p>
          )}
          <div className="detail-promise">
            <Icon name="leaf" size={19} />
            Fresh ingredients. Thoughtfully prepared.
          </div>
        </div>
      </div>
    </>
  );
}
