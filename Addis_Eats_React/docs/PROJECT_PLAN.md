# Addis Eats implementation plan

## Scope and sources

Implement all 26 customer features and the 17 admin extension features in the supplied five-page Addis Eats PDF, following the supplied green mobile-first visual reference. The lesson text supplies planning, state ownership, debugging and testing practices; its MeetMap examples are not product requirements. This request supersedes the earlier Milestone 1 stopping point.

## Users and routes

- Visitors: / (specials), /menu (URL category/search), /menu/:id, /cart, /favorites.
- Customers: /login (demo sign-in), /checkout (guarded), /orders (guarded), /profile (session/theme).
- Admin: /admin/login; guarded nested /admin, /admin/menu, /admin/orders, /admin/analytics.
- Confirmation stays on /checkout; dish add/edit uses a portal modal on /admin/menu.
- Unknown routes and missing dish IDs receive useful recovery links.

## Data and API

GET /menu-data.json is the PDF-approved API stand-in; first load seeds the browser's dishes collection. Orders start empty, not fabricated. Menu CRUD and placed orders persist locally. No payments, real dispatch or production authentication are implied.
Dish: id, name, category, price, description, ingredients[], image, rating, minutes, popular.
Order: id, customerId, customer{name,phone,area,notes}, items[] snapshots, subtotal, fee, total, estimate, status, createdAt.
Order statuses progress pending > preparing > delivering > delivered.
Customer sign-in uses name and Ethiopian phone number to identify a local demo profile. Admin demo credentials are explicitly displayed. Sessions use context + sessionStorage, never stored passwords.

## State ownership / hierarchy

App: providers + declarative router only.
Layout: header, navigation, footer, Outlet.
Menu: local fetched resource state via useDishes; category/search in URL; filtered list memoized.
Cart: context + reducer store with localStorage; totals and badge derived.
Auth: context + sessionStorage, guards.
Favorites: persisted ID store, own context.
Orders: persisted order collection shared by customer history and admin.
Theme: context + localStorage, global CSS variables.
Checkout: local controlled fields and errors; fee/time derived from selected area.
Modal visibility: the owning screen. Portal modal handles focus/Escape.
Fetch helpers own validation, cancellation and resource events; generic hooks handle loading/error/retry.
Error boundaries around route content; Checkout and admin pages lazy loaded with Suspense.

## Delivery sequence

1. Plan and data/state foundation.
2. Customer shell, browsing, details and favorites.
3. Cart, guarded checkout, orders and theme.
4. Guarded admin, CRUD and derived analytics.
5. Responsive/accessibility polish, unit and browser verification, README + traceable checklist.

## Verification

Node tests: cart math, invalid quantities, validation, area fees, reorder price reconciliation.
Playwright on installed Edge: menu filtering/search/empty/fetch failure, favorites persistence, cart persistence, protected routes, invalid checkout, successful order/reorder, admin auth/CRUD/status/logout, mobile overflow and theme.
Production build checks imports and lazy chunks. No deployment or Git history will be fabricated.
