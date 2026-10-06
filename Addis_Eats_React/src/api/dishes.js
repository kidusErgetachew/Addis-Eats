import { readStorage, writeStorage } from "../utils/storage.js";
export const categories = ["Ethiopian", "Pizza", "Burgers", "Drinks"];
const KEY = "addis:dishes";
const changed = () => window.dispatchEvent(new Event("addis:dishes-changed"));
export function validDish(dish) {
  return (
    dish &&
    typeof dish.id === "string" &&
    typeof dish.name === "string" &&
    dish.name.trim() &&
    categories.includes(dish.category) &&
    Number.isFinite(dish.price) &&
    dish.price > 0 &&
    typeof dish.description === "string" &&
    Array.isArray(dish.ingredients) &&
    dish.ingredients.every((item) => typeof item === "string") &&
    typeof dish.image === "string"
  );
}
export async function getDishes(signal) {
  const saved = readStorage(KEY, null);
  if (Array.isArray(saved) && saved.every(validDish)) return saved;
  const response = await fetch("/menu-data.json", { signal });
  if (!response.ok)
    throw new Error("The menu is unavailable right now. Please try again.");
  const dishes = await response.json();
  if (!Array.isArray(dishes) || !dishes.every(validDish))
    throw new Error("The menu data could not be read. Please try again.");
  if (!writeStorage(KEY, dishes))
    throw new Error(
      "Please enable site storage so we can load and save your menu.",
    );
  return dishes;
}
function save(dishes) {
  if (!writeStorage(KEY, dishes))
    throw new Error(
      "Could not save the menu. Your browser storage may be full.",
    );
  changed();
}
export async function saveDish(dish) {
  if (!validDish(dish)) throw new Error("Please check the dish information.");
  const dishes = await getDishes();
  save(
    dishes.some((item) => item.id === dish.id)
      ? dishes.map((item) => (item.id === dish.id ? dish : item))
      : [...dishes, dish],
  );
}
export async function deleteDish(id) {
  const dishes = await getDishes();
  save(dishes.filter((dish) => dish.id !== id));
}
