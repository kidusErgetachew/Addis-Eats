import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import Icon from "../ui/Icon.jsx";
import { Field } from "../ui/Feedback.jsx";
export default function AdminLogin() {
  const { admin, adminSignIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = [
    "/admin",
    "/admin/menu",
    "/admin/orders",
    "/admin/analytics",
  ].includes(location.state?.from)
    ? location.state.from
    : "/admin";
  if (admin) return <Navigate to={from} replace />;
  return (
    <main className="admin-login-page">
      <Link to="/" className="back-link">
        <Icon name="back" size={18} />
        Customer app
      </Link>
      <section className="panel admin-login-panel">
        <Link to="/" className="admin-login-brand">
          <Icon name="dish" size={58} />
          <strong>ADDIS EATS</strong>
          <span>ADMIN PORTAL</span>
        </Link>
        <h1>Welcome back.</h1>
        <p className="muted">A little care behind every great meal.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (adminSignIn(username, password))
              navigate(from, { replace: true });
            else
              setError(
                "Incorrect credentials, or session storage is unavailable.",
              );
          }}
        >
          <Field
            id="admin-username"
            label="Username"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <Field id="admin-password" label="Password">
            <div className="password-field">
              <input
                id="admin-password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible(!visible)}
              >
                {visible ? "Hide" : "Show"}
              </button>
            </div>
          </Field>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button className="button full-width" type="submit">
            Sign in to dashboard
            <Icon name="arrow" size={18} />
          </button>
        </form>
        <div className="demo-credentials">
          <strong>Try the demo</strong>
          <p>
            Username: <code>admin</code> · Password: <code>Addis@123</code>
          </p>
          <small>
            Client-side demo access only. Not production authentication.
          </small>
        </div>
        <p className="small muted center">
          Session ends when you sign out or close this browser session.
        </p>
      </section>
    </main>
  );
}
