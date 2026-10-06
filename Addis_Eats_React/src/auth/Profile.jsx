import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";
import { useTheme } from "../theme/ThemeContext.jsx";
import { PageHeading } from "../ui/Feedback.jsx";
import Icon from "../ui/Icon.jsx";
export default function Profile() {
  const { customer, signOut } = useAuth();
  const { theme, setTheme, error } = useTheme();
  return (
    <>
      <PageHeading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your profile"
        description="Your account, your preferences, your Addis Eats."
      />
      <div className="profile-grid">
        <section className="panel">
          <div className="profile-avatar">
            <Icon name="user" size={34} />
          </div>
          <h2>{customer ? customer.name : "Welcome, food lover"}</h2>
          <p className="muted">
            {customer
              ? customer.phone
              : "Sign in to place an order and see your order history."}
          </p>
          {customer ? (
            <>
              <Link className="profile-link" to="/orders">
                <Icon name="orders" />
                Your orders
                <Icon name="arrow" />
              </Link>
              <button className="button button-secondary" onClick={signOut}>
                <Icon name="logout" size={18} />
                Sign out
              </button>
            </>
          ) : (
            <Link className="button" to="/login">
              Sign in
              <Icon name="arrow" size={18} />
            </Link>
          )}
          <p className="small muted">
            This is a local demo account. No real identity verification is
            performed.
          </p>
        </section>
        <section className="panel">
          <span className="eyebrow">A LITTLE MORE YOU</span>
          <h2>Choose your theme</h2>
          <p className="muted">
            A fresh look, from the menu to your last bite.
          </p>
          <div className="theme-options">
            {["light", "dark"].map((value) => (
              <button
                key={value}
                className={
                  "theme-option " + value + (theme === value ? " selected" : "")
                }
                aria-pressed={theme === value}
                onClick={() => setTheme(value)}
              >
                <span className="theme-preview">
                  <i />
                  <i />
                  <i />
                </span>
                <span>
                  <Icon name={value === "light" ? "sun" : "moon"} size={18} />
                  {value === "light" ? "Light" : "Dark"}
                  {theme === value && <Icon name="check" size={18} />}
                </span>
              </button>
            ))}
          </div>
          <p className="small muted">
            Applies across the app and is remembered on this device.
          </p>
          {error && <p role="alert">{error}</p>}
        </section>
      </div>
    </>
  );
}
