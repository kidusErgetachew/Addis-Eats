import { useCallback, useRef, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage.js";

export function usePersistentState(key, initial, validate = () => true) {
  const [value, setValue] = useState(() => {
    const saved = readStorage(key, initial);
    return validate(saved) ? saved : initial;
  });
  const current = useRef(value);
  const [error, setError] = useState("");
  const update = useCallback(
    (next) => {
      const result = typeof next === "function" ? next(current.current) : next;
      if (!writeStorage(key, result)) {
        setError(
          "Your browser could not save changes. Free some storage or enable site storage, then try again.",
        );
        return false;
      }
      current.current = result;
      setValue(result);
      setError("");
      return true;
    },
    [key],
  );
  return [value, update, error];
}
