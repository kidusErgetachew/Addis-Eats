# Addis Eats: final project understanding and viva guide

Audit date: 18 September 2026. Source: the current `projects/Addis_Eats_React/` project only. The Day 34 project was not used. This guide adds documentation; application code, dependencies, and features were not changed.

The code is the authority for implementation claims. Existing documentation helps explain intended choices, but is not proof that a test passed today. Architectural reasons below explain the suitability of the current design; they do not imply that every alternative was experimentally compared.

## 1. Final project audit

### What this application actually is

Addis Eats is a React single-page food-ordering **demo** with customer and admin screens. Vite runs and builds it. React Router maps URLs to components. The only runtime packages declared are React, React DOM, and React Router DOM. It uses ordinary CSS and local SVG icons.

The menu starts from five dishes in `public/menu-data.json`: Doro Wat, Tibs, Margherita Pizza, Cheese Burger, and Fresh Juice. The four categories are Ethiopian, Pizza, Burgers, and Drinks. Admin edits change a browser-local menu collection. There is no application server, database, payment integration, or restaurant dispatch connection.

### Architecture and folder structure

```text
index.html                         HTML document and #root
src/main.jsx                       Mount React and load CSS
src/App.jsx                        Providers, router, guards, route recovery
src/Layout.jsx                     Shared customer shell and Outlet
src/api/                           Menu validation, fetch and local CRUD
src/auth/                          Demo identities, guards, login, profile
src/cart/                          Cart reducer, provider, page, quantity UI
src/checkout/                      Form, validation, confirmation
src/favorites/                     Favorite IDs, button and saved-dishes page
src/hooks/                         Reusable loading and persistence logic
src/menu/                          Home, menu, categories, cards, dish details
src/orders/                        Order snapshots, history and reorder
src/admin/                         Admin layout, login, management, analytics
src/theme/                         Theme provider and three CSS files
src/ui/                            Shared fields, feedback, modal, icons, toast
src/utils/                         Storage, ETB/date formatting, delivery rules
public/                            Seed JSON, food photos, fallback, credits
tests/domain.test.js               Pure business-rule tests
tests/e2e/                         Browser scenarios and development profiling
docs/                              Planning, coverage, verification, study guides
package.json / package-lock.json   Scripts, dependencies, locked resolution
vite.config.js                     Vite React plugin
playwright.config.js               Browser-test environment
dist/                              Generated production output
test-results/                      Generated browser-test artifacts
node_modules/                      Installed dependencies, not authored app code
```

Feature folders put related behavior together. Generic presentation belongs in `ui`; pure helpers belong in `utils`; domain logic remains near its feature. For example, cart calculations belong to `cart/cartReducer.js`, not a generic utility dumping ground.

### Startup and provider tree

```text
index.html → main.jsx → StrictMode → App
  ThemeProvider
    AuthProvider
      CartProvider
        FavoritesProvider
          OrdersProvider
            ToastProvider
              BrowserRouter
                AppRoutes
                  ErrorBoundary, keyed by pathname
                    Suspense
                      Routes → customer Layout or admin Layout → page
```

Providers stay mounted above routes, so navigation does not discard shared state. The providers do not all depend on each other merely because they are nested. Router-aware pages and `RequireAuth` render inside `BrowserRouter`.

The error boundary surrounds route content, **not the providers above it**. On pathname changes, `AppRoutes` scrolls to the top, changes the document title, and gives the boundary a new key. Query-string-only changes do not trigger that pathname effect or reset the boundary.

### Routes

| URL | Component | Access and behavior |
| --- | --- | --- |
| `/` | `Home` | Public, within customer `Layout` |
| `/menu` | `Menu` | Public; `q` and `category` query parameters |
| `/menu/:id` | `DishDetails` | Public dynamic dish lookup |
| `/cart` | `Cart` | Public |
| `/favorites` | `Favorites` | Public, browser-wide favorites |
| `/login` | `Login` | Customer demo sign-in |
| `/profile` | `Profile` | Public; guest and signed-in versions |
| `/checkout` | lazy `Checkout` | `RequireAuth` requires customer |
| `/orders` | `OrderHistory` | `RequireAuth` requires customer |
| `/admin/login` | lazy `AdminLogin` | Separate admin login screen |
| `/admin` | lazy `AdminLayout` + `Dashboard` | `RequireAuth adminOnly`; overview index |
| `/admin/menu` | lazy `DishManager` | Guarded nested admin route |
| `/admin/orders` | lazy `OrderManager` | Guarded nested admin route |
| `/admin/analytics` | lazy `Dashboard` | Same dashboard with `analyticsOnly` prop |
| Unknown customer/admin paths | `EmptyState` | Recovery links |

Confirmation is conditional content inside `/checkout`, **not a separate route**. Dish add/edit forms are modals inside `/admin/menu`. The analytics prop changes dashboard heading/copy; it does not select a completely separate analytics engine.

### Data and API layer

`api/dishes.js` is a local data-service abstraction, not a remote CRUD API:

1. Read `addis:dishes` from localStorage.
2. If it is a valid array of dishes, return it, including an intentionally empty array.
3. Otherwise fetch `/menu-data.json`.
4. Check HTTP success and basic dish structure.
5. Save the seed to localStorage; report a failure if this cannot be saved.
6. `saveDish` inserts or replaces by ID; `deleteDish` removes by ID.
7. Successful writes dispatch `addis:dishes-changed` on the current window.

`useDishes` keeps each calling component's own `dishes/loading/error` state. It listens for that event and reloads through a retry/version mechanism. An AbortController and an `active` flag prevent obsolete fetch completion from updating an unmounted effect.

There is no central menu Context, server cache, pagination, or network search. Once the local menu is valid, changing the seed JSON does not automatically overwrite it. The custom change event is not cross-tab synchronization.

### State, storage, and authentication

Context distributes shared in-memory values. Storage explicitly preserves selected values across reloads. These are separate jobs.

| Storage | Keys | Meaning |
| --- | --- | --- |
| localStorage | `addis:dishes` | Browser-local current menu |
| localStorage | `addis:cart` | Dish objects plus quantity |
| localStorage | `addis:favorites` | Dish IDs only |
| localStorage | `addis:orders` | Full historical order snapshots |
| localStorage | `addis:theme` | `dark` or `light`; default dark |
| sessionStorage | `addis:customer` | Name, normalized phone, phone-based ID |
| sessionStorage | `addis:admin` | Boolean demo-admin flag |

Customer sign-in validates a name and Ethiopian phone format; it does not prove ownership of that number. Normalization converts `+251` to a leading `0` and removes spaces, parentheses, and hyphens. Accepted normalized numbers start with `09` or `07` and have ten digits.

Admin credentials are visibly provided in the demo: `admin` / `Addis@123`. The comparison happens in browser JavaScript. Passwords are not saved by the application, but the source contains the demo password. Customer and admin sessions are independent; signing out of one does not sign out of the other.

`RequireAuth` redirects with the intended pathname and existing route state. Login uses an allowlist of return destinations and restores the selected delivery area. Session storage normally belongs to a tab/session and survives reload; it is not a secure session expiry system.

Cart, favorites, and theme are not account-specific. Orders are stored together and filtered for the customer by `customerId`. Anyone able to use the same phone-based demo identity or edit storage can bypass that presentation-level separation.

### Customer and admin features

Customers can browse, search, filter, inspect ingredients/spice/preparation information, save favorites, manage quantities, view ETB totals, choose among six delivery areas, sign in, submit a validated demo order, inspect history, reorder, and switch theme. Ratings and time values are sample data; customers cannot submit reviews.

Admin can sign in/out, search/add/edit/delete dishes, use image URLs or upload JPEG/PNG/WebP files up to 500,000 bytes, inspect/search/filter/delete orders, advance status, and view derived analytics. Uploaded images become data URLs in localStorage, not server-hosted uploads.

Status progression is strictly one step forward:

```text
pending → preparing → delivering → delivered
```

Analytics uses all locally saved orders. Total order value includes delivery fees and all statuses; it is not settled revenue. Top dishes are ranked by quantity, with item-value totals excluding delivery. Deleting an order removes it from both history and analytics. The seven-day graph is calculated from local timestamps and rendered with SVG, without a chart library.

### UI, errors, loading, and empty states

Shared UI includes `Field`, `PageHeading`, `Loading`, `ErrorState`, `EmptyState`, `FoodImage`, `Icon`, `Modal`, `QuantityControl`, `FavoriteButton`, and toasts.

Error handling has several layers: invalid fields show field messages; fetch failures show Retry; storage writes return failure or throw a user-facing error; checkout catches expected failures; broken images use a fallback; unknown routes/dishes show recovery screens; descendant render failures use the error boundary.

Menu loading and route-code loading are different: `useDishes.loading` drives menu feedback; `Suspense` handles lazy module loading. Checkout, reorder, upload, save, and delete actions have their own busy feedback. Empty states cover empty menu/filter results, cart, favorites, history, admin data, and missing dishes.

Storage behavior differs deliberately: cart state updates first and an effect attempts saving afterward; a failed save leaves an in-memory cart and a warning. `usePersistentState` writes first and only updates React state after success. Consequently, failed order persistence does not clear the cart or report an order placed.

### Responsive design and accessibility

The styles use CSS Grid/Flexbox, flexible widths, wrapping, and media queries. Customer cards become a two-column grid at tablet widths and horizontal single-column cards on mobile. Cart/checkout/detail/profile layouts stack. Mobile customers get a navigation dialog and bottom navigation; the header theme control is hidden on small screens, with theme still available in Profile. Admin's sidebar becomes top navigation on small screens.

Relevant breakpoints include 1100, 900, 800, 760, and 640 pixels, plus a large-screen rule at 1500 pixels. A 320px minimum body width exists; that alone is not proof that every page works perfectly at 320px.

Accessibility code includes semantic links/buttons/main/nav, associated labels, image alt text, decorative icons hidden from assistive technology, visible keyboard focus, skip links, pressed-state buttons, live result counts/toasts, field error associations, and first-invalid-field focus. `Modal` uses a portal plus native `dialog.showModal()`, a title ID, Escape handling, explicit Tab wrapping, scroll locking, and focus restoration. Reduced-motion CSS disables animations/transitions.

These are implemented measures, not a claim of full WCAG compliance. Route navigation scrolls and changes titles but does not generally move focus to the new page heading. Small-screen icon controls and full screen-reader/contrast behavior still deserve manual review.

### Performance features and their limits

`Menu` memoizes filtering; `DishCard` uses `React.memo`; the retry, persistence setter, and toast callbacks use `useCallback`. Checkout and admin modules are lazy-loaded. Card images use `loading="lazy"`; the home hero image has high fetch priority. Seed images are local. Search is synchronous local filtering over five seed dishes, without per-keystroke fetches or debouncing.

Memoized cards still receive cart Context updates. Several provider values/actions are recreated on provider renders, so this is not a selector-based store. CSS is loaded globally, including admin styles; lazy-loading admin JavaScript does not mean its CSS is deferred. The Profiler appears in a browser-test injection, not in normal application startup.

## 2. File-by-file explanation

Paths below are relative to the project root. For source files, removing an imported file without also changing its callers normally breaks module resolution. “What would break” additionally explains the behavior lost if that integration were removed cleanly. Imports are summarized by their meaningful dependencies rather than repeating every import statement verbatim.

### Entry, composition, and layout

**FILE: `src/main.jsx`**  
**PURPOSE:** Start React.  
**WHY IT EXISTS:** Connect the HTML root to the component tree.  
**WHAT IT IMPORTS:** `StrictMode`, `createRoot`, `App`, `theme/index.css`.  
**WHAT IT EXPORTS:** Nothing.  
**IMPORTANT CODE:** `createRoot(document.getElementById("root")).render(...)`.  
**WHY THAT CODE EXISTS:** Creates the client root; StrictMode checks development behavior and cleanup.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** No React UI would mount; stylesheet loading would also disappear.  
**SIMPLE STUDENT EXPLANATION:** “This is the starting switch for the application.”

**FILE: `src/App.jsx`**  
**PURPOSE:** Compose shared providers and routes.  
**WHY IT EXISTS:** Keep application wiring in one place.  
**WHAT IT IMPORTS:** React lazy/Suspense/effect, router primitives, layouts, providers, guards, feedback, pages, and dynamically imported checkout/admin pages.  
**WHAT IT EXPORTS:** Default `App`; `AppRoutes` is internal.  
**IMPORTANT CODE:** Provider tree, nested `Routes`, `RequireAuth`, `ErrorBoundary key={location.pathname}`, `Suspense`, pathname effect.  
**WHY THAT CODE EXISTS:** Preserves shared state, selects pages, gates demo routes, handles code loading/render recovery, and updates title/scroll.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Navigation and shared feature access would not be assembled.  
**SIMPLE STUDENT EXPLANATION:** “App connects our stores and decides which page belongs to each URL.”

**FILE: `src/Layout.jsx`**  
**PURPOSE:** Customer header, navigation, content area, footer, and mobile menu.  
**WHY IT EXISTS:** Share the same customer shell across pages.  
**WHAT IT IMPORTS:** React state/effect; links, Outlet, location; cart/auth/theme hooks; Icon and Modal.  
**WHAT IT EXPORTS:** Default `Layout`.  
**IMPORTANT CODE:** `<Outlet />`, derived cart badge, `menuOpen`, pathname-close effect, theme switch.  
**WHY THAT CODE EXISTS:** Renders child routes while keeping navigation consistent and closing an obsolete drawer.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Customer shell, badge, mobile navigation, and route outlet placement.  
**SIMPLE STUDENT EXPLANATION:** “The frame stays the same while the page inside it changes.”

