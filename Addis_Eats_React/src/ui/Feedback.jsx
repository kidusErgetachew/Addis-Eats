import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
export function Loading({ label = "Preparing something delicious…" }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  );
}
export function EmptyState({
  icon = "dish",
  title,
  description,
  to,
  action,
  onAction,
}) {
  return (
    <section className="empty-state">
      <span className="empty-illustration">
        <Icon name={icon} size={52} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {to ? (
        <Link className="button" to={to}>
          {action}
          <Icon name="arrow" />
        </Link>
      ) : onAction ? (
        <button className="button" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </section>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <section className="empty-state" role="alert">
      <span className="empty-illustration">
        <Icon name="dish" size={40} />
      </span>
      <h2>Something went wrong</h2>
      <p>{message}</p>
      {retry && (
        <button className="button" onClick={retry}>
          Try again
        </button>
      )}
    </section>
  );
}
export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Field({ label, error, id, children, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children || (
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? id + "-error" : undefined}
          {...props}
        />
      )}
      {error && (
        <span id={id + "-error"} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}
export function FoodImage({ src, alt, className = "", ...props }) {
  return (
    <img
      className={className}
      src={src || "/images/food-fallback.svg"}
      alt={alt}
      onError={(event) => {
        event.currentTarget.onerror = null;
        if (!event.currentTarget.src.endsWith("/images/food-fallback.svg"))
          event.currentTarget.src = "/images/food-fallback.svg";
      }}
      {...props}
    />
  );
}
