import { useRef, useState } from "react";
import { categories, saveDish } from "../api/dishes.js";
import { Field, FoodImage } from "../ui/Feedback.jsx";
import Icon from "../ui/Icon.jsx";
export default function DishForm({ dish, onSaved, onCancel }) {
  const [values, setValues] = useState({
    name: dish?.name || "",
    category: dish?.category || "Ethiopian",
    price: dish?.price ?? "",
    description: dish?.description || "",
    ingredients: dish?.ingredients.join(", ") || "",
    image: dish?.image || "",
    minutes: dish?.minutes || 25,
    popular: dish?.popular || false,
    spicy: dish?.spicy || false,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef(null);
  function change(key, value) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }
  function upload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 500000
    ) {
      setError("Choose a JPG, PNG or WebP image smaller than 500 KB.");
      event.target.value = "";
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      change("image", reader.result);
      setError("");
      setUploading(false);
    };
    reader.onerror = () => {
      setError("Could not read this image. Try another file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }
  async function submit(event) {
    event.preventDefault();
    if (busy || uploading) return;
    const validation = {};
    if (values.name.trim().length < 2)
      validation.name = "Enter at least 2 characters.";
    if (
      !Number.isFinite(Number(values.price)) ||
      Number(values.price) <= 0 ||
      Number(values.price) > 100000
    )
      validation.price = "Enter a price between 0.01 and 100,000 ETB.";
    if (values.description.trim().length < 10)
      validation.description = "Describe the dish in at least 10 characters.";
    if (!values.ingredients.split(",").some((item) => item.trim()))
      validation.ingredients = "Add at least one ingredient.";
    if (
      !Number.isInteger(Number(values.minutes)) ||
      Number(values.minutes) < 1 ||
      Number(values.minutes) > 180
    )
      validation.minutes = "Use 1 to 180 minutes.";
    if (
      values.image &&
      !/^(https?:\/\/|\/images\/|data:image\/(png|jpeg|webp);base64,)/i.test(
        values.image,
      )
    )
      validation.image =
        "Use an http(s) image URL or upload a supported image.";
    setErrors(validation);
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveDish({
        ...values,
        id: dish?.id || crypto.randomUUID(),
        name: values.name.trim(),
        price: Math.round(Number(values.price) * 100) / 100,
        minutes: Number(values.minutes),
        description: values.description.trim(),
        ingredients: [
          ...new Set(
            values.ingredients
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        ],
        rating: dish?.rating || 0,
        image: values.image || "/images/food-fallback.svg",
      });
      onSaved();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form ref={formRef} onSubmit={submit} noValidate>
      <div className="dish-upload">
        <FoodImage src={values.image} alt="Dish preview" />
        <div>
          <label htmlFor="dish-upload" className="label">
            Upload dish image
          </label>
          <input
            id="dish-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={upload}
          />
          <small className="muted">JPG, PNG or WebP · max 500 KB</small>
        </div>
      </div>
      <Field
        id="dish-image"
        label="Or use an image URL"
        value={values.image.startsWith("data:") ? "" : values.image}
        onChange={(event) => change("image", event.target.value)}
        error={errors.image}
        placeholder="https://…"
      />
      <Field
        id="dish-name"
        label="Dish name"
        value={values.name}
        maxLength={80}
        onChange={(event) => change("name", event.target.value)}
        error={errors.name}
      />
      <div className="form-row">
        <Field id="dish-category" label="Category">
          <select
            id="dish-category"
            value={values.category}
            onChange={(event) => change("category", event.target.value)}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </Field>
        <Field
          id="dish-price"
          label="Price (ETB)"
          type="number"
          step="0.01"
          min=".01"
          max="100000"
          value={values.price}
          onChange={(event) => change("price", event.target.value)}
          error={errors.price}
        />
      </div>
      <Field
        id="dish-description"
        label="Description"
        error={errors.description}
      >
        <textarea
          id="dish-description"
          value={values.description}
          maxLength={600}
          rows={3}
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "dish-description-error" : undefined
          }
          onChange={(event) => change("description", event.target.value)}
        />
      </Field>
      <Field
        id="dish-ingredients"
        label="Ingredients (separated by commas)"
        maxLength={500}
        value={values.ingredients}
        onChange={(event) => change("ingredients", event.target.value)}
        error={errors.ingredients}
      />
      <Field
        id="dish-minutes"
        label="Preparation time (minutes)"
        type="number"
        min="1"
        max="180"
        value={values.minutes}
        onChange={(event) => change("minutes", event.target.value)}
        error={errors.minutes}
      />
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={values.spicy}
          onChange={(event) => change("spicy", event.target.checked)}
        />
        Spicy dish
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={values.popular}
          onChange={(event) => change("popular", event.target.checked)}
        />
        Feature among popular dishes
      </label>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button
          className="button button-secondary"
          type="button"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button className="button" type="submit" disabled={busy || uploading}>
          <Icon name="check" size={17} />
          {busy ? "Saving…" : uploading ? "Reading image…" : "Save dish"}
        </button>
      </div>
    </form>
  );
}
