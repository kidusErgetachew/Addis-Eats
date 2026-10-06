import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Icon from "./Icon.jsx";
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const timer = useRef(null);
  const notify = useCallback((message) => {
    clearTimeout(timer.current);
    setMessage(message);
    timer.current = setTimeout(() => setMessage(""), 3500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        className={"toast " + (message ? "visible" : "")}
        role="status"
        aria-live="polite"
      >
        {message && (
          <>
            <Icon name="check" />
            {message}
            <button
              aria-label="Dismiss notification"
              onClick={() => setMessage("")}
            >
              <Icon name="close" size={16} />
            </button>
          </>
        )}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
