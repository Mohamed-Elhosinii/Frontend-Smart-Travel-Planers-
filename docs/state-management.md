# State Management

TripMind manages all shared state with **Angular signals** held inside singleton services
(`providedIn: 'root'`). There is **no NgRx, no Redux, no external store library**. This
document describes the pattern, the per-service signal surface, how components consume it, and
why this approach was chosen.

- [The pattern](#the-pattern)
- [The read-only signal pattern](#the-read-only-signal-pattern)
- [Service-by-service signal surface](#service-by-service-signal-surface)
- [How components consume state](#how-components-consume-state)
- [Persistence](#persistence)
- [Why signals-in-services instead of a store library](#why-signals-in-services-instead-of-a-store-library)

---

## The pattern

Every piece of shared state follows the same shape:

1. A service is annotated `@Injectable({ providedIn: 'root' })`, making it a lazily-created
   **singleton** for the whole app.
2. State is stored in a **private** writable `signal` (the underscore-prefixed `_field`).
3. The service exposes a **public, read-only** view via `.asReadonly()` (or a `computed`).
4. State is changed **only** through the service's methods, which call `.set()`/`.update()`.
5. Components read the public signal in their templates; Angular re-renders the parts that
   depend on it whenever it changes.

```ts
@Injectable({ providedIn: 'root' })
export class ExampleService {
  private readonly _value = signal(initial);   // writable, private
  readonly value = this._value.asReadonly();   // read-only, public

  set(next: T): void {                         // the only mutation path
    this._value.set(next);
  }
}
```

This keeps mutation centralised and makes the data flow easy to follow:
`component → service method → signal → template`. See the
[data-flow section of architecture.md](./architecture.md#data-flow).

---

## The read-only signal pattern

Services never hand a writable signal to a component. Each writable `signal` stays private and
is re-exposed through `asReadonly()` (for stored values) or `computed()` (for derived values):

```ts
private readonly _email = signal<string | null>(this.restoreSession());

/** The signed-in user's email, or `null` when logged out. */
readonly currentEmail = this._email.asReadonly();

/** Whether a user is currently signed in. */
readonly isLoggedIn = computed(() => this._email() !== null);
```

The benefit: consumers can **read and react** to the value but cannot mutate it out from under
the service. All writes funnel through intent-revealing methods (`login`, `logout`,
`update`, `addUserMessage`, …), so invariants and persistence live in exactly one place.

---

## Service-by-service signal surface

All services live in `src/app/core/services/`. The signal/computed members and their mutation
methods:

### `AuthService` — [`auth.service.ts`](../src/app/core/services/auth.service.ts)

Owns the mock authentication session.

| Member | Kind | Description |
| --- | --- | --- |
| `currentEmail` | `Signal<string \| null>` | The signed-in user's email, or `null` when logged out. |
| `isLoggedIn` | `Signal<boolean>` (computed) | `true` when `currentEmail` is non-null. Used by the navbar and the save-plan check (`ChatPage.savePlan()`); also read by the still-present-but-unwired `authGuard`. |
| `login(credentials): boolean` | method | Mock sign-in; succeeds for any non-empty, well-formed credentials. Persists the email. |
| `register(data): boolean` | method | Mock registration; persists a session for the new account. |
| `signInWithGoogle(profile?): boolean` | method | Mock "Continue with Google"; registers a demo Google account and persists a session. |
| `logout(): void` | method | Clears the session signal and `localStorage`. |

Persists the email to `localStorage` key **`stp_session_email`**.

### `TripService` — [`trip.service.ts`](../src/app/core/services/trip.service.ts)

Stateless accessor over the mock trip dataset (no signals — trips are static while there is no
backend).

| Member | Kind | Description |
| --- | --- | --- |
| `getAll(): UserTrip[]` | method | All trips belonging to the user. |
| `getById(id): UserTrip \| undefined` | method | One trip by id, or `undefined`. |

Reads from `MOCK_TRIPS` in [`core/data/mock-trips.data.ts`](../src/app/core/data/mock-trips.data.ts).

### `ChatService` — [`chat.service.ts`](../src/app/core/services/chat.service.ts)

Holds the chat conversation and the deterministic demo planner.

| Member | Kind | Description |
| --- | --- | --- |
| `messages` | `Signal<ChatMessage[]>` | The live conversation; a signal so it survives navigation. |
| `suggestions` | `string[]` | Static prompt chips shown in the chat UI. |
| `history` | `ChatSession[]` | Static list of past sessions for the history sidebar. |
| `addUserMessage(text): void` | method | Appends a user message. |
| `addAssistantReply(text): void` | method | Builds and appends the assistant's reply (with an inline itinerary when a keyword matches). |
| `reset(): void` | method | Clears the conversation back to the welcome message. |

The "AI" is a keyword matcher (`matchItinerary`) — the documented swap point for a real
streaming API.

### `UserProfileService` — [`user-profile.service.ts`](../src/app/core/services/user-profile.service.ts)

Owns the editable account profile.

| Member | Kind | Description |
| --- | --- | --- |
| `profile` | `Signal<UserProfile>` | The current profile (read-only). |
| `update(profile): void` | method | Persists a full profile update. |

Persists to `localStorage` key **`stp_profile`** (merged over sensible defaults).

### `PreferencesService` — [`preferences.service.ts`](../src/app/core/services/preferences.service.ts)

Owns notification & communication preferences.

| Member | Kind | Description |
| --- | --- | --- |
| `preferences` | `Signal<NotificationPreferences>` | Current preferences (read-only). |
| `update(preferences): void` | method | Persists a full preferences update. |

Persists to `localStorage` key **`stp_preferences`**.

### `ToastService` — [`toast.service.ts`](../src/app/core/services/toast.service.ts)

App-wide, single-toast notification state.

| Member | Kind | Description |
| --- | --- | --- |
| `current` | `Signal<Toast \| null>` | The currently displayed toast, or `null`. |
| `success(msg): void` | method | Show a success toast. |
| `danger(msg): void` | method | Show an error toast. |
| `show(toast): void` | method | Show an arbitrary toast (resets the dismiss timer). |
| `clear(): void` | method | Hide the current toast immediately. |

A single toast is shown at a time and **auto-dismisses after 4 s**. Rendered once by
`<app-toast>` in the app shell; raised from anywhere via DI.

### `PdfExportService` — [`pdf-export.service.ts`](../src/app/core/services/pdf-export.service.ts)

Stateless side-effect service (no signals).

| Member | Kind | Description |
| --- | --- | --- |
| `exportTrip(trip): Promise<void>` | method | Renders a trip itinerary to a downloadable PDF; **dynamically** `import('jspdf')`. |

---

## How components consume state

Components inject a service with `inject()` (or via the constructor) and read its signals
directly in the template — no `subscribe`, no `async` pipe, no manual teardown.

**Reading shared state** (the navbar reacts to auth):

```ts
export class Navbar {
  constructor(public readonly authService: AuthService) {}
  logout(): void { this.authService.logout(); }
}
```

```html
@if (authService.isLoggedIn()) {
  <button (click)="logout()">Log out</button>
}
```

**Deriving local view state** from shared state with `computed` (the itinerary page):

```ts
export class TravelPlanPage implements OnInit {
  private readonly tripService = inject(TripService);

  readonly trip = signal<UserTrip | null>(null);
  readonly selectedDayIndex = signal(0);

  readonly currentDayPlan = computed(() => {
    const t = this.trip();
    if (!t || t.days.length === 0) return null;
    return t.days[this.selectedDayIndex()] ?? null;
  });
  readonly budgetPercent = computed(() => {
    const t = this.trip();
    if (!t || t.totalBudget === 0) return 0;
    return Math.min(100, Math.round((t.spentBudget / t.totalBudget) * 100));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const trip = id ? this.tripService.getById(id) : undefined;
    trip ? this.trip.set(trip) : this.notFound.set(true);
  }
}
```

Here `selectDay(i)` simply calls `this.selectedDayIndex.set(i)` and the whole derived chain
(`currentDayPlan`, `currentDayActivities`, `currentDayWeather`) recomputes automatically — the
template updates with no extra wiring.

---

## Persistence

State that must outlive a refresh is mirrored to `localStorage` by the owning service, always
behind try/catch guards so a storage failure (private mode, SSR) degrades to in-memory-only:

| Service | `localStorage` key | Stored |
| --- | --- | --- |
| `AuthService` | `stp_session_email` | Signed-in email (the "session"). |
| `UserProfileService` | `stp_profile` | The user's profile (JSON). |
| `PreferencesService` | `stp_preferences` | Notification preferences (JSON). |

`ChatService` state is intentionally **in-memory only** (it resets on reload), and `ToastService`
is ephemeral by design.

> Note: `LoginPage` separately persists a "remember me" email under `stp_remembered_email` to
> pre-fill the sign-in form — this is view convenience, not application state.

---

## Why signals-in-services instead of a store library

At TripMind's scale, signals-in-services is the right trade-off:

- **The app is small and state is naturally partitioned.** Auth, trips, chat, profile, and
  preferences are independent concerns, each cleanly owned by one service. There is no large,
  interdependent global state graph that would benefit from a single store, actions, and
  reducers.
- **Less ceremony, same guarantees.** The read-only signal pattern already gives us
  unidirectional flow and a single mutation path per slice of state — the core benefits of a
  store — without actions, reducers, effects, selectors, or boilerplate.
- **Fine-grained, glitch-free reactivity built in.** Angular signals are the framework's
  native reactivity primitive. `computed` values update synchronously and consistently, and
  templates re-render only where a read actually changed — no `OnPush` plumbing or `async`
  pipes required.
- **Smaller bundle, fewer dependencies.** No store library to ship, learn, or keep updated.
- **A clean upgrade path.** Each service is also the documented
  [mock-to-backend seam](./architecture.md#the-mock-to-backend-seam). When a real API arrives,
  the service methods change but the public signal surface — and therefore every consuming
  component — stays the same. If global state ever genuinely outgrows this model, individual
  services can adopt a heavier solution in isolation without a rewrite.

In short: the simplest thing that gives unidirectional, reactive, testable state — and nothing
more.
