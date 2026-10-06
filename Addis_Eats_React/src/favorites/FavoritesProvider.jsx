import { createContext, useContext } from "react";
import { usePersistentState } from "../hooks/usePersistentState.js";
const FavoritesContext = createContext(null);
export function FavoritesProvider({ children }) {
  const [ids, setIds, error] = usePersistentState(
    "addis:favorites",
    [],
    (value) =>
      Array.isArray(value) && value.every((id) => typeof id === "string"),
  );
  return (
    <FavoritesContext.Provider
      value={{
        ids,
        error,
        toggle: (id) =>
          setIds((previous) =>
            previous.includes(id)
              ? previous.filter((item) => item !== id)
              : [...previous, id],
          ),
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
export const useFavorites = () => useContext(FavoritesContext);
