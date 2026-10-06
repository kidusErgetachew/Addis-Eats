import { useCallback, useEffect, useState } from "react";
import { getDishes } from "../api/dishes.js";

export function useDishes() {
  const [state, setState] = useState({ dishes: [], loading: true, error: "" });
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    window.addEventListener("addis:dishes-changed", retry);
    return () => window.removeEventListener("addis:dishes-changed", retry);
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    getDishes(controller.signal)
      .then((dishes) => {
        if (active) setState({ dishes, loading: false, error: "" });
      })
      .catch((error) => {
        if (active && error.name !== "AbortError")
          setState({ dishes: [], loading: false, error: error.message });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [version]);
  return { ...state, retry };
}
