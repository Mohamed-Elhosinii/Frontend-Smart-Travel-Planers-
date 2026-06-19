# Contributing to TripMind

Thanks for working on **TripMind** — an AI travel planner built with **Angular 20.3**
(standalone components + signals), **Bootstrap 5**, **Font Awesome 6**, **Leaflet**, and **jsPDF**.
There is **no backend**: data is served from mock fixtures and persisted in `localStorage`, so a
real API can be dropped in later behind the existing services.

This guide covers naming conventions, project conventions, code style, and Git/PR expectations. For
the visual/UX system see [./ui-ux-guidelines.md](./ui-ux-guidelines.md); for how the app is
structured see [./architecture.md](./architecture.md) and
[./project-structure.md](./project-structure.md).

---

## 1. Getting started

```bash
npm install        # install dependencies
npm start          # ng serve → http://localhost:4200
npm run build      # production build (ng build)
npm test           # unit tests (Karma + Jasmine)
npm run watch      # dev build in watch mode
```

Before opening a PR, make sure **`npm run build` and `npm test` both pass.**

---

## 2. Naming conventions

These conventions are the project standard. They intentionally differ from some older Angular CLI
defaults (notably: **no `.component.` infix**).

### 2.1 Files

- **kebab-case, no type infix.** Use the plain feature name — `login.ts`, `flight-card.ts`,
  `auth.service.ts`, `auth-guard.ts`. Do **not** write `login.component.ts` or `flight-card.component.ts`.
- A component's template and styles sit beside it with matching names: `login.ts`, `login.html`,
  `login.css`.
- Tests use the `.spec.ts` suffix next to their subject — `auth.service.spec.ts`,
  `email.validator.spec.ts`.

### 2.2 Components

| Kind | Class name | Selector | Example |
| --- | --- | --- | --- |
| **Routed page** | `…Page` suffix | `app-…` | `LoginPage` → `app-login`; `TravelPlanPage` → `app-travel-plan` |
| **Reusable component** | descriptive, **no suffix** | `app-…` | `Navbar`, `FlightCard` (`app-flight-card`), `WeatherBanner` (`app-weather-banner`) |

- **Routed page components** end in `Page` and live under `features/…`. They are the targets of
  routes in [`app.routes.ts`](../src/app/app.routes.ts) (e.g. `LoginPage`, `SignupPage`,
  `TripFormPage`, `MyTripsPage`, `TravelPlanPage`).
- **Reusable components** get descriptive names with no suffix (`Navbar`, `Footer`, `FlightCard`,
  `HotelCard`, `WeatherBanner`, `InteractiveMap`, `Toast`).
- Every selector uses the `app-` prefix.

### 2.3 Services, guards, models, validators

| Kind | Convention | Location | Example |
| --- | --- | --- | --- |
| **Service** | `…Service` class | `core/services/` | `AuthService`, `TripService`, `ToastService`, `PdfExportService` |
| **Functional guard** | camelCase `…Guard` | `core/guards/` | `authGuard` (a `CanActivateFn`) |
| **Model** | PascalCase `interface` / `type` | `core/models/` | `UserTrip`, `FlightInfo`, `DayPlan`, `TripStatus` |
| **Validator** | camelCase `…Validator` fn | `core/validators/` | `emailValidator`, `passwordMatchValidator`, `dateRangeValidator` |

- **Guards are functional** (not class-based). `authGuard` is a `CanActivateFn` that uses `inject()`:

  ```ts
  export const authGuard: CanActivateFn = (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isLoggedIn()) return true;
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  };
  ```

- **Models are PascalCase interfaces** (with supporting `type` unions like `TripStatus`), one concept
  per file, all re-exported from the barrel [`core/models/index.ts`](../src/app/core/models/index.ts).
- **Validators are pure functions** returning `ValidationErrors | null` (see
  [`email.validator.ts`](../src/app/core/validators/email.validator.ts)).

### 2.4 Identifiers

