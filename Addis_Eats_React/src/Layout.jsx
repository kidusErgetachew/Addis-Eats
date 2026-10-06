import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useCart } from "./cart/CartProvider.jsx";
import { useAuth } from "./auth/AuthProvider.jsx";
import { useTheme } from "./theme/ThemeContext.jsx";
import Icon from "./ui/Icon.jsx";
import Modal from "./ui/Modal.jsx";
const primaryLinks = [
  ["/", "Home"],
  ["/menu", "Menu"],
  ["/favorites", "Favorites"],
  ["/orders", "My orders"],
];
const mobileLinks = [
  ["/", "home", "Home"],
  ["/favorites", "heart", "Favorites"],
  ["/orders", "orders", "Orders"],
  ["/profile", "user", "Profile"],
];
export default function Layout() {
  const cart = useCart();
  const { customer } = useAuth();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  return (
    <div className="customer-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="icon-button mobile-menu-toggle"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <Link className="brand" to="/" aria-label="Addis Eats home">
            <span className="brand-mark">
              <Icon name="dish" size={29} />
            </span>
            <span>
              ADDIS<span className="accent"> EATS</span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {primaryLinks.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <span className="location-label">
              <Icon name="pin" size={18} />
              <span>
                <small>DELIVERING IN</small>Addis Ababa
              </span>
            </span>
            <button
              className="icon-button theme-toggle"
              aria-label={
                "Switch to " + (theme === "dark" ? "light" : "dark") + " theme"
              }
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
            </button>
            <Link
              className="cart-link"
              to="/cart"
              aria-label={"Cart, " + cart.count + " items"}
            >
              <Icon name="cart" size={21} />
              <span className="desktop-cart-label">Cart</span>
              <span className="cart-badge">{cart.count}</span>
            </Link>
            <Link
              className="profile-header icon-button"
              aria-label={customer ? "Your profile" : "Sign in"}
              to={customer ? "/profile" : "/login"}
            >
              <Icon name="user" />
            </Link>
          </div>
        </div>
      </header>
      <main className="app-layout" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div>
          <Link className="brand" to="/">
            <Icon name="dish" size={24} />
            <span>
              ADDIS<span className="accent"> EATS</span>
            </span>
          </Link>
          <p>Made in Addis. Shared with love.</p>
        </div>
        <div className="footer-links">
          <Link to="/menu">Explore menu</Link>
          <Link to="/profile">Your account</Link>
          <Link to="/admin/login">Admin portal</Link>
        </div>
        <p className="footer-note">
          © {new Date().getFullYear()} Addis Eats · A local food-ordering demo
          <br />
          <a href="/image-credits.html">Photo credits</a>
        </p>
      </footer>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mobileLinks.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>
            <Icon name={icon} size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {menuOpen && (
        <Modal title="Explore Addis Eats" onClose={() => setMenuOpen(false)}>
          <nav className="drawer-links" aria-label="More navigation">
            {[
              ...primaryLinks,
              ["/cart", "Your cart"],
              ["/profile", "Profile & theme"],
              ["/admin/login", "Admin portal"],
            ].map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}>
                {label}
                <Icon name="arrow" size={18} />
              </Link>
            ))}
          </nav>
        </Modal>
      )}
    </div>
  );
}
