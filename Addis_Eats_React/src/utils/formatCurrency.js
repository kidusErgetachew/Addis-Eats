const formatter = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 });
export const formatCurrency = (value) => `${formatter.format(value)} ETB`;
export const formatDate = (date) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(date));