- **Constants:** `UPPER_SNAKE_CASE` — e.g. `REMEMBERED_EMAIL_KEY`, `DEFAULT_DURATION_MS`, `DAY_MS`,
  `EMAIL_PATTERN`, `MOCK_TRIPS`.
- **Methods, variables, signals, inputs:** `camelCase` — e.g. `selectedDayIndex`, `budgetPercent`,
  `exportToPDF`, `lightBg`.
- **Types, interfaces, enums, classes:** `PascalCase`.

---

## 3. Project conventions

- **Standalone components only.** No `NgModule`s. Each component sets `standalone: true` and lists its
  own `imports`.
- **Prefer `inject()`** over constructor parameter injection for services in new code:

  ```ts
  private readonly tripService = inject(TripService);
  private readonly toast = inject(ToastService);
  ```

  (Some existing components still use constructor injection — e.g. `Navbar` — which is fine, but new
  code should favour `inject()`.)
- **Signals for state.** Hold component/view state in `signal()` / `computed()` and expose
  read-only signals from services (e.g. `ToastService.current = this._current.asReadonly()`).
- **`OnPush` for presentational components.** Input-driven, side-effect-free components set
  `changeDetection: ChangeDetectionStrategy.OnPush` (e.g. `FlightCard`, `Toast`). Page components that
  own signal state may use the default strategy.
- **One model per file, re-exported from the barrel.** Add the interface in its own file under
  `core/models/`, then add an `export * from './…'` line to `index.ts`. Import models from the barrel:

  ```ts
  import { UserTrip } from '../../core/models';
  ```

- **Feature-first folders.** Group by feature under `features/…` (e.g. `features/auth/login`,
  `features/my-trips/travel-plan`), each owning its `.ts` / `.html` / `.css`.
- **Layering — put code where it belongs:**
  - `core/` — cross-cutting singletons: `services/`, `guards/`, `models/`, `validators/`, mock `data/`.
  - `layout/` — app chrome that frames every page: `navbar/`, `footer/`.
  - `shared/` — reusable, presentational UI used across features: `toast/`, `legal-page/`.
  - `features/` — the routed feature areas.
- **Keep the service contract stable.** Services like `TripService` return domain types from mock
  data today; swapping in HTTP later should not change the method signatures or the call sites.

---

## 4. Code style

- **TypeScript strict mode is on.** [`tsconfig.json`](../tsconfig.json) enables `strict` plus
  `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
  `noPropertyAccessFromIndexSignature`, and Angular `strictTemplates` / `strictInjectionParameters`.
  Code must compile cleanly under these.
- **No `any`.** Use precise types, generics, or `unknown` with narrowing. Models already exist for
  domain data — use them.
- **No `console.log` in committed code.** Remove debug logging before committing; surface
  user-facing messages through `ToastService` instead.
- **Prettier** (config in [`package.json`](../package.json)):
  - `printWidth: 100`
  - `singleQuote: true`
  - `*.html` formatted with the `angular` parser.

  Format before committing so diffs stay clean:

  ```bash
  npx prettier --write "src/**/*.{ts,html,css}"
  ```

- **Prefer modern control flow** (`@if` / `@for` / `@else`) and `track` expressions in templates, as
  used throughout the app.
- **Doc comments.** Add a short JSDoc summary on components, services, guards, and validators (see the
  existing files for the house style).

---

## 5. Git & pull-request guidelines

### 5.1 Branches

- Branch off `main`. Name branches by intent:
  - `feature/<short-description>` — new functionality (e.g. `feature/trip-form`).
  - `fix/<short-description>` — bug fixes.
  - `docs/<short-description>` — documentation-only changes.

### 5.2 Commits

- Write clear, conventional-ish messages: a concise, imperative subject, optionally prefixed with a
  type (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`). Example:
  `feat(my-trips): add empty state to trips grid`.
- Keep commits focused and logically grouped.

### 5.3 Pull requests

