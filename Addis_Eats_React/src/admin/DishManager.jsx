import { useState } from "react";
import { useDishes } from "../hooks/useDishes.js";
import { deleteDish } from "../api/dishes.js";
import {
  PageHeading,
  Loading,
  ErrorState,
  EmptyState,
  FoodImage,
} from "../ui/Feedback.jsx";
import { formatCurrency } from "../utils/formatCurrency.js";
import Icon from "../ui/Icon.jsx";
import Modal from "../ui/Modal.jsx";
import DishForm from "./DishForm.jsx";
import { useToast } from "../ui/ToastProvider.jsx";
export default function DishManager() {
  const { dishes, loading, error, retry } = useDishes();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);
  const notify = useToast();
  const filtered = dishes.filter((dish) =>
    (dish.name + " " + dish.category)
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="FRESH IDEAS START HERE"
        title="Menu management"
        description="Keep your menu as good as the food."
        action={
          <button className="button" onClick={() => setEditing({})}>
            <Icon name="plus" size={17} />
            Add dish
          </button>
        }
      />
      <div className="search-input admin-search">
        <Icon name="search" />
        <input
          aria-label="Search admin dishes"
          placeholder="Search dishes or categories…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search && (
          <button aria-label="Clear dish search" onClick={() => setSearch("")}>
            <Icon name="close" size={17} />
          </button>
        )}
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={retry} />
      ) : filtered.length ? (
        <section className="panel management-list">
          {filtered.map((dish) => (
            <article className="management-row" key={dish.id}>
              <FoodImage src={dish.image} alt={dish.name} />
              <div className="management-name">
                <h3>{dish.name}</h3>
                <span className="muted small">{dish.category}</span>
              </div>
              <strong>{formatCurrency(dish.price)}</strong>
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label={"Edit " + dish.name}
                  onClick={() => setEditing(dish)}
                >
                  <Icon name="edit" size={18} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label={"Delete " + dish.name}
                  onClick={() => {
                    setSaveError("");
                    setDeleting(dish);
                  }}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No dishes found"
          description={
            search
              ? "Try a different search."
              : "Add your first dish to get started."
          }
          action={search ? "Clear search" : "Add dish"}
          onAction={() => (search ? setSearch("") : setEditing({}))}
        />
      )}
      {editing && (
        <Modal
          title={editing.id ? "Edit dish" : "Add a new dish"}
          onClose={() => setEditing(null)}
        >
          <DishForm
            dish={editing.id ? editing : null}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              notify("Dish saved to your menu");
            }}
          />
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Delete this dish?"
          onClose={() => !busy && setDeleting(null)}
        >
          <p>
            <strong>{deleting.name}</strong> will be removed from the menu. Past
            orders keep their original details.
          </p>
          {saveError && (
            <p className="error-message" role="alert">
              {saveError}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button button-secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Keep dish
            </button>
            <button
              className="button button-danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteDish(deleting.id);
                  setDeleting(null);
                  notify("Dish removed from the menu");
                } catch (error) {
                  setSaveError(error.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Deleting…" : "Delete dish"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