### API and hooks

**FILE: `src/api/dishes.js`**  
**PURPOSE:** Read and change the current menu.  
**WHY IT EXISTS:** Keep data access out of presentation components.  
**WHAT IT IMPORTS:** `readStorage`, `writeStorage`.  
**WHAT IT EXPORTS:** `categories`, `validDish`, `getDishes`, `saveDish`, `deleteDish`.  
**IMPORTANT CODE:** Valid local data first; fallback fetch; validated save; ID-based upsert/delete; change event.  
**WHY THAT CODE EXISTS:** Seeds a usable menu and shares admin changes within this app window.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Menu loading and admin menu persistence.  
**SIMPLE STUDENT EXPLANATION:** “This is our small local menu service, not a backend server.”

**FILE: `src/hooks/useDishes.js`**  
**PURPOSE:** Reuse menu loading state and lifecycle.  
**WHY IT EXISTS:** Several pages need the same loading/error/retry behavior.  
**WHAT IT IMPORTS:** `useCallback`, `useEffect`, `useState`, `getDishes`.  
**WHAT IT EXPORTS:** `useDishes`.  
**IMPORTANT CODE:** Retry increments `version`; effects load data/listen for changes; cleanup aborts and marks inactive.  
**WHY THAT CODE EXISTS:** Reload on request/change and avoid obsolete async updates.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Its consumers lose menu state, retry, and change refresh.  
**SIMPLE STUDENT EXPLANATION:** “It packages how to load a menu; each caller has its own state.”

**FILE: `src/hooks/usePersistentState.js`**  
**PURPOSE:** State with validated initialization and checked localStorage writes.  
**WHY IT EXISTS:** Favorites, orders, and theme share this pattern.  
**WHAT IT IMPORTS:** React callback/ref/state hooks and storage helpers.  
**WHAT IT EXPORTS:** `usePersistentState`.  
**IMPORTANT CODE:** Lazy initializer, `current` ref, stable `update`, save-before-state, `[value, update, error]`.  
**WHY THAT CODE EXISTS:** Functional updates use the latest accepted value; callers can detect failed persistence.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Consistent persisted state/error behavior in three providers.  
**SIMPLE STUDENT EXPLANATION:** “It saves a change successfully before showing that change as accepted.”

### Authentication

**FILE: `src/auth/AuthProvider.jsx`**  
**PURPOSE:** Customer/admin demo sessions and route guards.  
**WHY IT EXISTS:** Multiple pages need the current identity and access decisions.  
**WHAT IT IMPORTS:** Context/state hooks, Navigate/location, storage, customer validation/phone normalization.  
**WHAT IT EXPORTS:** `AuthProvider`, `useAuth`, `RequireAuth`.  
**IMPORTANT CODE:** Session initializers; normalized phone ID; literal admin credential check; redirect with `from`/`returnState`.  
**WHY THAT CODE EXISTS:** Restore demo sessions and continue interrupted checkout after login.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Demo login state, customer history association, and route gating.  
**SIMPLE STUDENT EXPLANATION:** “It remembers who is using the demo, but it is not secure authentication.”

**FILE: `src/auth/Login.jsx`**  
**PURPOSE:** Customer sign-in form.  
**WHY IT EXISTS:** Gather the demo identity before ordering.  
**WHAT IT IMPORTS:** State/ref, router navigation/location, auth, validation, Field, Icon.  
**WHAT IT EXPORTS:** Default `Login`.  
**IMPORTANT CODE:** Controlled values, validation, first-invalid focus, allowed return paths, restored route state.  
**WHY THAT CODE EXISTS:** Give useful errors and preserve the checkout destination/area.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Customer sign-in UI and its return flow.  
**SIMPLE STUDENT EXPLANATION:** “The user enters a name and phone to start a local demo session.”

**FILE: `src/auth/Profile.jsx`**  
**PURPOSE:** Show identity, sign-out, and theme choices.  
**WHY IT EXISTS:** Provide one customer preference/account screen.  
**WHAT IT IMPORTS:** Link, auth/theme hooks, PageHeading, Icon.  
**WHAT IT EXPORTS:** Default `Profile`.  
**IMPORTANT CODE:** Guest/customer conditional rendering and pressed light/dark buttons.  
**WHY THAT CODE EXISTS:** Profile remains useful before login and on mobile where the header theme button is hidden.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Profile UI and mobile-accessible theme choice.  
**SIMPLE STUDENT EXPLANATION:** “This page shows my demo identity and lets me change the appearance.”

### Cart

**FILE: `src/cart/cartReducer.js`**  
**PURPOSE:** Cart transitions and pure calculations.  
**WHY IT EXISTS:** Centralize testable cart rules.  
**WHAT IT IMPORTS:** Nothing.  
**WHAT IT EXPORTS:** `MAX_QUANTITY`, `cartSubtotal`, `cartCount`, `validCart`, `cartReducer`, `reconcileCart`.  
**IMPORTANT CODE:** Immutable add/quantity/remove/clear/replace cases; 1–99 bounds; matching-ID merge; reconciliation with current dishes.  
**WHY THAT CODE EXISTS:** Prevent invalid quantities, duplicate lines, and stale reorder prices.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Cart behavior, totals, initialization filtering, and checkout/reorder reconciliation.  
**SIMPLE STUDENT EXPLANATION:** “Given a cart and an action, this file calculates the next cart.”

**FILE: `src/cart/CartProvider.jsx`**  
**PURPOSE:** Own and expose the shared cart.  
**WHY IT EXISTS:** Cards, details, header, checkout, history, and cart all use it.  
**WHAT IT IMPORTS:** Context/effect/reducer/state hooks, reducer helpers, storage.  
**WHAT IT EXPORTS:** `CartProvider`, `useCart`.  
**IMPORTANT CODE:** `useReducer` lazy initialization, persistence effect, action wrappers, derived count/subtotal.  
**WHY THAT CODE EXISTS:** One shared cart with explicit operations and persistence warnings.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Cross-page cart consistency and persistence integration.  
**SIMPLE STUDENT EXPLANATION:** “This provider owns the basket; the reducer owns its change rules.”

**FILE: `src/cart/Cart.jsx`**  
**PURPOSE:** Review items, edit quantities, remove lines, estimate delivery.  
**WHY IT EXISTS:** Let users inspect the order before checkout.  
**WHAT IT IMPORTS:** Link/state, cart, quantity UI, feedback, format/delivery helpers, Icon, toast.  
**WHAT IT EXPORTS:** Default `Cart`.  
**IMPORTANT CODE:** Local area defaults to Bole; fee/total derived; checkout Link passes `{ area }`.  
**WHY THAT CODE EXISTS:** Keep temporary delivery selection local while carrying it into checkout.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Cart review/edit screen and area handoff.  
**SIMPLE STUDENT EXPLANATION:** “This is the basket review page, including a delivery estimate.”

**FILE: `src/cart/QuantityControl.jsx`**  
**PURPOSE:** Shared increase/decrease controls.  
**WHY IT EXISTS:** Details and cart need identical quantity interaction.  
**WHAT IT IMPORTS:** Icon, `MAX_QUANTITY`.  
**WHAT IT EXPORTS:** Default `QuantityControl`.  
**IMPORTANT CODE:** `quantity` and `onChange` props; disabled bounds; accessible labels/live quantity.  
**WHY THAT CODE EXISTS:** The parent owns the value; the reusable child reports requested changes.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Consistent quantity controls on both screens.  
**SIMPLE STUDENT EXPLANATION:** “It displays a quantity and asks its parent to change it.”

### Checkout

**FILE: `src/checkout/validate.js`**  
**PURPOSE:** Pure customer and checkout validation.  
**WHY IT EXISTS:** Login and checkout share identity rules.  
**WHAT IT IMPORTS:** `deliveryAreas`.  
**WHAT IT EXPORTS:** `normalizePhone`, `validateCustomer`, `validateCheckout`.  
**IMPORTANT CODE:** Unicode-letter/name check; normalized Ethiopian phone regex; own-property area check; 500-character notes limit.  
**WHY THAT CODE EXISTS:** Return field-specific errors without depending on a component.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Consistent sign-in/checkout validation and normalization.  
**SIMPLE STUDENT EXPLANATION:** “It checks the form and returns an object describing mistakes.”

**FILE: `src/checkout/Checkout.jsx`**  
**PURPOSE:** Validate and place a demo order.  
**WHY IT EXISTS:** Coordinate identity, form, current menu, cart, and order storage.  
**WHAT IT IMPORTS:** Ref/state, Link/location, cart/auth/orders hooks, menu service, cart helpers, validation/delivery/format helpers, feedback/Icon/confirmation.  
**WHAT IT EXPORTS:** Default `Checkout`.  
**IMPORTANT CODE:** Controlled fields; submission ref lock; current-menu reconciliation; review-required branch; `placeOrder`; confirmation then cart clear.  
**WHY THAT CODE EXISTS:** Avoid accepting old prices, unavailable items, invalid fields, or failed persistence as success.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** The order-placement workflow.  
**SIMPLE STUDENT EXPLANATION:** “Checkout checks the form and latest menu, saves an order, then empties the cart.”

**FILE: `src/checkout/OrderConfirmation.jsx`**  
**PURPOSE:** Display a successfully saved order.  
**WHY IT EXISTS:** Give a clear completion view and history link.  
**WHAT IT IMPORTS:** Link, Icon, currency formatter, `orderNumber`.  
**WHAT IT EXPORTS:** Default `OrderConfirmation`.  
**IMPORTANT CODE:** Reads the supplied `order` prop for number, total, area, and estimate.  
**WHY THAT CODE EXISTS:** Display the accepted snapshot rather than the now-empty cart.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Success feedback after checkout.  
**SIMPLE STUDENT EXPLANATION:** “This is a receipt-like view of the order just saved.”

### Favorites and orders

**FILE: `src/favorites/FavoritesProvider.jsx`**  
**PURPOSE:** Shared persistent favorite IDs.  
**WHY IT EXISTS:** Hearts and the favorites page must agree.  
**WHAT IT IMPORTS:** Context hooks and `usePersistentState`.  
**WHAT IT EXPORTS:** `FavoritesProvider`, `useFavorites`.  
**IMPORTANT CODE:** Validate a string array; toggle using includes/filter/spread.  
**WHY THAT CODE EXISTS:** Store references without duplicating menu details.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Shared/persistent favorites.  
**SIMPLE STUDENT EXPLANATION:** “It remembers which dish IDs I have saved.”

**FILE: `src/favorites/FavoriteButton.jsx`**  
**PURPOSE:** Reusable save/unsave heart.  
**WHY IT EXISTS:** Cards and detail pages share this action.  
**WHAT IT IMPORTS:** Favorites hook, toast hook, Icon.  
**WHAT IT EXPORTS:** Default `FavoriteButton`.  
**IMPORTANT CODE:** Derive saved membership; `aria-pressed`; check toggle's success before the toast.  
**WHY THAT CODE EXISTS:** Present the real saved state and report storage failure.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** The shared favorite action UI.  
**SIMPLE STUDENT EXPLANATION:** “The heart changes whether this dish ID is saved.”

**FILE: `src/favorites/Favorites.jsx`**  
**PURPOSE:** Show saved dishes that still exist.  
**WHY IT EXISTS:** Turn saved IDs into useful current menu cards.  
**WHAT IT IMPORTS:** Dishes/favorites hooks, DishCard, feedback.  
**WHAT IT EXPORTS:** Default `Favorites`.  
**IMPORTANT CODE:** `dishes.filter(dish => ids.includes(dish.id))`.  
**WHY THAT CODE EXISTS:** Reflect current details and omit deleted dishes. Stale IDs themselves are not automatically removed.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** The saved-dishes page.  
**SIMPLE STUDENT EXPLANATION:** “It joins my saved IDs with today's local menu.”

**FILE: `src/orders/OrdersProvider.jsx`**  
**PURPOSE:** Own shared order snapshots and mutations.  
**WHY IT EXISTS:** Customer history and admin views use the same order collection.  
**WHAT IT IMPORTS:** Context hooks and persistence hook.  
**WHAT IT EXPORTS:** `statuses`, `OrdersProvider`, `useOrders`, `orderNumber`; stored-order validator is internal.  
**IMPORTANT CODE:** UUID/time/pending status creation; prepend after successful storage; next-status-only condition; delete by ID.  
**WHY THAT CODE EXISTS:** Keep placement/status rules centralized and preserve historical details.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Order creation/history/admin synchronization.  
**SIMPLE STUDENT EXPLANATION:** “This is the shared local order book.”

**FILE: `src/orders/OrderHistory.jsx`**  
**PURPOSE:** Customer history, filters, details, and reorder.  
**WHY IT EXISTS:** Let customers revisit earlier orders.  
**WHAT IT IMPORTS:** State/navigation, orders/auth/cart hooks, menu service, reconciliation, formatters, feedback/toast/Icon/Modal.  
**WHAT IT EXPORTS:** Default `OrderHistory`.  
**IMPORTANT CODE:** Customer-ID filter; All/Active/Delivered filter; current-menu reorder; pending replacement modal.  
**WHY THAT CODE EXISTS:** Present the relevant history and avoid silently replacing a nonempty cart.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Customer history and reorder UI.  
**SIMPLE STUDENT EXPLANATION:** “It shows my old orders and rebuilds a new cart using current dishes.”

### Menu screens

