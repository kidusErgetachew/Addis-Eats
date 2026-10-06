# Addis Eats

A mobile-first React food-ordering demo for Addis Ababa, built directly in `projects/Addis_Eats_React/`. Implements the customer experience and the optional admin extension in the supplied project brief.

## Run

Use Node.js 22.12+ (verified here with Node 24).

```sh
npm install
npm run dev
npm run build
npm run preview
npm test
npm run test:e2e
npm run format:check
```

On this Windows machine, use `npm.cmd` when PowerShell blocks `npm.ps1`. Browser tests use the installed Microsoft Edge browser through Playwright; there is no separate browser download. A local Vite server is started automatically for tests. For other platforms, change the Playwright browser channel or install a supported browser.

## Try the flows

- Browse Home or Menu; search dishes and choose a category. The category and query are reflected in the URL.
- Open a dish, choose a quantity, add to cart, or save a favorite.
- At checkout, sign in with a name and valid Ethiopian phone number (for example, `Hana Bekele`, `0912345678`). This starts a **demo session**, not verified authentication.
- Choose a delivery area, optionally add instructions, and place a demo order. Cash on delivery is descriptive; no payment is collected.
- Open My Orders to inspect the order or reorder it at current menu prices. Reordering asks before replacing a nonempty cart.
- Visit Profile to switch and persist the theme.
- Open `/admin/login` with username `admin`, password `Addis@123`. Manage dishes, upload images (JPG/PNG/WebP up to 500 KB), inspect orders, advance statuses, and see derived analytics.
- Admin logout returns to `/admin/login`. Customer and admin sessions are separate.

## Routes

Customer: `/`, `/menu`, `/menu/:id`, `/cart`, guarded `/checkout`, `/favorites`, guarded `/orders`, `/login`, `/profile`.
Admin: `/admin/login`, guarded nested `/admin`, `/admin/menu`, `/admin/orders`, `/admin/analytics`.
Confirmation is rendered within checkout; dish add/edit appears in a modal, not another app.

## Architecture

- `api/`: validated fetch of `public/menu-data.json`, local menu persistence, CRUD and change notifications.
- `menu/`: Home, Menu, category controls, cards, and dynamic dish details. `useDishes` owns each screen's fetched resource state; search/filter results are derived.
- `cart/`: Context + reducer store. Counts and ETB totals are derived; quantities are bounded to 1–99.
- `checkout/`: controlled form, reusable validation, latest-menu reconciliation, confirmation.
- `auth/`: session Context, customer sign-in, route guards, profile.
- `favorites/`: persisted favorite IDs.
- `orders/`: persisted order snapshots and customer history/reorder.
- `theme/`: persisted theme Context and responsive styles.
- `admin/`: guarded nested layout, login, menu CRUD, orders and analytics.
- `hooks/`, `ui/`, `utils/`: shared hooks, generic UI, and pure helpers.
- `App.jsx`: providers and high-level route composition; `Layout.jsx`: shared customer shell; `main.jsx`: React entry point.

React Router handles routing. Checkout and admin screens are lazy loaded with Suspense. A route error boundary offers recovery from rendering failures. Native modal dialogs are rendered through a React Portal, providing focus containment, Escape support and focus restoration. Controls use real links/buttons, accessible labels, visible focus and reduced-motion support.

## Data and limitations

The PDF explicitly permits a fetched JSON file as an API stand-in. On first load, `/menu-data.json` seeds `addis:dishes` in localStorage. Subsequent customer/admin views share that local collection. Orders start empty. Prices, ratings, preparation times, fees, and delivery estimates are sample data.

Cart, favorites, dishes, orders and theme are saved under `addis:*` localStorage keys. Sessions are saved in sessionStorage. Storage failures are surfaced; an order is not treated as placed until it is saved. Order lines retain snapshots of prices and names. Checkout and reorder check the current menu for price changes and removed dishes.

**This is a frontend demo, not a production service.** There is no real backend, password verification, SMS verification, payment processing, dispatch, or cross-device synchronization. Phone-based demo profiles and client-side admin guards do not secure private information. All orders exist only in the current browser's storage. Use sample data. Production use requires server-enforced authentication/authorization and API persistence.

Dashboard “Total order value” includes all saved orders and delivery fees; it is not settled payment revenue. Deleting an order removes it from analytics and customer history. Status changes are manual and progress pending → preparing → delivering → delivered.

To reset demo data, clear this site's `addis:*` localStorage and sessionStorage keys using browser developer tools. Clearing storage removes saved carts/orders; the next menu load reseeds dishes.

## Quality checks

`npm test` runs business-rule tests using Node's built-in runner.
`npm run test:e2e` covers browsing, persistence, guarded checkout, validation, reorder, failed fetch/retry, admin login/CRUD/status/logout, changed menu prices, and mobile layout.
Playwright reports and screenshots are written to ignored `test-results/`.
`npm run build` checks production compilation and generates lazy chunks in ignored `dist/`.

See [project plan](docs/PROJECT_PLAN.md), [requirement coverage](docs/REQUIREMENTS.md), and [verification report](docs/VERIFICATION.md), [46-milestone audit](docs/MILESTONES.md), and [presentation/viva guide](docs/PRESENTATION.md).

Food image attribution is available through the app footer at `/image-credits.html`. Wikimedia images retain their respective CC BY-SA licenses. UI icons and the fallback SVG are local code assets. The styling adapts the user's reference rather than reproducing it pixel for pixel.

## Dependencies

Runtime: React, React DOM, React Router DOM.
Development: Vite, the official React plugin, Playwright for browser tests, and Prettier for consistent formatting.
No state-management, charting, form, or UI framework dependency is needed.
