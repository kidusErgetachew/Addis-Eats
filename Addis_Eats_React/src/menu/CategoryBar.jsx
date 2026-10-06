import { Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
const items = [
  { name: "All", icon: "dish" },
  { name: "Ethiopian", image: "/images/tibs.jpg" },
  { name: "Pizza", image: "/images/pizza.jpg" },
  { name: "Burgers", image: "/images/burger.jpg" },
  { name: "Drinks", image: "/images/juice.jpg" },
];
export default function CategoryBar({
  selected = "All",
  onSelect,
  compact = false,
}) {
  return (
    <div
      className={"category-bar " + (compact ? "compact" : "")}
      aria-label="Dish categories"
    >
      {items.map((item) => {
        const content = (
          <>
            <span className="category-image">
              {item.image ? (
                <img src={item.image} alt="" />
              ) : (
                <Icon name={item.icon} size={28} />
              )}
            </span>
            <span>{item.name}</span>
          </>
        );
        return onSelect ? (
          <button
            key={item.name}
            className={"category " + (selected === item.name ? "selected" : "")}
            aria-pressed={selected === item.name}
            onClick={() => onSelect(item.name)}
          >
            {content}
          </button>
        ) : (
          <Link
            key={item.name}
            to={item.name === "All" ? "/menu" : "/menu?category=" + item.name}
            className="category"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
