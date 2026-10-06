import { useFavorites } from "./FavoritesProvider.jsx";
import { useToast } from "../ui/ToastProvider.jsx";
import Icon from "../ui/Icon.jsx";
export default function FavoriteButton({ dish }) {
  const { ids, toggle } = useFavorites();
  const notify = useToast();
  const saved = ids.includes(dish.id);
  return (
    <button
      className={"icon-button favorite-button " + (saved ? "is-favorite" : "")}
      aria-label={
        (saved ? "Remove " : "Save ") +
        dish.name +
        (saved ? " from favorites" : " to favorites")
      }
      aria-pressed={saved}
      onClick={() => {
        if (toggle(dish.id))
          notify(saved ? "Removed from favorites" : "Saved to favorites");
        else notify("Could not save favorites. Check browser storage.");
      }}
    >
      <Icon name="heart" size={19} />
    </button>
  );
}
