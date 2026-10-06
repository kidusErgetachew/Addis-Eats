import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./Layout.jsx";
import { AuthProvider, RequireAuth } from "./auth/AuthProvider.jsx";
import { CartProvider } from "./cart/CartProvider.jsx";
import { FavoritesProvider } from "./favorites/FavoritesProvider.jsx";
import { OrdersProvider } from "./orders/OrdersProvider.jsx";
import { ThemeProvider } from "./theme/ThemeContext.jsx";
import { ToastProvider } from "./ui/ToastProvider.jsx";
import ErrorBoundary from "./ui/ErrorBoundary.jsx";
import { Loading, EmptyState } from "./ui/Feedback.jsx";
import Home from "./menu/Home.jsx";
import Menu from "./menu/Menu.jsx";
import DishDetails from "./menu/DishDetails.jsx";
import Cart from "./cart/Cart.jsx";
import Favorites from "./favorites/Favorites.jsx";
import Login from "./auth/Login.jsx";
import Profile from "./auth/Profile.jsx";
import OrderHistory from "./orders/OrderHistory.jsx";
const Checkout = lazy(() => import("./checkout/Checkout.jsx"));
const AdminLogin = lazy(() => import("./admin/AdminLogin.jsx"));
const AdminLayout = lazy(() => import("./admin/AdminLayout.jsx"));
const Dashboard = lazy(() => import("./admin/Dashboard.jsx"));
const DishManager = lazy(() => import("./admin/DishManager.jsx"));
const OrderManager = lazy(() => import("./admin/OrderManager.jsx"));
function AppRoutes() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      (location.pathname === "/"
        ? "Fresh food, delivered"
        : location.pathname
            .split("/")
            .filter(Boolean)
            .map((part) => part.replaceAll("-", " "))
            .join(" · ")) + " | Addis Eats";
  }, [location.pathname]);
  return (
    <ErrorBoundary key={location.pathname}>
      <Suspense fallback={<Loading label="Getting your page ready…" />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="menu" element={<Menu />} />
            <Route path="menu/:id" element={<DishDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="login" element={<Login />} />
            <Route path="profile" element={<Profile />} />
            <Route
              path="checkout"
              element={
                <RequireAuth>
                  <Checkout />
                </RequireAuth>
              }
            />
            <Route
              path="orders"
              element={
                <RequireAuth>
                  <OrderHistory />
                </RequireAuth>
              }
            />
            <Route
              path="*"
              element={
                <EmptyState
                  title="A little off the menu"
                  description="We couldn't find this page. Let's get you back to something good."
                  to="/"
                  action="Back to home"
                />
              }
            />
          </Route>
          <Route path="admin/login" element={<AdminLogin />} />
          <Route
            path="admin"
            element={
              <RequireAuth adminOnly>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="menu" element={<DishManager />} />
            <Route path="orders" element={<OrderManager />} />
            <Route path="analytics" element={<Dashboard analyticsOnly />} />
            <Route
              path="*"
              element={
                <EmptyState
                  title="Page not found"
                  description="Return to your workspace to continue."
                  to="/admin"
                  action="Dashboard"
                />
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <OrdersProvider>
              <ToastProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </ToastProvider>
            </OrdersProvider>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
