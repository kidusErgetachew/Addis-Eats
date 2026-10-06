import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTheme } from "../theme/ThemeContext.jsx";
import Icon from "../ui/Icon.jsx";
const links = [
  ["/admin", "grid", "Overview"],
  ["/admin/menu", "dish", "Menu"],
  ["/admin/orders", "orders", "Orders"],
  ["/admin/analytics", "chart", "Analytics"],
];
export default function AdminLayout() {
  const { adminSignOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">
        Skip to content
      </a>
      <aside className="admin-sidebar">
        <Link className="brand" to="/admin">
          <span className="brand-mark">
            <Icon name="dish" size={29} />
          </span>
          <span>
            ADDIS<span className="accent"> EATS</span>
            <small>ADMIN WORKSPACE</small>
          </span>
        </Link>
        <span className="sidebar-label">WORKSPACE</span>
        <nav aria-label="Admin navigation">
          {links.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === "/admin"}>
              <Icon name={icon} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/">
            <Icon name="home" />
            Customer app
          </Link>
          <button
            onClick={() => {
              adminSignOut();
              navigate("/admin/login", { replace: true });
            }}
          >
            <Icon name="logout" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <span>
            <span className="live-dot" /> Addis Eats workspace
          </span>
          <div>
            <button
              className="icon-button"
              aria-label={
                "Switch to " + (theme === "dark" ? "light" : "dark") + " theme"
              }
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
            <span className="admin-avatar">A</span>
            <span>Admin</span>
          </div>
        </header>
        <main id="admin-main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="admin-footer">
          Addis Eats · Local demo workspace
        </footer>
      </div>
    </div>
  );
}