**FILE: `src/menu/Home.jsx`**  
**PURPOSE:** Landing page and highlighted dishes.  
**WHY IT EXISTS:** Provide an entry point into menu browsing.  
**WHAT IT IMPORTS:** Link, dishes hook, CategoryBar, DishCard, feedback, Icon.  
**WHAT IT EXPORTS:** Default `Home`.  
**IMPORTANT CODE:** Popular dishes first, nonpopular afterward, then `slice(0, 4)`; priority hero image.  
**WHY THAT CODE EXISTS:** Fill up to four highlights even if fewer than four are marked popular.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** The home experience and its menu entry points.  
**SIMPLE STUDENT EXPLANATION:** “Home introduces the app and highlights up to four menu items.”

**FILE: `src/menu/Menu.jsx`**  
**PURPOSE:** Searchable, category-filtered menu.  
**WHY IT EXISTS:** Own browsing controls and derived results.  
**WHAT IT IMPORTS:** `useMemo`, `useSearchParams`, dishes hook/categories, CategoryBar/DishCard/Icon/feedback.  
**WHAT IT EXPORTS:** Default `Menu`.  
**IMPORTANT CODE:** Read `q`/`category`; memoized combined filter; update URL while preserving the other parameter.  
**WHY THAT CODE EXISTS:** Reloadable/shareable filters, with search replacing history entries instead of adding one per keystroke.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Full menu search/filter screen.  
**SIMPLE STUDENT EXPLANATION:** “The URL stores my filters; the component calculates matching dishes.”

**FILE: `src/menu/CategoryBar.jsx`**  
**PURPOSE:** Reusable category navigation or selection.  
**WHY IT EXISTS:** Home and Menu need different interactions with the same categories.  
**WHAT IT IMPORTS:** Link and Icon.  
**WHAT IT EXPORTS:** Default `CategoryBar`.  
**IMPORTANT CODE:** If `onSelect` exists, render pressed-state buttons; otherwise render category links.  
**WHY THAT CODE EXISTS:** Let Menu own selected state while Home simply navigates.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Category controls on both pages.  
**SIMPLE STUDENT EXPLANATION:** “The same category strip can navigate or report a selection to its parent.”

**FILE: `src/menu/DishCard.jsx`**  
**PURPOSE:** Reusable dish summary with add/favorite actions.  
**WHY IT EXISTS:** Home, Menu, and Favorites share a card.  
**WHAT IT IMPORTS:** `memo`, Link, cart/toast hooks, FavoriteButton, FoodImage, Icon, formatter.  
**WHAT IT EXPORTS:** Default memoized `DishCard`.  
**IMPORTANT CODE:** `dish` prop; cart quantity lookup; lazy image; disable Add at 99; toast after add.  
**WHY THAT CODE EXISTS:** Show consistent information and bounds without duplicate card implementations.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Dish listings and their inline actions.  
**SIMPLE STUDENT EXPLANATION:** “One dish object becomes one reusable food card.”

**FILE: `src/menu/DishDetails.jsx`**  
**PURPOSE:** Detail screen for a URL-selected dish.  
**WHY IT EXISTS:** Show more than a summary card and allow multi-quantity adding.  
**WHAT IT IMPORTS:** State, Link/params, dishes/cart/toast hooks, QuantityControl/FavoriteButton/feedback/formatter/Icon.  
**WHAT IT EXPORTS:** Default `DishDetails`.  
**IMPORTANT CODE:** `useParams().id`, dish lookup, local quantity, missing-dish branch, combined existing/new quantity cap.  
**WHY THAT CODE EXISTS:** One component handles all dish IDs safely.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Dynamic details and quantity-before-add interaction.  
**SIMPLE STUDENT EXPLANATION:** “The ID in the URL tells this page which dish to display.”

### Theme, UI, and utilities

**FILE: `src/theme/ThemeContext.jsx`**  
**PURPOSE:** Shared persisted light/dark preference.  
**WHY IT EXISTS:** Customer and admin screens must use one theme.  
**WHAT IT IMPORTS:** Context/effect hooks, persistence hook.  
**WHAT IT EXPORTS:** `ThemeProvider`, `useTheme`.  
**IMPORTANT CODE:** Validate dark/light; effect sets root `data-theme` and `style.colorScheme`.  
**WHY THAT CODE EXISTS:** Synchronize React preference with CSS/native control appearance.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Theme switching and restoration.  
**SIMPLE STUDENT EXPLANATION:** “It saves the selected theme and tells the document which colors to use.”

**FILE: `src/ui/Feedback.jsx`**  
**PURPOSE:** Common feedback and form/image presentation.  
**WHY IT EXISTS:** Reuse loading, errors, empty states, headings, labels, and image fallback.  
**WHAT IT IMPORTS:** Link and Icon.  
**WHAT IT EXPORTS:** `Loading`, `EmptyState`, `ErrorState`, `PageHeading`, `Field`, `FoodImage`.  
**IMPORTANT CODE:** Status/alert roles; label/error ID associations; optional recovery actions; fallback image with loop guard.  
**WHY THAT CODE EXISTS:** Make pages consistent and reduce repeated accessibility wiring. Custom Field children must supply their own control attributes, as current callers do.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Shared feedback/forms/images throughout the app.  
**SIMPLE STUDENT EXPLANATION:** “This is a small toolbox of UI pieces many pages need.”

**FILE: `src/ui/Modal.jsx`**  
**PURPOSE:** Reusable keyboard-operable dialog shell.  
**WHY IT EXISTS:** Navigation, editing, details, and confirmations need modal behavior.  
**WHAT IT IMPORTS:** Effect/ID/ref hooks, `createPortal`, Icon.  
**WHAT IT EXPORTS:** Default `Modal`.  
**IMPORTANT CODE:** Portal to body, `showModal`, `useId`, Escape callback, Tab loop, cleanup restoring focus/scroll.  
**WHY THAT CODE EXISTS:** Separate dialog placement from layout while retaining React ownership and accessible interaction.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Shared modal presentation and keyboard lifecycle.  
**SIMPLE STUDENT EXPLANATION:** “The parent decides whether it is open; Modal handles how the dialog behaves.”

**FILE: `src/ui/ToastProvider.jsx`**  
**PURPOSE:** Shared short-lived notifications.  
**WHY IT EXISTS:** Feature actions need unobtrusive confirmation.  
**WHAT IT IMPORTS:** Context/callback/effect/ref/state hooks and Icon.  
**WHAT IT EXPORTS:** `ToastProvider`, `useToast`.  
**IMPORTANT CODE:** Stable notify callback, timer ref, 3500ms timeout, cleanup, polite live region.  
**WHY THAT CODE EXISTS:** A new message replaces the old timer; unmount leaves no active timer.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Global action feedback.  
**SIMPLE STUDENT EXPLANATION:** “Any page can ask it to briefly display a message.”

**FILE: `src/ui/ErrorBoundary.jsx`**  
**PURPOSE:** Recover the route UI after a descendant rendering failure.  
**WHY IT EXISTS:** Avoid an entirely blank page for those failures.  
**WHAT IT IMPORTS:** React `Component`.  
**WHAT IT EXPORTS:** Default `ErrorBoundary` class.  
**IMPORTANT CODE:** `getDerivedStateFromError`, `failed` state, reload/home fallback.  
**WHY THAT CODE EXISTS:** A class error-boundary lifecycle switches to recovery content.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Route-level render-failure fallback.  
**SIMPLE STUDENT EXPLANATION:** “It catches a crashed child render; fetch and click errors still need their own handling.”

**FILE: `src/ui/Icon.jsx`**  
**PURPOSE:** Local SVG icon set.  
**WHY IT EXISTS:** Consistent icons without another package.  
**WHAT IT IMPORTS:** Nothing.  
**WHAT IT EXPORTS:** Default `Icon`.  
**IMPORTANT CODE:** Name-to-path map, default size, currentColor, default decorative `aria-hidden`.  
**WHY THAT CODE EXISTS:** Reuse vector paths and inherit the current theme color.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Icons across customer/admin UI.  
**SIMPLE STUDENT EXPLANATION:** “Give it an icon name and it draws the matching SVG.”

**FILE: `src/utils/storage.js`**  
**PURPOSE:** Safe JSON storage reads/writes.  
**WHY IT EXISTS:** Storage access and parsing can throw.  
**WHAT IT IMPORTS:** Nothing.  
**WHAT IT EXPORTS:** `readStorage`, `writeStorage`.  
**IMPORTANT CODE:** Optional session flag; try/catch; fallback on read; boolean on write.  
**WHY THAT CODE EXISTS:** Callers can recover from missing/broken/unavailable storage.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** The common persistence abstraction.  
**SIMPLE STUDENT EXPLANATION:** “It converts objects to JSON and safely talks to browser storage.”

**FILE: `src/utils/deliveryEstimate.js`**  
**PURPOSE:** Static area-to-fee/time rules.  
**WHY IT EXISTS:** Cart, checkout, and validation need the same allowed areas.  
**WHAT IT IMPORTS:** Nothing.  
**WHAT IT EXPORTS:** `deliveryAreas`, `deliveryEstimate`.  
**IMPORTANT CODE:** Six-area mapping and `Object.hasOwn` lookup; unknown area returns null.  
**WHY THAT CODE EXISTS:** Derive consistent estimates and reject unsupported names.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Area options, validation, fee/time calculation.  
**SIMPLE STUDENT EXPLANATION:** “It looks up a sample fee and time range for the chosen area.”

**FILE: `src/utils/formatCurrency.js`**  
**PURPOSE:** Consistent ETB and date display.  
**WHY IT EXISTS:** Many pages show prices and order dates.  
**WHAT IT IMPORTS:** Nothing.  
**WHAT IT EXPORTS:** `formatCurrency`, `formatDate`.  
**IMPORTANT CODE:** Reused `Intl.NumberFormat("en-ET")`, ETB suffix, `Intl.DateTimeFormat`.  
**WHY THAT CODE EXISTS:** Format numbers/dates without changing calculation values.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Consistent readable price/date formatting.  
**SIMPLE STUDENT EXPLANATION:** “It changes how a value is shown, not what the value means.”

### Admin

**FILE: `src/admin/AdminLogin.jsx`**  
**PURPOSE:** Admin demo login page.  
**WHY IT EXISTS:** Separate the admin entry flow from customer sign-in.  
**WHAT IT IMPORTS:** State, router navigation, auth, Icon, Field.  
**WHAT IT EXPORTS:** Default `AdminLogin`.  
**IMPORTANT CODE:** Controlled username/password; visibility toggle; allowlisted return path; `adminSignIn`.  
**WHY THAT CODE EXISTS:** Provide demo access and continue to the requested admin screen.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Admin login UI.  
**SIMPLE STUDENT EXPLANATION:** “This form checks the advertised demo credentials through the auth provider.”

**FILE: `src/admin/AdminLayout.jsx`**  
**PURPOSE:** Shared admin workspace shell.  
**WHY IT EXISTS:** Admin pages need their own navigation and layout.  
**WHAT IT IMPORTS:** NavLink/Outlet/Link/navigation, auth/theme, Icon.  
**WHAT IT EXPORTS:** Default `AdminLayout`.  
**IMPORTANT CODE:** Nested Outlet, active navigation, admin logout and theme toggle.  
**WHY THAT CODE EXISTS:** Share workspace controls across management pages.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Admin navigation/shell/outlet.  
**SIMPLE STUDENT EXPLANATION:** “It is the admin version of the customer layout.”

**FILE: `src/admin/DishManager.jsx`**  
**PURPOSE:** Search, list, add/edit, and delete menu dishes.  
**WHY IT EXISTS:** Own the administration workflow and modal selection.  
**WHAT IT IMPORTS:** State, dishes hook/delete service, feedback/format/Icon/Modal/DishForm/toast.  
**WHAT IT EXPORTS:** Default `DishManager`.  
**IMPORTANT CODE:** Local search; `editing`/`deleting`; shared DishForm; confirmed asynchronous deletion.  
**WHY THAT CODE EXISTS:** Keep list state outside the reusable editor and report write failures.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Menu-management screen.  
**SIMPLE STUDENT EXPLANATION:** “This screen chooses which dish to manage; the form handles its fields.”

**FILE: `src/admin/DishForm.jsx`**  
**PURPOSE:** Add/edit dish form with image selection.  
**WHY IT EXISTS:** Reuse one editor for new and existing dishes.  
**WHAT IT IMPORTS:** Ref/state, categories/save service, Field/FoodImage/Icon.  
**WHAT IT EXPORTS:** Default `DishForm`.  
**IMPORTANT CODE:** Prefilled controlled fields; validation; FileReader data URL; UUID for new dish; numeric conversion/price rounding; ingredient deduplication.  
**WHY THAT CODE EXISTS:** Convert input strings into the menu's expected data shape before saving.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Dish add/edit/upload UI.  
**SIMPLE STUDENT EXPLANATION:** “It collects dish details, checks them, and saves a clean dish object.”

**FILE: `src/admin/OrderManager.jsx`**  
**PURPOSE:** Search/filter/view/update/delete orders.  
**WHY IT EXISTS:** Admin needs all local orders rather than one customer's history.  
**WHAT IT IMPORTS:** State, order hooks/constants/number helper, feedback/formatters/Modal/Icon/toast.  
**WHAT IT EXPORTS:** Default `OrderManager`.  
**IMPORTANT CODE:** Search number/name/phone; status filter; selected ID resolves current order; next-status button; confirmed deletion.  
**WHY THAT CODE EXISTS:** Keep details current after status changes and make deletion explicit.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Admin order-management workflow.  
**SIMPLE STUDENT EXPLANATION:** “It manages locally saved orders and manually advances their status.”

