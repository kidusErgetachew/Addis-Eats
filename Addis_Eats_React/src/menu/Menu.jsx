import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDishes } from "../hooks/useDishes.js";
import { categories } from "../api/dishes.js";
import CategoryBar from "./CategoryBar.jsx";
import DishCard from "./DishCard.jsx";
import Icon from "../ui/Icon.jsx";
import {
  PageHeading,
  Loading,
  ErrorState,
  EmptyState,
} from "../ui/Feedback.jsx";
export default function Menu() {
  const { dishes, loading, error, retry } = useDishes();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "All";
  const search = params.get("q") || "";
  const filtered = useMemo(
    () =>
      dishes.filter(
        (dish) =>
          (category === "All" || dish.category === category) &&
          (
            dish.name +
            " " +
            dish.description +
            " " +
            dish.ingredients.join(" ")
          )
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
      ),
    [dishes, category, search],
  );
  function update(key, value) {
    const next = new URLSearchParams(params);
    if (!value || value === "All") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: key === "q" });
  }
  return (
    <>
      <PageHeading
        eyebrow="FRESHLY MADE, EVERY DAY"
        title="Something for every craving."
        description="Explore the flavors of Addis, one delicious dish at a time."
      />
      <div className="menu-toolbar">
        <div className="search-input">
          <Icon name="search" />
          <input
            aria-label="Search dishes"
            placeholder="Search dishes, ingredients, cravings…"
            value={search}
            onChange={(event) => update("q", event.target.value)}
          />
          {search && (
            <button aria-label="Clear search" onClick={() => update("q", "")}>
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
        <span className="menu-note">
          <Icon name="leaf" size={17} /> Prepared fresh to order
        </span>
      </div>
      <CategoryBar
        selected={category}
        onSelect={(value) => update("category", value)}
        compact
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={retry} />
      ) : (
        <>
          <div className="results-heading">
            <h2>
              {category === "All"
                ? "All dishes"
                : categories.includes(category)
                  ? category
                  : "Unknown category"}
            </h2>
            <span aria-live="polite">
              {filtered.length} delicious{" "}
              {filtered.length === 1 ? "option" : "options"}
            </span>
          </div>
          {filtered.length ? (
            <div className="dish-grid">
              {filtered.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No dishes found"
              description={
                dishes.length
                  ? "Try a different search or explore another category."
                  : "Our menu is being prepared. Check back soon."
              }
              action="Clear filters"
              onAction={() => setParams({})}
            />
          )}
        </>
      )}
    </>
  );
}
