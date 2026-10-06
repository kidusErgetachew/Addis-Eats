import { useDishes } from "../hooks/useDishes.js";
import { useFavorites } from "./FavoritesProvider.jsx";
import DishCard from "../menu/DishCard.jsx";
import {
  PageHeading,
  Loading,
  ErrorState,
  EmptyState,
} from "../ui/Feedback.jsx";
export default function Favorites() {
  const { dishes, loading, error, retry } = useDishes();
  const { ids, error: storageError } = useFavorites();
  const favorites = dishes.filter((dish) => ids.includes(dish.id));
  return (
    <>
      <PageHeading
        eyebrow="SAVED WITH LOVE"
        title="Your favorites"
        description="The dishes you love, all in one place."
      />
      {storageError && (
        <p role="alert" className="error-message">
          {storageError}
        </p>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={retry} />
      ) : favorites.length ? (
        <div className="dish-grid">
          {favorites.map((dish) => (
            <DishCard dish={dish} key={dish.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="heart"
          title="Your next favorite is out there"
          description="Tap the heart on a dish to keep it here for later."
          to="/menu"
          action="Find a favorite"
        />
      )}
    </>
  );
}