**FILE: `src/admin/analytics.js`**  
**PURPOSE:** Pure summary calculations over orders.  
**WHY IT EXISTS:** Separate arithmetic from dashboard presentation and allow unit tests.  
**WHAT IT IMPORTS:** Nothing.  
**WHAT IT EXPORTS:** `orderAnalytics`.  
**IMPORTANT CODE:** Reduce order value; count statuses; Map by dish ID; sum quantities/item value; sort top five.  
**WHY THAT CODE EXISTS:** Derive statistics from actual saved orders without duplicate stored statistics.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Shared dashboard aggregate calculations.  
**SIMPLE STUDENT EXPLANATION:** “It turns the order list into counts, totals, and top dishes.”

**FILE: `src/admin/Dashboard.jsx`**  
**PURPOSE:** Overview and analytics presentation.  
**WHY IT EXISTS:** Show the results of local order activity.  
**WHAT IT IMPORTS:** Link, orders/dishes hooks, analytics, formatters, feedback, Icon.  
**WHAT IT EXPORTS:** Default `Dashboard`.  
**IMPORTANT CODE:** Derived stats, last-seven-day values, SVG graph, status bars, top dishes, four recent orders.  
**WHY THAT CODE EXISTS:** Visualize the shared data without a chart package or fake sales feed.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Both overview and analytics route displays.  
**SIMPLE STUDENT EXPLANATION:** “The dashboard summarizes orders saved in this browser.”

### Styles, assets, configuration, tests, and existing documents

**FILE: `src/theme/index.css`**  
**PURPOSE:** Global theme tokens, base styles, customer shell/menu/detail styles and responsive/accessibility rules.  
**WHY IT EXISTS:** Style the app consistently.  
**WHAT IT IMPORTS:** `components.css`, `admin.css`.  
**WHAT IT EXPORTS:** CSS rules, not JavaScript exports.  
**IMPORTANT CODE:** Root variables/light overrides, grids, media queries, focus/skip/reduced-motion rules.  
**WHY THAT CODE EXISTS:** One theme vocabulary and layouts for different screens.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Most styling and imported styles.  
**SIMPLE STUDENT EXPLANATION:** “This stylesheet defines the app's appearance and responsive customer layout.”

**FILE: `src/theme/components.css`**  
**PURPOSE:** Shared controls, forms, cart/checkout/profile/history/confirmation, modal and toast styles.  
**WHY IT EXISTS:** Group common component/page styling.  
**WHAT IT IMPORTS:** Nothing; consumes CSS variables from the main stylesheet.  
**WHAT IT EXPORTS:** CSS rules.  
**IMPORTANT CODE:** Checkout columns, summary positioning, dialog/backdrop styles, mobile stacking.  
**WHY THAT CODE EXISTS:** Keep reusable pieces consistent across pages.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Those components' visual layouts and feedback presentation.  
**SIMPLE STUDENT EXPLANATION:** “It styles the reusable controls and the ordering screens.”

**FILE: `src/theme/admin.css`**  
**PURPOSE:** Workspace, login, management rows, dashboard and chart styling.  
**WHY IT EXISTS:** Admin has a different layout but shares theme tokens.  
**WHAT IT IMPORTS:** Nothing.  
**WHAT IT EXPORTS:** CSS rules.  
**IMPORTANT CODE:** Sidebar/content grid, status colors, chart styles, 1100/760px adaptations.  
**WHY THAT CODE EXISTS:** Make management usable across viewport sizes.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Admin visual organization/responsive layout.  
**SIMPLE STUDENT EXPLANATION:** “It gives the admin workspace its layout.”

**FILE: `index.html`**  
**PURPOSE:** Browser document entry.  
**WHY IT EXISTS:** React needs a root element and module script.  
**WHAT IT IMPORTS:** Loads `/src/main.jsx` as a module.  
**WHAT IT EXPORTS:** HTML document.  
**IMPORTANT CODE:** `lang="en"`, viewport/meta information, `#root`.  
**WHY THAT CODE EXISTS:** Mounting, mobile viewport, and document metadata.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** The app entry document.  
**SIMPLE STUDENT EXPLANATION:** “It is the HTML container React fills.”

**FILE: `public/menu-data.json`**  
**PURPOSE:** Five-dish seed data.  
**WHY IT EXISTS:** Provide an initial fetchable menu without a backend.  
**WHAT IT IMPORTS:** Nothing; image fields reference local asset paths.  
**WHAT IT EXPORTS:** JSON array over HTTP, not a JS export.  
**IMPORTANT CODE:** Stable IDs, price/category/ingredients/image and sample metadata.  
**WHY THAT CODE EXISTS:** Match the local dish model.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Fresh menu initialization and seed-dependent tests; valid previously saved menus could still load.  
**SIMPLE STUDENT EXPLANATION:** “It supplies the starting menu.”

**FILE: `public/images/*` and `public/image-credits.html`**  
**PURPOSE:** Food photographs, fallback SVG, and attribution page.  
**WHY IT EXISTS:** Supply local visuals and documented image sources.  
**WHAT IT IMPORTS:** No JS imports; credits contain external attribution links.  
**WHAT IT EXPORTS:** Static assets/document.  
**IMPORTANT CODE:** Fallback SVG and image URLs referenced by components/seed data.  
**WHY THAT CODE EXISTS:** Stable local images and recovery when a dish image fails.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Photos/fallback or credits link; affected photo requests would fail.  
**SIMPLE STUDENT EXPLANATION:** “These are the pictures and their credits.”

**FILE: `package.json` and `package-lock.json`**  
**PURPOSE:** Package metadata, runnable scripts, dependency declarations and exact resolution.  
**WHY IT EXISTS:** Make installation and project commands repeatable.  
**WHAT IT IMPORTS:** Neither is a runtime import; npm reads them.  
**WHAT IT EXPORTS:** Configuration data.  
**IMPORTANT CODE:** dev/build/preview/test/test:e2e/format scripts; three runtime packages; lock entries.  
**WHY THAT CODE EXISTS:** Standardize development, testing, and dependency installation.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Scripts/dependency setup or reproducible installs.  
**SIMPLE STUDENT EXPLANATION:** “They describe what the project needs and how to run it.”

**FILE: `vite.config.js`**  
**PURPOSE:** Vite configuration.  
**WHY IT EXISTS:** Enable the React plugin.  
**WHAT IT IMPORTS:** `defineConfig` and `@vitejs/plugin-react`.  
**WHAT IT EXPORTS:** Default configuration.  
**IMPORTANT CODE:** `plugins: [react()]`.  
**WHY THAT CODE EXISTS:** Configure React development/build integration.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** The configured React plugin behavior would be lost.  
**SIMPLE STUDENT EXPLANATION:** “It tells Vite to use its React integration.”

**FILE: `playwright.config.js`**  
**PURPOSE:** E2E environment and server setup.  
**WHY IT EXISTS:** Browser tests need a predictable app URL and browser.  
**WHAT IT IMPORTS:** Playwright `defineConfig`.  
**WHAT IT EXPORTS:** Default configuration.  
**IMPORTANT CODE:** Headless installed Edge, one worker, 1440×1000 default viewport, localhost:5173 server, failure screenshots/traces.  
**WHY THAT CODE EXISTS:** Run real-browser checks and retain debugging evidence.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Configured browser/server/test behavior.  
**SIMPLE STUDENT EXPLANATION:** “It prepares the browser and app server for our automated demo checks.”

**FILE: `tests/domain.test.js`**  
**PURPOSE:** Six pure business-rule tests.  
**WHY IT EXISTS:** Catch arithmetic, validation, quantity, reorder, and analytics regressions.  
**WHAT IT IMPORTS:** Node test/assert, cart helpers, validation, delivery helper, analytics.  
**WHAT IT EXPORTS:** No application exports; registers tests.  
**IMPORTANT CODE:** Assertions for valid/invalid inputs and immutable reconciliation.  
**WHY THAT CODE EXISTS:** Verify rules without launching React or a browser.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** `npm test` target and that regression coverage; app runtime would remain.  
**SIMPLE STUDENT EXPLANATION:** “These tests check the calculations and rules directly.”

**FILE: `tests/e2e/app.spec.js`**  
**PURPOSE:** Sixteen customer/admin/browser scenarios.  
**WHY IT EXISTS:** Verify complete flows and failure handling across components.  
**WHAT IT IMPORTS:** Playwright test/expect, Node filesystem/URL helpers, seed JSON through file reading.  
**WHAT IT EXPORTS:** Test registrations.  
**IMPORTANT CODE:** Real interactions; storage/network/render failure injection; keyboard/viewport assertions.  
**WHY THAT CODE EXISTS:** Unit tests alone cannot prove routing, forms, and persistence integrate correctly.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Main E2E regression coverage.  
**SIMPLE STUDENT EXPLANATION:** “It uses the application like a customer or admin would.”

**FILE: `tests/e2e/performance.spec.js`**  
**PURPOSE:** Development profiling plus tablet/theme/spice checks.  
**WHY IT EXISTS:** Collect render evidence without production instrumentation.  
**WHAT IT IMPORTS:** Playwright and Node `writeFileSync`.  
**WHAT IT EXPORTS:** Two test registrations.  
**IMPORTANT CODE:** Intercept main module, wrap App in Profiler, collect samples and artifact.  
**WHY THAT CODE EXISTS:** Observe menu/search/cart render commits in this test environment.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Profiling and its additional browser coverage; normal app unaffected.  
**SIMPLE STUDENT EXPLANATION:** “This test measures development renders; it is not a production speed guarantee.”

**FILE: `.gitignore` and `.prettierignore`**  
**PURPOSE:** Exclude generated/dependency output from version control or formatting.  
**WHY IT EXISTS:** Keep authored changes separate from generated files.  
**WHAT IT IMPORTS:** Nothing.  
**WHAT IT EXPORTS:** Ignore patterns.  
**IMPORTANT CODE:** node_modules/dist/test-results/playwright-report exclusions; formatter also excludes lockfile.  
**WHY THAT CODE EXISTS:** Avoid tracking/rewriting bulky generated content.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Repository/formatting hygiene, not the runtime UI.  
**SIMPLE STUDENT EXPLANATION:** “They tell tools which generated files to leave alone.”

**FILE: `README.md`, `docs/PROJECT_PLAN.md`, `docs/REQUIREMENTS.md`, `docs/MILESTONES.md`, `docs/VERIFICATION.md`, `docs/PRESENTATION.md`**  
**PURPOSE:** Respectively: run instructions; implementation plan; requirement mapping; milestone review; dated verification evidence; existing presentation/viva notes.  
**WHY IT EXISTS:** Explain scope, traceability, usage, and learning decisions.  
**WHAT IT IMPORTS:** No runtime modules; documents link to other project material.  
**WHAT IT EXPORTS:** Human-readable documentation.  
**IMPORTANT CODE:** None; route/state/testing/limitation descriptions are the important content.  
**WHY THAT CODE EXISTS:** Help another student/reviewer understand and reproduce the project.  
**WHAT WOULD BREAK IF IT WERE REMOVED:** Documentation/traceability, not application execution.  
**SIMPLE STUDENT EXPLANATION:** “These explain how we planned, built, checked, and demonstrate the app.”

Generated `dist`, `test-results`, and installed `node_modules` are outputs, not additional business-logic modules to memorize. The new guide itself also has no runtime role.

## 3. Final state ownership table

| State | Where it lives | Who uses it | Why it lives there | Persistent? | Derived? |
| --- | --- | --- | --- | --- | --- |
| Cart lines | CartProvider/useReducer | Cards, details, cart, checkout, history, Layout | One basket across routes | localStorage via effect | No |
| Customer/admin auth | AuthProvider/useState | Guards, login, profile, layouts, checkout, history | Shared demo identity/access | sessionStorage | No |
| Favorite IDs | FavoritesProvider/usePersistentState | Hearts and Favorites | Shared saved membership | localStorage | No |
| Orders | OrdersProvider/usePersistentState | Checkout, history, dashboard, order manager | Shared historical collection | localStorage | No; snapshots contain calculated values |
| Theme | ThemeProvider/usePersistentState | Layout, Profile, AdminLayout, document CSS | Whole-app preference | localStorage | No |
| Customer search | URL `q`, read by Menu | Search input/results | Belongs to menu browsing; reload/share URL | URL, not storage | Value comes from URL |
| Admin searches | DishManager/OrderManager useState | Respective page | Temporary page controls | No | No |
| Category | URL `category` | Menu/CategoryBar | Linkable category and browser navigation | URL, not storage | Value comes from URL |
| Checkout fields | Checkout useState | Form, validation, summary | Temporary draft for this page | No dedicated saved draft | No |
| Modal state | Owning screen: menuOpen/editing/deleting/pending/selectedId | Layout/history/admin | Only that workflow needs visibility/selection | No | Selected order is derived from selectedId |
| Detail quantity | DishDetails useState | QuantityControl/Add button | Quantity to add before cart commit | No | No |
| Cart quantity | Each reducer line | Cart/QuantityControl/cards | Part of actual basket | localStorage with cart | No |
| Cart delivery area | Cart useState, default Bole | Cart summary; passed in router state | Temporary estimate/handoff | No dedicated storage | No |
| Checkout delivery area | Checkout `values.area` | Form and summary | One form field determines fee/time | No draft persistence | No |
| Delivery fee | `deliveryEstimate(area).fee` | Cart/Checkout | Deterministic lookup | Stored only in completed order snapshot | Yes while checking out |
| Delivery estimate | `deliveryEstimate(area).estimate` | Cart/Checkout | Same selected area rule | Stored only in order snapshot | Yes while checking out |
| Cart badge | `cartCount(items)` | Layout | Sum actual item quantities | Recomputed from persisted cart | Yes |
| Cart subtotal | `cartSubtotal(items)` | Cart/Checkout | Avoid duplicate totals state | Recomputed; order copies accepted subtotal | Yes |
| Total | Subtotal + chosen fee | Summaries | Both inputs already exist | Order stores accepted total | Yes before order creation |
| Menu resource state | Separate useDishes call per screen | Home/Menu/details/favorites/admin | Loading/errors belong to each consumer | Menu data persisted by service; flags not persisted | No |
| Filtered dishes/orders | Render calculations; Menu uses useMemo | Lists | Calculable from data and controls | No | Yes |
| Checkout busy/error/order | Checkout useState | Submit UI/confirmation | Current operation feedback | No; order collection separately saved | No |
| Submission lock | Checkout ref | Submit handler | Synchronous lock without needing a render | No | No |
| Toast message/timer | ToastProvider state/ref | Shared notifications | One notification area | No | No |
| Dashboard statistics | analytics helper + Dashboard calculations | Admin dashboard | Always reflect saved orders | No separate statistics store | Yes |

