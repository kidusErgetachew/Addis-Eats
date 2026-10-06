import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";
import { validateCustomer } from "../checkout/validate.js";
import { Field } from "../ui/Feedback.jsx";
import Icon from "../ui/Icon.jsx";
export default function Login() {
  const { customer, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const from = ["/checkout", "/orders", "/profile"].includes(
    location.state?.from,
  )
    ? location.state.from
    : "/profile";
  const [values, setValues] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  if (customer)
    return <Navigate to={from} replace state={location.state?.returnState} />;
  function submit(event) {
    event.preventDefault();
    const validation = validateCustomer(values);
    setErrors(validation);
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    if (signIn(values))
      navigate(from, { replace: true, state: location.state?.returnState });
    else
      setError(
        "Could not start your session. Please enable site storage and try again.",
      );
  }
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <span className="eyebrow">GOOD FOOD BRINGS US TOGETHER</span>
        <h1>
          Your table
          <br />
          is ready.
        </h1>
        <p>
          Sign in to bring your favorite flavors home and keep your orders in
          one place.
        </p>
        <img src="/images/tibs.jpg" alt="Fresh Ethiopian tibs" />
      </div>
      <section className="panel auth-panel">
        <span className="auth-logo">
          <Icon name="dish" size={36} />
        </span>
        <h2>Welcome to Addis Eats</h2>
        <p className="muted">A good meal is just a few details away.</p>
        <form ref={formRef} onSubmit={submit} noValidate>
          <Field
            id="login-name"
            label="Your name"
            autoComplete="name"
            value={values.name}
            onChange={(event) =>
              setValues({ ...values, name: event.target.value })
            }
            error={errors.name}
            maxLength={80}
            placeholder="e.g. Hana Bekele"
          />
          <Field
            id="login-phone"
            label="Phone number"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) =>
              setValues({ ...values, phone: event.target.value })
            }
            error={errors.phone}
            maxLength={20}
            placeholder="0912345678"
          />
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button className="button full-width" type="submit">
            Continue
            <Icon name="arrow" size={18} />
          </button>
        </form>
        <p className="demo-note">
          <Icon name="shield" size={17} />
          Demo sign-in: no password or SMS verification. Your profile stays in
          this browser session.
        </p>
        <Link className="text-link" to="/menu">
          Keep browsing
        </Link>
      </section>
    </div>
  );
}