- **Keep PRs focused** — one feature or fix per PR; avoid drive-by refactors.
- **Both checks must pass:** `npm run build` and `npm test`.
- Strip debug code (`console.log`) and run Prettier.
- **Update docs when structure changes** — if you add/rename routes, services, models, or move
  folders, update the relevant file under `docs/` (this guide,
  [./architecture.md](./architecture.md), or [./project-structure.md](./project-structure.md)).
- Describe the change, the reasoning, and any screenshots for UI work.

---

## 6. How-to recipes

### 6.1 Add a new page

1. **Generate** the component under the right feature folder:

   ```bash
   ng generate component features/<area>/<name>
   ```

2. **Rename to project conventions:** class `…Page`, selector `app-…`, files without the
   `.component.` infix (`<name>.ts` / `.html` / `.css`).

   ```ts
   @Component({
     selector: 'app-help-center',
     standalone: true,
     imports: [/* RouterLink, FormsModule, … */],
     templateUrl: './help-center.html',
     styleUrl: './help-center.css',
   })
   export class HelpCenterPage {}
   ```

3. **Register a route** in [`app.routes.ts`](../src/app/app.routes.ts). Public route, or guarded with
   `authGuard` if it requires sign-in:

   ```ts
   // public
   { path: 'help', component: HelpCenterPage },
   // protected
   { path: 'help', component: HelpCenterPage, canActivate: [authGuard] },
   ```

   Guarded routes redirect logged-out users to `/login` with a `returnUrl` automatically.

   > **Note:** by current product decision **no routes are guarded** — every page is publicly
   > browsable and `app.routes.ts` does not import `authGuard`. Authentication is enforced only at
   > the save-plan action (`ChatPage.savePlan()`). The `authGuard` above remains available and
   > unit-tested for future use; the snippet is general guidance for if/when a route needs it.

4. **Cover the states** — implement loading / empty / not-found as needed (see
   [./ui-ux-guidelines.md](./ui-ux-guidelines.md) §5.1).

### 6.2 Add a new service

1. Create it under `core/services/` as `<name>.service.ts`, `providedIn: 'root'`, signal-based:

   ```ts
   @Injectable({ providedIn: 'root' })
   export class FavoritesService {
     private readonly _ids = signal<string[]>([]);
     readonly ids = this._ids.asReadonly();

     add(id: string): void {
       this._ids.update((list) => (list.includes(id) ? list : [...list, id]));
     }
   }
   ```

2. Keep method signatures backend-agnostic so a real API can replace the body later without touching
   callers (mirror `TripService`).
3. Inject it where needed with `inject(FavoritesService)`.
4. Add a `<name>.service.spec.ts` and keep `npm test` green.

### 6.3 Add a new model

1. Create one file per concept under `core/models/` (PascalCase interface, plus any `type` unions):

   ```ts
   // core/models/booking.ts
   export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

   export interface Booking {
     id: string;
     tripId: string;
     status: BookingStatus;
   }
   ```

2. Re-export it from the barrel [`core/models/index.ts`](../src/app/core/models/index.ts):

   ```ts
   export * from './booking';
   ```

3. Import from the barrel, not the individual file:

   ```ts
   import { Booking } from '../../core/models';
   ```

---

## 7. Checklist before opening a PR

- [ ] Files are kebab-case with no `.component.` infix; classes follow the page/reusable/service rules.
- [ ] Standalone component, `inject()`, signals, and `OnPush` where appropriate.
- [ ] New models live in `core/models/` and are exported from the barrel.
- [ ] No `any`; compiles under strict mode; no `console.log`.
- [ ] Prettier run (`printWidth 100`, single quotes).
- [ ] `npm run build` passes.
- [ ] `npm test` passes.
- [ ] Docs updated if structure/routes/conventions changed.

See also: [./ui-ux-guidelines.md](./ui-ux-guidelines.md) · [./architecture.md](./architecture.md) ·
[./project-structure.md](./project-structure.md)