Key distinction: `QuantityControl` and `CategoryBar` do not own the values they edit. Their parents/providers own those values and pass callbacks down.

## 4. Data flow, step by step

### A. Menu loading

`Page mounts → useDishes effect → getDishes → valid saved menu OR fetch JSON → validate → save seed → hook state → cards`

The page shows Loading while waiting. Failure sets an error, and Retry increments the hook's version to rerun loading. Cleanup cancels fetch work and ignores obsolete completion.

### B. Customer search

`Typing → onChange → update("q", text) → URL parameter → Menu rerender → memoized local filter → result cards/count`

It searches combined dish name, description, and ingredients, ignoring case and outer query whitespace. It does not send a search request. Search URL edits replace the current history entry.

### C. Category filtering

`Category button → onSelect → update("category", value) → URL → category AND search filter → results`

All removes the category parameter. Choosing a category preserves `q`. Home category links navigate to a matching menu URL. Unknown categories show an “Unknown category” heading and no matches; Clear filters resets both.

### D. Dish details

`Card Link → /menu/:id → useParams → useDishes → find matching ID → details or missing-dish recovery`

The page displays price, ingredients, sample preparation/rating/spice details, favorite action, and a locally controlled quantity.

### E. Add to cart

`Add click → cart.add(dish, quantity) → dispatch add → reducer merges matching ID/caps at 99 → provider rerender → badge/subtotal update → persistence effect`

Cards add one; details adds the chosen amount. UI feedback uses a toast. A storage warning means the in-memory change may not survive refresh.

### F. Update quantity

`+ / − → QuantityControl onChange → cart.setQuantity → quantity action → validated immutable line update → recalculated total/badge → storage effect`

The minimum is one. Decreasing to zero is not removal; the Remove action is separate.

### G. Checkout

`Cart area selection → Link to /checkout with state → RequireAuth → login if needed → restore destination/area → controlled form`

Name/phone start from the customer. Area comes from navigation state or starts empty. Field changes update values and clear that field's previous error. Fee/time are derived from area. An empty cart shows a recovery state.

### H. Order creation

`Submit → prevent default → reject overlapping submission → validate → focus invalid field OR lock/busy → get current menu → reconcile → calculate → placeOrder → save succeeds → confirmation + cart.clear`

If dishes disappeared or prices changed, checkout replaces the cart with reconciled items and asks for review; no order is created by that attempt. Name/description changes alone are not part of the price/availability review condition, but accepted items come from current menu data.

`placeOrder` creates a full UUID, pending status, timestamp, customer snapshot, item snapshots, subtotal, fee, total, and estimate. It saves before returning success. Failures are caught and displayed; `finally` releases busy/lock. This is not a server transaction or a durable idempotency guarantee.

### I. Favorites

`Heart click → toggle dish ID → storage write succeeds → Favorites Context changes → pressed heart + current-menu favorites list`

Only IDs are stored. Deleted dishes no longer appear in the Favorites list, even if their saved ID remains.

### J. Order history

`Protected /orders → current customer ID → filter shared orders by customerId → All/Active/Delivered filter → snapshot cards/details`

Active means any status other than delivered. Displayed old prices and names come from order snapshots, not a new menu lookup.

### K. Reorder

`Reorder click → fetch/read current menu → reconcile old items by ID → skip missing dishes/update current details and price → replace cart → /cart`

If all dishes are unavailable, show an error. If some are missing, notify the user. If the existing cart is nonempty, store proposed items locally and ask whether to replace it. Reorder does not immediately create an order; checkout is still required.

### L. Admin menu management

`Admin guard → DishManager → local search / editor modal → DishForm validation/conversion → saveDish → localStorage → change event → useDishes reload → updated list`

New dishes get UUIDs; edits retain their ID and existing rating. Uploads are read as data URLs after type/size checks. Deletion uses a confirmation modal, then `deleteDish` and the same event refresh. Past orders remain unchanged.

### M. Admin order management

`Admin guard → shared orders → local search/status filter → selectedId → current order details → next-status action OR confirmed delete → persistence succeeds → Context → history/dashboard/list update`

The provider accepts only the next status. Deletion removes that order from the shared collection; it consequently disappears from the customer's history and dashboard totals. No restaurant or courier receives a message.

## 5. React concepts actually used

Each entry includes a project example, an alternative, a reason the current approach fits, and a short answer to practise aloud. localStorage/sessionStorage are browser APIs used by React code, not React hooks.

### Components

**Where used:** All JSX files; DishCard is a clear reusable example.  
**What it does:** Describes one part of the interface.  
**Why Addis Eats needs it:** Separates pages, shared controls, and feature responsibilities.  
**Alternative:** One giant component or manually managed DOM.  
**Why current approach was chosen:** Smaller responsibilities are easier to reuse and understand.  
**Simple viva answer:** “A component is a reusable piece of our interface.”  
**Possible teacher follow-up:** Are all components functions?  
**Follow-up answer:** “Most are; ErrorBoundary is a class using an error lifecycle.”

### JSX

**Where used:** Component return values, such as Menu's list of DishCards.  
**What it does:** Expresses UI structure alongside JavaScript expressions.  
**Why Addis Eats needs it:** Makes dynamic food cards, forms, and conditional feedback readable.  
**Alternative:** Explicit `React.createElement` calls, actually used in the profiling test injection.  
**Why current approach was chosen:** JSX is clearer for application markup.  
**Simple viva answer:** “JSX lets me describe the UI with markup-like JavaScript syntax.”  
**Possible teacher follow-up:** Is JSX an HTML string?  
**Follow-up answer:** “No; the build transforms it into React element creation.”

### Props

**Where used:** `DishCard dish`, `QuantityControl quantity/onChange`, `Modal title/onClose`, `Dashboard analyticsOnly`.  
**What it does:** Passes inputs and callbacks from parent to child.  
**Why Addis Eats needs it:** Reuses components with different data and behavior.  
**Alternative:** Child-owned data loading or Context for genuinely shared data.  
**Why current approach was chosen:** Direct dependencies remain explicit.  
**Simple viva answer:** “Props are inputs supplied by a parent.”  
**Possible teacher follow-up:** Can QuantityControl change its prop directly?  
**Follow-up answer:** “No; it calls onChange so the owner updates the value.”

### State

**Where used:** Checkout fields, dialog selections, provider values, dish quantity.  
**What it does:** Remembers changing values between renders and schedules updates.  
**Why Addis Eats needs it:** User actions change what the interface displays.  
**Alternative:** A plain variable for nonpersistent calculations, or a ref for nonvisual mutable values.  
**Why current approach was chosen:** Values affecting the displayed UI need reactive updates.  
**Simple viva answer:** “State is a component's changing memory.”  
**Possible teacher follow-up:** Does setting state change the current render's variable immediately?  
**Follow-up answer:** “No; it requests another render with the new value.”

### Events

**Where used:** Add clicks, form submit, field changes, dialog cancel.  
**What it does:** Connects user actions to application logic.  
**Why Addis Eats needs it:** Users must be able to change quantities, submit, and navigate.  
**Alternative:** Direct DOM event registration; the menu-change hook does this for a window event.  
**Why current approach was chosen:** JSX handlers naturally connect component state and UI.  
**Simple viva answer:** “Handlers run when the user interacts with a control.”  
**Possible teacher follow-up:** Why `preventDefault()` on checkout submit?  
**Follow-up answer:** “To run our validation/order logic without the browser's default form navigation.”

### Controlled inputs

**Where used:** Checkout/Login/DishForm and search inputs.  
**What it does:** Supplies `value` or `checked` from React/URL state and updates it through handlers.  
**Why Addis Eats needs it:** Validation, summaries, and controls must agree.  
**Alternative:** Uncontrolled inputs read through refs or FormData.  
**Why current approach was chosen:** Live form data and derived delivery summaries are straightforward.  
**Simple viva answer:** “The displayed field value comes from our application state.”  
**Possible teacher follow-up:** Is the upload input controlled too?  
**Follow-up answer:** “No; the browser owns file selection, and our handler reads the chosen file.”

### Lifting state

**Where used:** QuantityControl delegates to DishDetails or CartProvider; CategoryBar delegates to Menu.  
**What it does:** Places the source of truth above the controls that use it.  
**Why Addis Eats needs it:** Changing a control must also update other dependent UI.  
**Alternative:** Independent child state, requiring synchronization.  
**Why current approach was chosen:** One owner avoids conflicting copies.  
**Simple viva answer:** “The parent owns the value and gives the child a callback.”  
**Possible teacher follow-up:** Is cart state just in the Cart page?  
**Follow-up answer:** “No; it is higher in CartProvider because several routes need it.”

### Lists and keys

**Where used:** Dish cards, cart lines, order cards, category controls, ingredients.  
**What it does:** Maps arrays into elements; keys identify siblings across updates.  
**Why Addis Eats needs it:** Dishes/orders can be added, removed, or filtered.  
**Alternative:** Index keys when positions are genuinely stable.  
**Why current approach was chosen:** Dish/order IDs preserve item identity. Some fixed chart positions use index keys.  
**Simple viva answer:** “Keys help React match the same item between renders.”  
**Possible teacher follow-up:** Does key arrive as a normal prop?  
**Follow-up answer:** “No; if the child needs an ID, pass it in its data or another prop.”

### Context

**Where used:** Auth, cart, favorites, orders, theme, and toast providers.  
**What it does:** Makes a value available to descendants without every intermediate component forwarding it.  
**Why Addis Eats needs it:** Distant screens share feature state/actions.  
**Alternative:** Props or an external store.  
**Why current approach was chosen:** This demo has manageable shared domains and needs no extra state dependency.  
**Simple viva answer:** “Context distributes our shared feature values.”  
**Possible teacher follow-up:** Does it persist or prevent rerenders?  
**Follow-up answer:** “No. Storage handles persistence, and consumers can rerender on context changes.”

### useReducer

**Where used:** CartProvider with cartReducer.  
**What it does:** Computes new state from previous state plus an action.  
**Why Addis Eats needs it:** Cart add/update/remove/clear/replace rules belong together.  
**Alternative:** useState with several updater functions.  
**Why current approach was chosen:** Named actions and pure tests make related transitions clear.  
**Simple viva answer:** “The reducer applies an action to calculate the next cart.”  
**Possible teacher follow-up:** Why not write storage inside the reducer?  
**Follow-up answer:** “The reducer stays pure; CartProvider's effect performs that side effect.”

### Custom hooks

**Where used:** useDishes/usePersistentState and useCart/useAuth/useOrders/useFavorites/useTheme/useToast.  
**What it does:** Reuses hook-based logic or wraps context access.  
**Why Addis Eats needs it:** Avoid duplicate loading/persistence implementations and raw context imports.  
**Alternative:** Repeat hooks inside each component.  
**Why current approach was chosen:** Common behavior gets one understandable interface.  
**Simple viva answer:** “Custom hooks reuse logic; Context provides shared state where needed.”  
**Possible teacher follow-up:** Do two useDishes calls own the same React state?  
**Follow-up answer:** “No; they separately read the same underlying menu service.”

### useEffect

**Where used:** Menu loading, cart storage, theme DOM updates, route title/scroll, Modal lifecycle, toast cleanup.  
**What it does:** Synchronizes with external systems after a commit and provides cleanup.  
**Why Addis Eats needs it:** Fetch/storage/document/dialog/timers exist outside rendering calculations.  
**Alternative:** Event handlers for user-triggered actions; direct calculation for derived values.  
**Why current approach was chosen:** These operations follow mounting or state changes.  
**Simple viva answer:** “Effects keep our React state synchronized with browser systems.”  
**Possible teacher follow-up:** Why cleanup?  
**Follow-up answer:** “To abort stale requests, remove listeners, clear timers, and restore focus/scroll.”

### useRef

**Where used:** Form/dialog DOM references, checkout submission lock, toast timer, persistence current-value reference.  
**What it does:** Keeps a mutable reference between renders without triggering a render.  
**Why Addis Eats needs it:** DOM access and immediate/nonvisual values should not be render state.  
**Alternative:** State when a change must update the UI.  
**Why current approach was chosen:** A submission guard must change synchronously, and timer IDs need no display.  
**Simple viva answer:** “A ref remembers something without causing a rerender.”  
**Possible teacher follow-up:** Why keep checkout busy state too?  
**Follow-up answer:** “Busy updates the button; the ref immediately blocks a second in-flight submit.”

### useMemo

**Where used:** Filtered dishes in Menu.  
**What it does:** Caches a calculation until one of its dependencies changes.  
**Why Addis Eats needs it:** Avoids repeating filtering on unrelated rerenders.  
**Alternative:** Calculate `dishes.filter(...)` directly on every render.  
**Why current approach was chosen:** Dependencies are explicit: dishes, category, search. For five dishes the practical saving may be small.  
**Simple viva answer:** “It reuses the filtered list while its inputs stay the same.”  
**Possible teacher follow-up:** Does it skip filtering when I type?  
**Follow-up answer:** “No; search changes, so filtering must run again.”

