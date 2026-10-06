# Milestone audit (46 checkpoints)

The additional roadmap is incorporated alongside the PDF. Reviewed architecture choices are explained below. No code was copied from another day project.

| #   | Milestone                  | Outcome / evidence                                                    |
| --- | -------------------------- | --------------------------------------------------------------------- |
| 1   | Feature architecture       | Existing foundation retained; feature folders own code.               |
| 2   | Layout and navigation      | Customer header, main, footer, desktop/mobile links.                  |
| 3   | Routing                    | Customer routes, dynamic dish page, guarded checkout/history and 404. |
| 4   | Menu API                   | Fetched JSON, validated data, cancellation, loading/error/retry.      |
| 5   | Dish cards                 | Images, names, categories, prices, spice badges, hearts and Add.      |
| 6   | Category filter            | URL category parameter, restored on refresh.                          |
| 7   | Live search                | Immediate local search; URL query; debounce reviewed below.           |
| 8   | Dish details               | Description, ingredients, spice, price, quantity and Add.             |
| 9   | Cart state                 | Shared Context + reducer.                                             |
| 10  | Add to cart                | Cards/details merge matching dish quantities.                         |
| 11  | Quantity/remove            | Accessible controls, bounds 1?99, explicit removal.                   |
| 12  | Total and badge            | Derived from lines; no duplicate state.                               |
| 13  | Cart persistence           | localStorage with failure feedback.                                   |
| 14  | Checkout form              | Name, phone, area, optional instructions.                             |
| 15  | Validation                 | Pure helper, field errors and first-invalid focus.                    |
| 16  | Protected checkout         | Retains destination and selected area through sign-in.                |
| 17  | Confirmation               | Save order before confirmation and cart clear.                        |
| 18  | Order history              | Customer-scoped local history, filters and details.                   |
| 19  | Reorder                    | Current menu reconciliation; confirms replacing a populated cart.     |
| 20  | Favorites                  | Persisted dish IDs on cards/details and saved page.                   |
| 21  | Loading states             | Fetch, code loading, submission, saving and uploading.                |
| 22  | Empty states               | Menu, cart, favorites, orders and admin.                              |
| 23  | Error handling             | API, malformed data, storage, forms, routes, guards and rendering.    |
| 24  | Responsive                 | Desktop/mobile/tablet browser checks.                                 |
| 25  | Accessibility              | Labels, skip link, semantic controls, focus loop/restore, Escape.     |
| 26  | Context                    | Auth, theme and feature-scoped shared stores.                         |
| 27  | Reducer                    | Tested pure cart transitions.                                         |
| 28  | Zustand/persistence review | No existing Zustand; retain clear Context/reducer approach.           |
| 29  | Memoization review         | useMemo filtering, memo cards, stable hook callbacks.                 |
| 30  | Custom hooks               | useDishes, usePersistentState, useAuth/useCart/useTheme.              |
| 31  | Error boundary             | Render fallback, reload/home links; injected crash test.              |
| 32  | Lazy loading               | Checkout/admin chunks with Suspense.                                  |
| 33  | Portals                    | Native dialog shell mounted at document.body.                         |
| 34  | Performance/Profiler       | Test harness profiles actual menu mount/search/cart interactions.     |
| 35  | Admin authentication       | Separate demo login/session and guarded group.                        |
| 36  | Admin layout               | Nested workspace, Outlet, shared UI/theme.                            |
| 37  | Dashboard                  | Actual order totals/averages, top dishes, status/trend.               |
| 38  | Menu management            | CRUD/search, image upload, spicy setting, confirmation.               |
| 39  | Order management           | List/search/filter/details, forward statuses, confirmed deletion.     |
| 40  | Full audit                 | REQUIREMENTS.md maps all 26 customer and 17 admin features.           |
| 41  | Testing                    | Domain unit tests and browser happy/failure paths.                    |
| 42  | Cleanup                    | Build/import checks, state/dependency review, unused import removed.  |
| 43  | Git cleanup                | Small explicit-path commits; no bulk final-project commit.            |
| 44  | Architecture explanation   | Diagram and data/state explanation in PRESENTATION.md.                |
| 45  | Viva questions             | Code-specific explanations and tradeoffs.                             |
| 46  | Presentation               | Five-minute demo outline and honest production boundary.              |

## Deliberate choices

- No added Zustand/Redux: the starting project had neither. Context + reducer is adequate and keeps ownership clear.
- No delayed local search: five seeded dishes and no per-keystroke network requests do not justify debounce. The presentation explains when a debounced hook would help.
- useDishes is the reusable resource hook; adding a generic useFetch wrapper would duplicate the current abstraction.
- Profiler instrumentation exists only in a browser test. No profiling toggle/logs are shipped in the customer app.
- The frontend brief permits a JSON API stand-in and localStorage. Real server authentication, shared data, delivery and payment remain production work, clearly identified in the app and README.
