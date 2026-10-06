import { createContext, useContext, useEffect } from "react";
import { usePersistentState } from "../hooks/usePersistentState.js";
const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const [theme, setTheme, error] = usePersistentState(
    "addis:theme",
    "dark",
    (value) => ["dark", "light"].includes(value),
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, setTheme, error }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