### useCallback

**Where used:** useDishes retry, usePersistentState update, ToastProvider notify.  
**What it does:** Preserves a function reference while dependencies stay unchanged.  
**Why Addis Eats needs it:** Stable dependencies/listeners and shared callback identity.  
**Alternative:** Create a function each render.  
**Why current approach was chosen:** These callbacks are reused by effects or consumers; not every handler needs it.  
**Simple viva answer:** “It keeps the same function identity; it does not cache the function's result.”  
**Possible teacher follow-up:** How can a stable retry change the latest version?  
**Follow-up answer:** “It uses a functional update: previous version plus one.”

### React.memo

**Where used:** Default export of DishCard.  
**What it does:** Can skip parent-driven renders when props compare equal.  
**Why Addis Eats needs it:** Cards are repeated list items that may receive unchanged dish objects.  
**Alternative:** Ordinary function component.  
**Why current approach was chosen:** It offers a targeted optimization without changing card behavior.  
**Simple viva answer:** “Memo may reuse a card when its props have not changed.”  
**Possible teacher follow-up:** Why do cards still update after cart changes?  
**Follow-up answer:** “They consume CartContext; context changes can rerender them despite memo.”

### Routing and nested routes

**Where used:** BrowserRouter/Routes in App and Outlet in both layouts.  
**What it does:** Matches browser locations to page trees.  
**Why Addis Eats needs it:** Menu, cart, profile, orders, and admin have distinct URLs.  
**Alternative:** Local state choosing pages, or separate full-document pages.  
**Why current approach was chosen:** URLs, navigation history, shared layouts, and direct links fit naturally.  
**Simple viva answer:** “The router selects the page, and Outlet shows the matching child.”  
**Possible teacher follow-up:** Does BrowserRouter configure production hosting?  
**Follow-up answer:** “No; the host must return the app document for valid client-side routes.”

### Dynamic routes

**Where used:** `/menu/:id`, read with useParams in DishDetails.  
**What it does:** Captures a varying segment of a URL.  
**Why Addis Eats needs it:** Every dish can have a direct details link.  
**Alternative:** One hardcoded route per dish or temporary modal selection.  
**Why current approach was chosen:** New dishes require no new route definition.  
**Simple viva answer:** “One route template handles every dish ID.”  
**Possible teacher follow-up:** What if the ID does not exist?  
**Follow-up answer:** “DishDetails displays a useful missing-dish state and menu link.”

### Protected routes

**Where used:** Checkout/orders and the admin parent route.  
**What it does:** Renders children only when the appropriate demo session is present.  
**Why Addis Eats needs it:** Associate orders with an identity and demonstrate separate admin access.  
**Alternative:** Individual page checks; production server authorization for real security.  
**Why current approach was chosen:** One reusable guard covers routes consistently.  
**Simple viva answer:** “The guard redirects a guest to the correct login screen.”  
**Possible teacher follow-up:** Is it secure authorization?  
**Follow-up answer:** “No; browser state can be changed. A real server must enforce access.”

### Lazy loading

**Where used:** Checkout and six admin component imports in App.  
**What it does:** Loads those component modules when needed.  
**Why Addis Eats needs it:** Initial browsing does not require every management/checkout screen.  
**Alternative:** Eager imports for every page.  
**Why current approach was chosen:** Defers less commonly needed JavaScript; the build emits separate chunks.  
**Simple viva answer:** “We download some page code when we visit that part of the app.”  
**Possible teacher follow-up:** Are all pages lazy?  
**Follow-up answer:** “No; Home, Menu, details, cart, favorites, login, profile, and history are eager.”

### Suspense

**Where used:** AppRoutes around Routes.  
**What it does:** Shows a fallback while a lazy component's code is unavailable.  
**Why Addis Eats needs it:** Users need feedback while lazy page modules load.  
**Alternative:** Eagerly load those modules.  
**Why current approach was chosen:** It matches React.lazy's loading mechanism.  
**Simple viva answer:** “Suspense shows our page-loading message while lazy code loads.”  
**Possible teacher follow-up:** Does it automatically handle getDishes?  
**Follow-up answer:** “No; this project's effect-based fetch uses its own loading/error state.”

### Error Boundary

**Where used:** ErrorBoundary class wrapped around route content.  
**What it does:** Replaces a failed descendant render with fallback UI.  
**Why Addis Eats needs it:** Provide reload/home recovery instead of a blank route.  
**Alternative:** No boundary, or finer per-feature boundaries.  
**Why current approach was chosen:** One route-level boundary is simple; pathname keys allow reset on navigation.  
**Simple viva answer:** “It catches rendering failures in its child tree.”  
**Possible teacher follow-up:** Does it catch failed order storage?  
**Follow-up answer:** “That is handled by persistence results and checkout try/catch, not the boundary.”

### Portals

**Where used:** Modal's `createPortal(..., document.body)`.  
**What it does:** Renders DOM in a different container while retaining the React parent relationship.  
**Why Addis Eats needs it:** Dialog placement should be independent of page layout containers.  
**Alternative:** Render dialog markup beside the invoking control.  
**Why current approach was chosen:** One body-level modal shell works across customer/admin screens.  
**Simple viva answer:** “The dialog lives under body in the DOM but remains a child in React.”  
**Possible teacher follow-up:** Does the portal itself trap focus?  
**Follow-up answer:** “No; native dialog behavior and Modal's keyboard code handle focus.”

### localStorage

**Where used:** storage helper, menu service, cart, persistent providers.  
**What it does:** Keeps string data for this browser origin across ordinary reloads/sessions until cleared.  
**Why Addis Eats needs it:** Preserve the local demo's menu/cart/orders/favorites/theme.  
**Alternative:** Memory only, IndexedDB, or a backend database.  
**Why current approach was chosen:** Small demo datasets and a simple no-server scope.  
**Simple viva answer:** “We serialize our local demo data as JSON so it survives refresh.”  
**Possible teacher follow-up:** Is it unlimited or secure?  
**Follow-up answer:** “No; writes can fail, users/scripts can modify it, and clearing it loses the data.”

### sessionStorage

**Where used:** AuthProvider via the storage helper's session flag.  
**What it does:** Stores the customer object and admin flag for the browser page session.  
**Why Addis Eats needs it:** Restore demo access after refresh without making it the same long-lived preference as theme.  
**Alternative:** Memory-only state or real server-managed sessions.  
**Why current approach was chosen:** It fits temporary demo sessions.  
**Simple viva answer:** “It remembers our demo sign-in during this browser session.”  
**Possible teacher follow-up:** Is the password saved there?  
**Follow-up answer:** “No; admin storage contains a boolean, though the demo password is visible in source/UI.”

### Derived state

**Where used:** Subtotal, count, total, delivery lookup, filtered lists, selected order, analytics.  
**What it does:** Calculates a value from existing source data.  
**Why Addis Eats needs it:** Prevent contradictory copies of totals and results.  
**Alternative:** Store each calculated value and synchronize it manually.  
**Why current approach was chosen:** Calculations stay correct whenever the source changes.  
**Simple viva answer:** “If we can calculate a value, we usually do not keep a second editable copy.”  
**Possible teacher follow-up:** Why save totals in an order then?  
**Follow-up answer:** “An order is a historical snapshot of accepted values, not a live cart calculation.”

### useId

**Where used:** Modal title ID and `aria-labelledby`.  
**What it does:** Generates an ID suitable for connecting related accessibility elements.  
**Why Addis Eats needs it:** The dialog must be named by its own heading.  
**Alternative:** Manually managed unique IDs.  
**Why current approach was chosen:** Avoids fixed heading-ID collisions across modal instances.  
**Simple viva answer:** “It connects the dialog to the correct title.”  
**Possible teacher follow-up:** Is it a replacement for dish IDs in lists?  
**Follow-up answer:** “No; list keys should use the stable IDs from the data.”

### StrictMode

**Where used:** main.jsx around App.  
**What it does:** Enables extra development checks, including effect setup/cleanup checks.  
**Why Addis Eats needs it:** Helps expose impure rendering or incomplete cleanup.  
**Alternative:** Mount App without this development wrapper.  
**Why current approach was chosen:** The extra checks help during development without being an extra production screen.  
**Simple viva answer:** “StrictMode helps reveal lifecycle mistakes while we develop.”  
**Possible teacher follow-up:** Does it mean production always fetches twice?  
**Follow-up answer:** “No; its extra development checks are not normal production behavior.”

### Profiler, in tests only

**Where used:** performance.spec.js injects a Profiler around App.  
**What it does:** Records render commit measurements for the tested interactions.  
**Why Addis Eats needs it:** Provide observed evidence instead of assuming memoization makes everything fast.  
**Alternative:** React DevTools profiling or browser performance tools.  
**Why current approach was chosen:** The test can repeat interactions and save samples without modifying shipped app code.  
**Simple viva answer:** “We measured development renders in a test.”  
**Possible teacher follow-up:** Does the test enforce a performance budget?  
**Follow-up answer:** “No; it checks samples exist and are finite, not a maximum duration.”

## 6. Answers to the “why” questions

| Question | Beginner-friendly answer grounded in this project |
| --- | --- |
| Why React? | The interface has repeated cards, forms, shared state, and changing totals. Components and state let us describe those updates without manually editing each DOM element. Plain JavaScript could also implement this small app. |
| Why feature-based folders? | Cart rules, screens, and provider are near each other. This makes it easier to find the code responsible for one feature. |
| Why Context? | Shared cart/auth/theme/order values must reach different routes without passing them through every layout layer. |
| Why useReducer? | Cart has several related operations with quantity rules; named actions keep those transitions centralized and testable. |
| Why not Redux? | This demo's shared state is manageable with built-in tools. Another library is not required for the current scope. It is not because Redux is inherently wrong. |
| Why not Zustand? | There is no existing Zustand store to preserve, and Context/reducer already handles the workload. A different store could be considered if measured subscription complexity grew. |
| Why is cart global? | Cards add items, Layout shows count, Cart edits them, Checkout places them, and History rebuilds them. They need one cart. |
| Why is search not global? | Customer search belongs to Menu and lives in its URL; admin searches belong to their local pages. Other screens do not need a shared search Context. |
| Why is category stored in the URL? | Category links can be shared/reloaded and work with browser navigation. Search is in the URL too. |
| Why use custom hooks? | useDishes reuses loading/retry/cleanup; usePersistentState reuses checked persistence; context hooks simplify feature access. |
| Why use useEffect? | To synchronize with fetch, storage, document theme/title, dialogs, listeners, and timers after rendering. |
| Why use useRef? | Focus a real control, hold a timer, keep a current accepted value, or immediately lock submission without requiring a render. |
| Why use useMemo? | Reuse the menu-filter result on unrelated renders while its input dependencies remain equal. |
| Why use useCallback? | Keep the retry/listener, persistence setter, and toast function references stable where useful. |
| Why use React.memo? | DishCard can skip some unchanged-prop renders in repeated lists. It still updates when its consumed Context changes. |
| Why not memoize everything? | Memoization adds comparisons, dependencies, and complexity. Small calculations may be cheaper to repeat; correctness must never depend on a cache. |
| Why protect checkout? | The demo needs a customer ID to associate a placed order with history. This is a UI flow requirement, not production security. |
| Why use dynamic routes? | `/menu/:id` supports every current/new dish without hardcoding a page route per item. |
| Why use localStorage? | It preserves this small no-backend demo across refreshes using built-in browser storage. |
| Why store IDs for favorites? | A favorite identifies a dish; its current name/image/price already belongs to the menu. Duplicating them would become stale. |
| Why reconcile reorder items with current menu? | Old prices and removed dishes must not silently become a new order. Keep quantities but use currently available dish data. |
| Why store order snapshots? | A past order must retain what was accepted then, even when admin later edits/deletes a dish. |
| Why are delivery fee/time derived? | The selected area determines both through one mapping; separate live state would be redundant and could disagree. Accepted values are then copied into the order. |
| Why reusable UI? | The same quantity controls, fields, dialog rules, feedback, and cards should behave consistently without repeated implementations. |
| Why is Admin inside the same application? | It reuses the local menu/order data, theme, and UI through a nested route group. Production authorization would still belong on a server, regardless of frontend layout. |

## 7. Testing strategy and actual evidence

### Fresh verification from this audit

The existing test commands were run without changing test/application code:

| Check | Actual result observed on 18 September 2026 |
| --- | --- |
| `npm.cmd test` | 6 tests passed, 0 failed |
| `npm.cmd run build` | Passed; 64 modules transformed; separate Checkout/admin chunks emitted |
| `npm.cmd run test:e2e` | All 18 scenarios individually reported passing. Runner cleanup had not returned a final process-exit summary at delivery. |

The build emitted approximately 250.78 kB for its main JavaScript chunk (77.20 kB gzip), 39.67 kB CSS (8.93 kB gzip), other shared JavaScript, and separate lazy page chunks. Those numbers describe these generated assets, not the entire application's total transfer size or a loading-speed guarantee.

The fresh development profiling scenario recorded 10 commits, approximately 365.10ms summed actual render duration and 109.70ms maximum actual render duration. These are environment-dependent React development measurements for menu mount, search typing, and add-to-cart. They are not request latency, production performance, a Lighthouse score, or proof of improvement over an un-memoized version.

The intentionally injected “Simulated component failure” appears in server console output during the ErrorBoundary test. That is expected test input, not an unexpected production crash discovered in the audit.

