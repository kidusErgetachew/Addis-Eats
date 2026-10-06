# Verification report

Date: 2026-09-14. Project: `projects/Addis_Eats_React/`.
Environment: Node 24, Vite 8, React 19; Playwright with installed Microsoft Edge.

## Results

- `npm.cmd test`: **6/6 passed**.
- `npm.cmd run build`: **passed**, 64 modules transformed; checkout/admin emitted as separate lazy chunks.
- Browser coverage: **18 scenarios passed across final validation runs**. The full run passed 15 scenarios; one overlong responsive scenario reached its 45-second test budget. It was replaced with three independent tests, all of which passed in the focused rerun. No application assertion failed in that overlong scenario.
- Development server successfully served the customer/admin app during browser tests.
- Desktop/mobile screenshots were visually inspected. Tablet/light theme and populated mobile checkout were exercised in browser checks. No horizontal overflow at the tested widths.
- Expected network/storage/render failures were intentionally injected and their recovery paths verified. Unexpected page errors are checked by the test harness.

Commands:

```sh
npm.cmd test
npm.cmd run build
node node_modules/@playwright/test/cli.js test
node node_modules/@playwright/test/cli.js test -g "desktop and mobile home|mobile customer pages|mobile admin pages"
npm.cmd run format:check
```

## Browser scenarios

1. URL category, instant search, clear filters, missing dish and 404.
2. Favorites and theme persistence.
3. Cart quantities, totals, delivery estimates, removal and refresh.
4. Guarded checkout, validation, successful placement, history and reorder.
5. Loading, failed fetch, retry.
6. Admin guard, wrong credentials, dish CRUD, Escape and focus restoration.
7. Admin order details, forward statuses, analytics and deletion.
8. Checkout detects changed menu prices before placing an order.
9. Desktop/mobile home screenshots and mobile navigation.
10. Customer pages fit a mobile viewport.
11. Admin pages fit a mobile viewport.
12. Empty and malformed API response states.
13. Failed order storage preserves cart and does not report success.
14. Injected component crash activates the error boundary; reload recovers.
15. Image upload persists and Tab remains inside the modal.
16. Cart delivery area survives sign-in; populated mobile checkout fits.
17. React Profiler captures actual menu/search/cart render commits.
18. Tablet layout, light theme and spicy information.

## Performance review

The final full-run development profile recorded **10 commits**, approximately **342 ms** combined actual render time, with a maximum of approximately **142 ms**. The earlier warmup profile was slower (490 ms total), illustrating machine/load variance. These are development measurements on this Windows environment, not production timings or a service-level guarantee.

The five-dish filter is small and local. No per-keystroke network request occurs. Debouncing or adding another state library is not justified by this workload. Memoized filtering, stable hook callbacks, code splitting and local image assets are already present. Context-consuming cards can still render when shared cart/favorite state changes; memo does not suppress context updates.

To repeat the measurement:

```sh
node node_modules/@playwright/test/cli.js test performance.spec.js -g "profile real menu"
```

The test writes `test-results/react-profile.json` and attaches the samples. Each Playwright run replaces prior ignored test output.

## Issues found and resolved

- PowerShell blocks npm.ps1: use npm.cmd without changing execution policy.
- Sandboxed network/browser restrictions: required package downloads and headless Edge checks used approved access.
- PDF extraction needed a temporary reader outside app dependencies.
- Test fixture/selector/module-URL mismatches were corrected.
- A sign-in redirect dropped the selected delivery area: state now survives both redirect paths.
- Native dialog Tab behavior could leave the final control: explicit first/last focus wrapping now supplements native modal behavior.
- The original combined responsive tour exceeded its test time budget: split into focused independent tests.
- Staged scaffold line endings were normalized before committing.

## Scope limits

This is the specified JSON/localStorage frontend demo. No real authentication, payment, dispatch, shared backend, or production deployment is claimed. Demo data stays on the local device; routes are educational client-side guards. Keyboard/browser coverage is not a full screen-reader or every-device certification.

See REQUIREMENTS.md, MILESTONES.md and PRESENTATION.md for traceable scope and explanations.
