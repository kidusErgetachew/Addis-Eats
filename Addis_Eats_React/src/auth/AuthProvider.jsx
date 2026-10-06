import { createContext, useContext, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { readStorage, writeStorage } from "../utils/storage.js";
import { normalizePhone, validateCustomer } from "../checkout/validate.js";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    const saved = readStorage("addis:customer", null, true);
    return saved &&
      typeof saved.id === "string" &&
      !Object.keys(validateCustomer(saved)).length
      ? saved
      : null;
  });
  const [admin, setAdmin] = useState(
    () => readStorage("addis:admin", false, true) === true,
  );
  function signIn(values) {
    if (Object.keys(validateCustomer(values)).length) return false;
    const user = {
      name: values.name.trim(),
      phone: normalizePhone(values.phone),
      id: normalizePhone(values.phone),
    };
    if (!writeStorage("addis:customer", user, true)) return false;
    setCustomer(user);
    return true;
  }
  function adminSignIn(username, password) {
    if (username !== "admin" || password !== "Addis@123") return false;
    if (!writeStorage("addis:admin", true, true)) return false;
    setAdmin(true);
    return true;
  }
  return (
    <AuthContext.Provider
      value={{
        customer,
        admin,
        signIn,
        adminSignIn,
        signOut: () => {
          writeStorage("addis:customer", null, true);
          setCustomer(null);
        },
        adminSignOut: () => {
          writeStorage("addis:admin", false, true);
          setAdmin(false);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
export function RequireAuth({ children, adminOnly = false }) {
  const auth = useAuth();
  const location = useLocation();
  return (adminOnly ? auth.admin : auth.customer) ? (
    children
  ) : (
    <Navigate
      to={adminOnly ? "/admin/login" : "/login"}
      state={{ from: location.pathname, returnState: location.state }}
      replace
    />
  );
}