The older `docs/VERIFICATION.md` is dated 14 September 2026 and reports 6 unit tests, a build, and 18 browser scenarios across its recorded runs. Its original full run included a responsive scenario timeout followed by successful split reruns. Do not describe those historical runs as a single uninterrupted 18-test pass. Today's result is recorded separately here.

### What each layer proves

**Unit/domain:** Node's built-in test runner tests pure logic: cart merge/count/subtotal/update/remove/clear; quantity bounds and malformed lines; checkout/phone validation; known/unknown delivery areas; reorder reconciliation without mutating history; analytics totals/status/top dishes. There are six tests with multiple assertions, not six tests per feature. No coverage percentage or React-component unit suite is claimed.

**E2E:** There are 16 scenarios in app.spec.js and two in performance.spec.js. They run in headless installed Microsoft Edge with one worker. They cover URL filters/missing routes, favorites/theme refresh, cart math/storage, guarded checkout/validation/history/reorder, fetch retry/loading, admin login/menu CRUD/logout, order details/status/deletion/analytics, changed prices, mobile navigation/layout, empty/malformed menu, failed order save, render failure recovery, image upload/dialog focus, preserved delivery area, profiling, and tablet/light/spice behavior.

**Failure paths:** Existing tests deliberately inject a 503 fetch, malformed JSON shape, empty menu array, order-storage quota error, and component render exception. Those verify specific recoveries; they do not prove every storage/schema/network failure is covered. The quantity/domain tests exercise invalid inputs directly.

**Regression:** Re-run the existing domain and browser suites after a later code change. Strong regression examples are delivery area surviving login, changed prices blocking placement, and failed storage preserving the cart. No fixes were made during this documentation milestone.

**Manual demonstration rehearsal:** Walk through the sequence in section 9 using sample identity data. Check that copy is understandable, confirmation details match totals, and navigation feels coherent. This guide supplies a manual checklist; it does not claim a new exhaustive hands-on user study was performed.

**Responsive:** Existing automated checks cover 1440×1000 desktop defaults, 390×844 mobile, and 768×1024 tablet, including selected overflow checks and screenshots. A viewport check confirms width behavior, not every visual detail. Manually review 320px, intermediate widths, long dish names, 200% zoom, and keyboard navigation before making wider claims.

**Accessibility:** Existing browser tests check modal Escape/focus return and Tab containment. Role/label-based selectors also exercise accessible naming. Manually review skip links, focus order, both themes' contrast, errors/readout with a screen reader, zoom, reduced motion, and small touch targets. There is no installed automated accessibility-audit library and no full WCAG certification.

**Storage:** Existing tests cover cart/favorites/theme refresh, menu CRUD/upload persistence, order status persistence, and failed order saving. Additional manual failure exploration should use a disposable browser profile: test blocked storage, malformed saved values, sign-out/reload, and independent sessions. Do not clear a real user's saved data as part of a demo. Stored data validation is limited, so arbitrary hostile values are not guaranteed safe.

**Build:** The production build verifies module resolution/transformation and chunk generation. It does not prove hosting rewrites, deployment, production authentication, or runtime behavior in every browser. The E2E server runs Vite development mode, not a deployed production build.

Useful existing commands:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run format:check
```

The formatting command is listed for reproducibility; no full-project formatting-pass result is implied by this audit.

## 8. Limitations and what production would require

| Current limitation | What a production implementation would require |
| --- | --- |
| No real payment processing; “pay on delivery” is descriptive | A payment/collection workflow with server-verified status, secure provider integration where needed, receipts, reconciliation, and failure handling |
| Customer name/phone sign-in does not verify identity | Verified account enrollment/sign-in, secure session handling, expiry, recovery, and abuse protection |
| Admin password and access check are in browser code | Server-side credential verification, secure account storage, role checks on every privileged operation, and appropriate audit records |
| Route protection is a frontend gate | Server-enforced authentication and authorization for order/menu APIs; hiding links is insufficient |
| No production database | Durable server-side menu/order/account storage, migrations, backups, and integrity rules |
| No cross-device or live cross-tab synchronization | Shared APIs/data and a deliberate cache/invalidation/synchronization strategy; push updates where needed |
| No actual dispatch or tracking | Restaurant acceptance, courier assignment/location integration, authenticated status events, and customer notifications |
| Delivery fee/time are static examples | Validated addresses/service areas and operational estimates based on actual delivery rules and conditions |
| Cart/favorites are browser-wide, not account-scoped | Account-linked persistence and explicit anonymous-to-account merge/privacy behavior |
| Orders are filtered by an unverified phone ID | Server ownership checks and protected personal-data access; frontend filters alone are not privacy controls |
| Order data is locally editable/erasable | Server-authoritative order records and appropriate access/retention safeguards |
| Menu cache can stay stale after seed-file updates | Versioning/invalidation and authoritative menu freshness checks |
| Order save and cart clear are separate writes | Atomic server-side order operations where appropriate, retry-safe idempotency, and recovery design; the ref lock only covers an in-flight attempt in this component |
| No concurrency control for multiple tabs/admins | Server-side conflict detection/transactions or version checks; a local write can overwrite another writer's data |
| Stored-data validation is partial | Comprehensive schema/type/size checks at trust boundaries; for example customer validation assumes string-like name/phone and does not safely handle every arbitrary stored type |
| Provider initialization is outside the route boundary | Defensive initialization and correctly scoped recovery so malformed shared state cannot take down the whole tree |
| Uploads become local data URLs with a small limit | Secure server/object storage uploads, actual content validation, size limits, image processing, controlled access, and serving strategy |
| No stock counts, restaurant-hours logic, cancellations, refunds, or customer review submission | Product rules and backend workflows for whichever of those capabilities a real service requires |
| Checkout draft/confirmation selection are transient | Explicit draft persistence and/or an authorized order-detail route if durable continuation/receipt URLs are required |
| Client-side totals use JavaScript numbers | Server-authoritative validated prices and suitable monetary representation/rounding rules for real billing |
| No complete accessibility/browser/performance certification | Broader browser/device/assistive-tech checks, production performance measurements, and ongoing regression monitoring |
| No verified production deployment in this milestone | Hosting configuration for BrowserRouter deep links, HTTPS, environment configuration, monitoring, and operational testing |

More precise behavior to remember: checkout notes are optional; there is no separate required street-address field. Analytics counts saved orders regardless of payment settlement. Reordering replaces a cart after confirmation rather than merging it. A removed dish can remain visible in an old cart until reconciliation; its historical order snapshot remains valid.

There are also narrow implementation limits worth acknowledging if asked: a failed sign-out storage write is ignored even though in-memory identity is cleared; a reload could restore the old stored demo session. A successful order write followed by failed cart persistence is not a transaction and may leave an older stored cart for the next reload. Neither issue was changed in this milestone.

## 9. Concise presentation sequence

Aim for roughly 7–10 minutes, shortening the admin segment if your allotted time is smaller. Use sample data. Have the app running before the presentation and know whether your browser already contains demo edits/orders; seeded prices apply only to the unchanged seed menu.

Opening sentence: “Addis Eats is a React food-ordering demo that demonstrates customer and admin workflows using browser-local data.”

| Step | What to demonstrate | React concept | One sentence to say |
| --- | --- | --- | --- |
| 1. Home | Shared header, category links, four highlighted dishes | Components, composition, props | “Home reuses the same category and dish components used elsewhere.” |
| 2. Menu | Open the full five-dish seed menu | Custom hook, effect, list keys | “The menu hook loads validated local data or fetches the JSON seed.” |
| 3. Search | Type `doro`, observe URL/results; try no match then clear | Controlled input, URL state, useMemo | “Search filters locally and stores the query in the URL.” |
| 4. Category | Select Pizza, then All; show URL | Props, callbacks, router search parameters | “Category selection is linkable and survives a page refresh.” |
| 5. Dish details | Open Doro Wat and show ingredients/quantity | Dynamic route, params, local state | “One details component looks up the dish ID from the URL.” |
| 6. Add to cart | Select quantity two, add, point to badge | Events, Context, reducer | “The reducer merges matching dishes and every cart consumer sees the update.” |
| 7. Cart calculations | Show two × 350 = 700, Bole 50, total 750; change quantity/area | Derived state, controlled child | “We calculate totals from cart lines and the chosen delivery area.” |
| 8. Checkout | Show login redirect if signed out, invalid fields, then correct them | Guard, controlled form, validation, refs | “Checkout restores my destination, validates fields, and focuses the first error.” |
| 9. Confirmation | Place one demo order and show receipt/cart cleared | Coordinated state changes, conditional rendering | “The order must save successfully before we show success and clear the cart.” |
| 10. History | Open My orders and expand details/filter | Context, filtering, snapshot rendering | “History uses the customer's ID and preserves original order details.” |
| 11. Favorites | Save a heart, open Favorites, optionally refresh | Context, ID references, persistence | “We save IDs and display their current matching menu dishes.” |
| 12. Reorder | Reorder; optionally show replacement prompt for nonempty cart | Async action, reconciliation, modal state | “Reorder uses current prices and skips dishes that no longer exist.” |
| 13. Admin | Login; inspect dashboard; edit a dish; inspect/advance an order | Nested guarded routes, shared data, forms | “Admin shares the same local menu and orders; status changes are manual.” |
| 14. Theme | Switch theme in Profile or admin; refresh | Context, effect, localStorage | “One persisted preference changes CSS variables across the application.” |
| 15. Responsive/accessibility | Narrow viewport, open navigation dialog, Tab/Escape, show label/focus | Responsive CSS, refs, portal, semantic UI | “The layout adapts and dialogs support keyboard focus and Escape.” |

If asked for a failure-path demonstration, explain the existing price-change or storage-failure test rather than editing source during the presentation. Close by stating that the frontend has no real payments, identity verification, server authorization, or delivery dispatch.

## 10. Viva question bank: 52 questions with follow-ups

### A. React fundamentals

**1. What is a component in your project?**  
Short answer: A reusable UI unit, such as DishCard or QuantityControl.  
Follow-up: Why not copy the card markup onto every page?  
Follow-up answer: One component keeps appearance and behavior consistent across Home, Menu, and Favorites.

**2. How are props different from state?**  
Short answer: Props are inputs from the parent; state is changing memory owned by a component/provider.  
Follow-up: Which does QuantityControl use?  
Follow-up answer: It receives quantity and onChange as props; its parent owns the value.

**3. Why do dish lists have keys?**  
Short answer: Stable dish IDs help React match items across filtering and updates.  
Follow-up: Why not use array index for dishes?  
Follow-up answer: Removing or filtering dishes changes positions, so index is a poor item identity.

**4. How do you show different UI for loading, errors, and results?**  
Short answer: Conditional rendering selects Loading, ErrorState, cards, or EmptyState.  
Follow-up: Are loading and empty the same?  
Follow-up answer: No; loading means the result is not ready, while empty means there are no matching items.

### B. Architecture

**5. What happens when the app starts?**  
Short answer: index.html loads main.jsx, which mounts App inside StrictMode and loads styles.  
Follow-up: What does App add?  
Follow-up answer: Providers, BrowserRouter, routes, lazy loading, and error recovery.

**6. What is Layout responsible for?**  
Short answer: The customer header, navigation, footer, and route content outlet.  
Follow-up: Does Layout own menu data?  
Follow-up answer: No; pages use useDishes for menu loading.

**7. Why separate api, hooks, and UI?**  
Short answer: The service reads data, the hook manages loading lifecycle, and components display it.  
Follow-up: Is api/dishes.js a real backend?  
Follow-up answer: No; it fetches a local JSON seed and manages browser storage.

**8. Why are files grouped by feature?**  
Short answer: It keeps a feature's screen, state, and rules easy to find together.  
Follow-up: Where do shared items go?  
Follow-up answer: Generic UI goes in ui; cross-feature pure helpers go in utils.

### C. State management

**9. Why is the cart shared?**  
Short answer: Cards, details, Layout, cart, checkout, and reorder all need the same basket.  
Follow-up: Where is its source of truth?  
Follow-up answer: CartProvider's reducer state.

**10. What actions does the cart reducer support?**  
Short answer: Add, quantity, remove, clear, and replace.  
Follow-up: What happens when the same dish is added again?  
Follow-up answer: Its quantity merges into the existing line, capped at 99.

**11. Why is subtotal not separate useState?**  
Short answer: It is calculated from item price times quantity.  
Follow-up: What problem would storing both create?  
Follow-up answer: An item could change without the separate total being updated.

**12. How does the selected admin order stay current?**  
Short answer: OrderManager stores selectedId and derives the matching order from shared orders.  
Follow-up: Why not store a second selected order object?  
Follow-up answer: That copy could become stale after a status update.

### D. Routing

**13. What does Outlet do?**  
Short answer: It displays the matched child route inside a layout.  
Follow-up: Where is it used?  
Follow-up answer: Customer Layout and AdminLayout.

**14. How can every dish have a page without a separate component?**  
Short answer: `/menu/:id` uses one DishDetails component and useParams.  
Follow-up: What happens with a deleted dish link?  
Follow-up answer: The lookup fails and the missing-dish state offers a return to Menu.

**15. Which customer routes require sign-in?**  
Short answer: Checkout and orders.  
Follow-up: Is Profile protected?  
Follow-up answer: No; it shows guest information and theme options too.

**16. Where is the confirmation route?**  
Short answer: There is no separate route; Checkout renders OrderConfirmation after success.  
Follow-up: What happens after a full refresh there?  
Follow-up answer: The local confirmation selection resets; the saved order remains in history.

### E. Forms

**17. What makes checkout inputs controlled?**  
Short answer: Their values come from Checkout state and onChange updates that state.  
Follow-up: Why is this useful?  
Follow-up answer: Validation and the order summary read the same current values.

**18. What does checkout validate?**  
Short answer: Name, Ethiopian phone, supported area, and optional notes length.  
Follow-up: Does a valid phone mean it belongs to this customer?  
Follow-up answer: No; only its format is checked, with no SMS verification.

**19. How are invalid fields made easier to find?**  
Short answer: Field messages, aria-invalid/describedby, and focus on the first invalid control.  
Follow-up: Why schedule focus with requestAnimationFrame?  
Follow-up answer: So the rendered invalid attributes can be available before querying the form.

**20. How does dish upload work?**  
Short answer: Check file type/size, then FileReader reads a data URL saved with the dish.  
Follow-up: Is the image sent to a server?  
Follow-up answer: No; it remains in this browser's local menu storage.

### F. Effects and hooks

**21. Why does useDishes return retry?**  
Short answer: A page can retry after a load failure without duplicating fetch logic.  
Follow-up: How does retry trigger loading?  
Follow-up answer: It increments a version used as the fetch effect dependency.

**22. Why abort requests in cleanup?**  
Short answer: A page or effect may no longer need an in-flight request.  
Follow-up: Why also use an active flag?  
Follow-up answer: It prevents obsolete completion from setting state even when work already resolved or was not a fetch.

**23. What is stored in checkout's submitting ref?**  
Short answer: Whether an order submission is currently in progress.  
Follow-up: Does that guarantee no duplicates across reloads/devices?  
Follow-up answer: No; that would need server-side idempotency and persistence rules.

**24. Why does usePersistentState have a current ref?**  
Short answer: Its stable setter needs the latest accepted value for functional updates.  
Follow-up: Does it update that ref when storage fails?  
Follow-up answer: No; it returns false and keeps the previous accepted state.

### G. Performance

**25. What does Menu memoize?**  
Short answer: The list filtered by dishes, category, and search.  
Follow-up: Does useMemo eliminate search work?  
Follow-up answer: No; changed search text still requires a new calculation.

**26. Why might a memoized DishCard rerender?**  
Short answer: Props may change or its cart Context may update.  
Follow-up: Is that necessarily a bug?  
Follow-up answer: No; the card must reflect quantity and Add-button state.

**27. Why is search not debounced?**  
Short answer: It filters a tiny local menu with no request per keystroke.  
Follow-up: When could debounce help?  
Follow-up answer: When typing triggers costly remote searches; that is not this implementation.

**28. How was performance measured?**  
Short answer: A browser test wraps App in React Profiler and saves development render samples.  
Follow-up: Is that a production benchmark?  
Follow-up answer: No; it is one development environment and scenario, without a speed threshold.

### H. Storage

**29. What is kept in localStorage?**  
Short answer: Menu, cart, favorite IDs, orders, and theme.  
Follow-up: What is kept in sessionStorage?  
Follow-up answer: The demo customer and admin sign-in state.

**30. Why use JSON.stringify and JSON.parse?**  
Short answer: Browser storage stores strings, while the app uses arrays and objects.  
Follow-up: What if parsing fails?  
Follow-up answer: readStorage catches it and returns the caller's fallback.

**31. Does every valid JSON value become valid app data?**  
Short answer: No; each feature also checks expected structure to varying degrees.  
Follow-up: Is validation exhaustive?  
Follow-up answer: No; some malformed types and domain invariants are not fully guarded.

**32. Why are order snapshots different from favorites?**  
Short answer: Orders preserve past accepted details; favorites point to current dishes.  
Follow-up: What happens after a price edit?  
Follow-up answer: Favorites show the current price; past orders retain the old price.

### I. Authentication

**33. How is a customer identified?**  
Short answer: By normalized phone number used as the demo customer ID.  
Follow-up: Can someone enter another person's number?  
Follow-up answer: Yes; this demo performs no ownership verification.

**34. How is admin sign-in checked?**  
Short answer: Browser code compares the entered values to the displayed demo credentials.  
Follow-up: Can that secure production admin operations?  
Follow-up answer: No; server-side authentication and authorization are required.

**35. What happens if a guest opens checkout?**  
Short answer: RequireAuth redirects to Login and records the destination/route state.  
Follow-up: Does the selected delivery area survive?  
Follow-up answer: Yes; the guard/login flow passes it through returnState.

**36. Does admin sign-out also sign out the customer?**  
Short answer: No; they are separate provider values and storage keys.  
Follow-up: Does customer sign-out clear favorites/cart?  
Follow-up answer: No; those are browser-wide stores, not account-specific stores.

### J. Testing

**37. What does the domain suite test?**  
Short answer: Cart rules/math, validation, delivery lookup, reconciliation, and analytics.  
Follow-up: Does it launch a browser?  
Follow-up answer: No; it calls pure functions with Node's test runner.

**38. Why have browser tests as well?**  
Short answer: They check that routes, forms, storage, and screens work together.  
Follow-up: Name a tested failure path.  
Follow-up answer: Failed order storage must show an error and keep the cart.

**39. What does a successful production build prove?**  
Short answer: Vite can resolve/transform the project and emit production assets.  
Follow-up: Does it prove every user flow works?  
Follow-up answer: No; that needs runtime tests and manual review.

**40. What are the audit's fresh test results?**  
Short answer: Six domain tests passed, the build passed, and all 18 browser scenarios individually reported passing; runner cleanup was still pending at delivery.  
Follow-up: Can you claim complete accessibility coverage from this?  
Follow-up answer: No; keyboard/viewport tests cover specific behaviors, not full assistive-technology certification.

### K. Accessibility

**41. How do icon buttons get meaningful names?**  
Short answer: Their buttons/links have text or aria-label; decorative SVGs are hidden.  
Follow-up: Give an example.  
Follow-up answer: “Add Doro Wat to cart” names a specific card's action.

**42. How do dialogs work with the keyboard?**  
Short answer: Native modal dialog plus Tab wrapping, Escape close, and focus restoration.  
Follow-up: What part does createPortal provide?  
Follow-up answer: DOM placement under body, not keyboard behavior by itself.

**43. Why is the skip link useful?**  
Short answer: Keyboard users can bypass repeated navigation and reach main content.  
Follow-up: How is the target prepared?  
Follow-up answer: The main element has the matching ID and tabIndex of -1.

**44. How does the app address reduced motion?**  
Short answer: A media query disables animations/transitions for that preference.  
Follow-up: Does responsive layout equal accessibility?  
Follow-up answer: No; naming, focus, contrast, keyboard operation, and assistive-tech behavior also matter.

### L. Admin

**45. How do admin menu edits reach customer screens?**  
Short answer: The service saves the menu and dispatches a same-window change event to useDishes.  
Follow-up: Is that real-time server communication?  
Follow-up answer: No; it is a browser-local notification.

**46. Can admin move an order from pending directly to delivered?**  
Short answer: The normal provider action only allows the next status.  
Follow-up: Does this prove delivery happened?  
Follow-up answer: No; it records a manual local status change.

**47. What does dashboard total order value mean?**  
Short answer: Sum of totals for all saved orders, including delivery fees and all statuses.  
Follow-up: Is it collected payment revenue?  
Follow-up answer: No; the app collects no payments.

**48. What changes when an order is deleted?**  
Short answer: It leaves shared storage/state, customer history, and analytics.  
Follow-up: Are the menu dishes deleted too?  
Follow-up answer: No; orders and dishes are separate collections.

### M. Limitations

**49. Does Addis Eats communicate with a real restaurant?**  
Short answer: No; all order administration is local demo behavior.  
Follow-up: What would be needed?  
Follow-up answer: Authenticated server APIs and an actual restaurant acceptance/dispatch workflow.

**50. Can the same order appear on another device automatically?**  
Short answer: No; data stays in this browser's storage.  
Follow-up: What would enable that?  
Follow-up answer: An account-linked backend database and synchronization through APIs.

**51. What happens if someone clears site storage?**  
Short answer: Saved local data is lost; missing menu storage is reseeded from JSON next time.  
Follow-up: Are old orders recovered from the seed?  
Follow-up answer: No; the seed contains dishes, not an order backup.

**52. What is the most important production change?**  
Short answer: Introduce server-authoritative identity, authorization, validation, and durable order/menu storage.  
Follow-up: Would adding Redux solve those issues?  
Follow-up answer: No; a frontend state library does not provide backend security or persistence.

## 11. Trick questions

| Trick question | Correct answer for Addis Eats |
| --- | --- |
| “Does Context persist data?” | No. Providers share values; explicit localStorage/sessionStorage calls persist selected data. |
| “Does React.memo prevent all renders?” | No. DishCard can still render after its cart Context changes or its dish prop changes. |
| “Does useMemo make code automatically faster?” | No. It avoids some repeated calculations but has overhead; this menu is small and no before/after speed improvement is proven. |
| “Does useCallback always improve performance?” | No. It stabilizes references. Our useful cases are retry, persistence update, and notify; it does not accelerate function execution. |
| “Does a custom hook share state between components?” | Not automatically. useDishes calls have separate state; useCart calls access the same provider because of Context. |
| “Does Error Boundary catch every JavaScript error?” | No. It covers descendant render/lifecycle failures, not ordinary async/event errors or failures in providers above it. |
| “Does localStorage make authentication secure?” | No. This app's auth uses sessionStorage, but neither storage mechanism proves identity or enforces secure privileges. |
| “Is client-side route protection enough for production security?” | No. Users can manipulate browser code/storage; a server must authorize protected operations. |
| “Why not store every value in state?” | Count, subtotal, fee, estimate, and filters can be calculated. Duplicate state risks inconsistency. |
| “Why not put every state in Context?” | Draft fields, admin search, and modal selection only concern their owner; globalizing them broadens coupling and update reach. |
| “Is customer search just local useState?” | No. It is `q` in the URL. Admin searches use local state. |
| “Does Suspense handle the JSON menu request?” | Not in this implementation. useDishes handles that loading/error state; Suspense handles lazy modules. |
| “Does a portal automatically make a modal accessible?” | No. The dialog/title, keyboard code, focus restoration, and labels provide the needed behavior. |
| “Does reorder place an order immediately?” | No. It prepares/replaces a cart using current menu data; checkout is still required. |
| “Are delivery times calculated from GPS?” | No. They are static ranges looked up by area. Dish preparation minutes are a separate sample field. |
| “Does removing a dish erase it from history?” | No. Orders preserve snapshots. Reorder skips dishes no longer on the current menu. |
| “Is the cart badge the number of different dishes?” | No. It is the sum of quantities. Two Doro Wat plus one juice means badge 3 and two lines. |
| “Does a successful build mean all tests passed?” | No. Build, domain tests, and browser tests are separate checks. |
| “Does the submitting ref guarantee exactly one order forever?” | No. It prevents overlapping submits during this component's in-flight operation; it is not server idempotency. |
| “Are all saved records fully trusted after JSON.parse?” | No. Parsing is not validation, and the implemented validators are not exhaustive production schemas. |

## 12. Final one-page study sheet

**Architecture:** React SPA + Vite; feature folders; shared UI/helpers; static JSON and browser storage; customer/admin in one app.

**State:** Global providers: auth, cart, favorites, orders, theme, toast. Local: drafts, modal selection, admin searches, detail quantity. Derive totals/results.

**Routing:** BrowserRouter + nested Outlet layouts. `/menu/:id` uses params. Checkout/orders require customer; `/admin` requires admin flag. Confirmation stays inside Checkout.

**Data flow:** Event → callback/action → owner updates → React rerenders → dependent UI changes. Menu: hook → service → saved menu or JSON seed.

**Storage:** localStorage: dishes/cart/favorite IDs/orders/theme. sessionStorage: customer/admin. JSON helpers catch storage/parse failures; Context itself does not persist.

**Authentication:** Demo name/phone identity; normalized phone is customer ID. Admin: `admin` / `Addis@123`. No verified identity or server authorization.

**Cart:** Context + pure reducer; add/quantity/remove/clear/replace; quantities 1–99; merge by dish ID. Badge sums quantities; subtotal sums price × quantity.

**Checkout:** Controlled name/phone/area/notes → validate → lock → current-menu reconciliation → save snapshot → confirmation → clear cart. Failed order save keeps cart.

**Favorites:** Persist IDs only; join with current dishes. Browser-wide, not account-specific.

**Orders:** UUID, customer ID/details, item snapshots, subtotal/fee/total/estimate, timestamp, status. History filters by customer ID; old details remain unchanged.

**Reorder:** Old lines → current menu by ID → current prices + old quantities → omit removed dishes → confirm replacing nonempty cart → cart; not automatic placement.

**Admin:** Nested guarded workspace; local menu CRUD/search/image data URLs; order search/details/status/delete; derived dashboard. Status: pending → preparing → delivering → delivered.

**Theme:** Persist dark/light; effect sets document data-theme/colorScheme; CSS variables apply across customer/admin.

**Testing:** Six domain tests; 18 existing browser scenarios; build produces lazy chunks. Distinguish fresh results from dated reports. Keyboard/viewport checks are not full certification.

**Accessibility:** Real links/buttons, labels/errors, alt text, pressed states, skip links, live messages, visible focus, dialog Escape/Tab/focus restoration, reduced-motion CSS.

**Performance:** Menu useMemo; DishCard memo; stable selected callbacks; lazy checkout/admin; lazy card images. Context still triggers consumer updates. Profiler is test-only.

**Limitations:** No real payments, verified auth, server access control/database, live delivery, restaurant communication, or cross-device sync. Local storage is editable/erasable. Demo estimates and analytics are not operational guarantees.
