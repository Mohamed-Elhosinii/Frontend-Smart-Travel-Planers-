# Service Contracts (the current "API")

This document is the authoritative reference for the **client-side service
contracts** in [`src/app/core/services`](../../src/app/core/services). While
TripMind has no HTTP backend, these services *are* the API: every component
reads and writes data through them.

All services are tree-shakable singletons (`@Injectable({ providedIn: 'root' })`)
and are consumed via Angular dependency injection (typically the `inject()`
function). State is exposed as **read-only signals**; mutations go through
explicit methods.

- [Domain models](#domain-models)
- [AuthService](#authservice)
- [TripService](#tripservice)
- [ChatService](#chatservice)
- [UserProfileService](#userprofileservice)
- [PreferencesService](#preferencesservice)
- [ToastService](#toastservice)
- [PdfExportService](#pdfexportservice)

---

## Domain models

The interfaces below are defined in
[`src/app/core/models`](../../src/app/core/models) and re-exported from the
barrel file `models/index.ts`. They are the shapes returned and accepted by the
services, and the basis for every JSON example in
[`rest-endpoints.md`](./rest-endpoints.md).

### `UserTrip`

A fully planned trip belonging to the user. `country`, `flight`, and `hotel` are
optional.

```ts
export type TripStatus = 'upcoming' | 'ongoing' | 'completed';

export interface UserTrip {
  id: string;
  destination: string;
  country?: string;
  from: string;
  departureDate: string;   // ISO date, e.g. "2026-07-15"
  returnDate: string;      // ISO date, e.g. "2026-07-18"
  coverImage: string;      // image URL
  totalBudget: number;
  spentBudget: number;
  travelStyle: string[];   // e.g. ["cultural", "foodie"]
  days: DayPlan[];
  status: TripStatus;
  flight?: FlightInfo;
  hotel?: HotelInfo;
}
```

### `DayPlan`

One day of a trip itinerary. `weather` is optional.

```ts
export interface DayPlan {
  dayNumber: number;
  date: string;            // display date, e.g. "July 15 — Wednesday"
  title: string;
  activities: Activity[];
  weather?: Weather;
}
```

### `Activity`

A single scheduled item within a day (a sight, a meal, a transfer). `cost` is
optional. `id` is generated per trip (`"<tripId>-d<dayNumber>-a<index>"`).

```ts
export type ActivityType =
  | 'sightseeing'
  | 'food'
  | 'transport'
  | 'hotel'
  | 'activity';

export type ActivityCategory =
  | 'food'
  | 'attraction'
  | 'hotel'
  | 'transport'
  | 'leisure';

export interface Activity {
  id: string;              // stable id, used for list tracking & map markers
  time: string;            // e.g. "10:00 AM"
  title: string;
  locationName: string;
  lat: number;
  lng: number;
  description: string;
  type: ActivityType;
  category: ActivityCategory;
  icon: string;            // emoji shown on the timeline dot / map marker
  cost?: number;
}
```

### `Weather`

Daily forecast attached to a day plan. Temperatures are in degrees Celsius.

```ts
export interface Weather {
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;       // e.g. "Sunny", "Light Rain"
  iconUrl: string;         // forecast icon URL (e.g. OpenWeatherMap)
  aiTip: string;           // short AI-generated packing/planning tip
}
```

### `FlightInfo`

Summary of the outbound flight for a trip.

```ts
export interface FlightInfo {
  airline: string;
  flightNumber: string;
  departure: string;       // e.g. "Cairo (CAI)"
  arrival: string;         // e.g. "Paris Charles de Gaulle (CDG)"
  departureTime: string;   // e.g. "09:10"
  arrivalTime: string;     // e.g. "13:05"
}
```

### `HotelInfo`

Summary of the booked accommodation for a trip.

```ts
export interface HotelInfo {
  name: string;
  address: string;
  stars: number;           // star rating, 1–5
  checkIn: string;         // e.g. "July 15"
  checkOut: string;        // e.g. "July 18"
  rating: number;          // guest review score, 0–10
}
```

### `UserProfile`

The signed-in user's editable profile.

```ts
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  avatarUrl: string;       // avatar image URL or base64 data URL
}
```

### `NotificationPreferences`

The user's notification & communication preferences.

```ts
export interface NotificationPreferences {
  emailTripReminders: boolean;
  emailMarketing: boolean;
  pushTravelAlerts: boolean;
  smsImportantUpdates: boolean;
}
```

### `TripData`

Raw form payload captured by the trip planner **before** an itinerary is
generated. This is the intended request body for a future `POST /trips` (see
[rest-endpoints.md](./rest-endpoints.md#post-trips-future)). No service consumes
it yet; it is produced by the trip-planner form.

```ts
export interface TripData {
  from: string;
  to: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  rooms: number;
  travelStyle: string[];
  budget: string;
  specialRequests: string;
}
```

### Chat models

Used by `ChatService`. A `ChatMessage` may carry an inline `ChatItinerary` when
the assistant returns a draft plan.

```ts
export interface ChatItinerary {
  destination: string;
  duration: string;        // e.g. "4 Days"
  budget: string;          // e.g. "EUR 680 (Moderate)"
  days: {
    dayNum: number;
    title: string;
    activities: string[];
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;            // display timestamp, e.g. "03:00 PM"
  isItinerary?: boolean;
  itineraryData?: ChatItinerary;
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
}
```

---

## AuthService

> File: [`auth.service.ts`](../../src/app/core/services/auth.service.ts)

Mock authentication. A "session" is just the signed-in email persisted to
`localStorage` under the key `stp_session_email`. The login/register methods are
designed to be replaced with real HTTP calls (returning a token) **without
changing the public signal surface**.

### Supporting types

```ts
export interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
}
```

### Public surface

| Member | Signature | Description |
| --- | --- | --- |
| `currentEmail` | `Signal<string \| null>` | The signed-in user's email, or `null` when logged out. Read-only. |
| `isLoggedIn` | `Signal<boolean>` | `computed` — `true` while `currentEmail()` is non-null. |
| `login` | `login(credentials: Credentials): boolean` | Mock sign-in. |
| `register` | `register(data: RegistrationData): boolean` | Mock registration. |
| `signInWithGoogle` | `signInWithGoogle(googleProfile?: GoogleProfile): boolean` | Mock "Continue with Google" (registers a demo Google account). |
| `logout` | `logout(): void` | Clears the session. |

```ts
readonly currentEmail: Signal<string | null>;
readonly isLoggedIn: Signal<boolean>;

login(credentials: Credentials): boolean;
register(data: RegistrationData): boolean;
signInWithGoogle(googleProfile?: GoogleProfile): boolean;
logout(): void;
```

### Behavior

- **`login(credentials)`** — succeeds (`true`) for any **non-empty, trimmed
  email and non-empty password**; otherwise returns `false` and does nothing.
  On success, the trimmed email is set on `currentEmail` and persisted to
  `stp_session_email`. There is no password check — any password is accepted.
- **`register(data)`** — same validation as `login` (only `email` and
  `password` are checked; `fullName` is accepted but not validated or stored).
  On success it persists a session for the new account, immediately logging the
  user in.
- **`signInWithGoogle(googleProfile?)`** — mock "Continue with Google". With no
  backend there is no real OAuth, so it calls `register()` with a demo Google
  account (`demo.user@gmail.com`) by default, immediately logging the user in.
  Wire Google Identity Services and pass a decoded-JWT profile to make it real.
- **`logout()`** — sets `currentEmail` to `null` and removes
  `stp_session_email`.
- **Session restore** — on construction the service reads `stp_session_email`,
  so a previously signed-in user stays logged in across refreshes.
- All `localStorage` access is guarded; if storage throws, the session is held
  in memory only.

Maps onto [`POST /auth/login`](./rest-endpoints.md#post-authlogin),
[`POST /auth/register`](./rest-endpoints.md#post-authregister), and
[`POST /auth/logout`](./rest-endpoints.md#post-authlogout).

---

## TripService

> File: [`trip.service.ts`](../../src/app/core/services/trip.service.ts)

Read access to the user's trips. Currently reads from in-memory mock data
(`MOCK_TRIPS`). The method bodies are meant to be replaced with HTTP calls
returning the same types — callers won't change.

### Public surface

| Member | Signature | Description |
| --- | --- | --- |
| `getAll` | `getAll(): UserTrip[]` | All trips belonging to the user. |
| `getById` | `getById(id: string): UserTrip \| undefined` | A single trip by id, or `undefined` if it does not exist. |

```ts
getAll(): UserTrip[];
getById(id: string): UserTrip | undefined;
```

### Behavior

- **`getAll()`** — returns the full mock trip list (`trip-1` Paris, `trip-2`
  Dubai, `trip-3` Rome) synchronously.
- **`getById(id)`** — linear lookup by `UserTrip.id`; returns `undefined` for an
  unknown id (callers treat this as "not found").

> **Async note:** both methods are synchronous today. When backed by HTTP they
> will return `Observable<UserTrip[]>` / `Observable<UserTrip>` (or `Promise`),
> so callers should already treat trip retrieval as a potentially asynchronous,
> potentially failing operation.

Maps onto [`GET /trips`](./rest-endpoints.md#get-trips) and
[`GET /trips/{id}`](./rest-endpoints.md#get-tripsid).

---

## ChatService

> File: [`chat.service.ts`](../../src/app/core/services/chat.service.ts)

Holds the AI co-pilot conversation and a **demo itinerary planner**. The "AI" is
a deterministic keyword matcher (Rome / Tokyo / Maldives / Paris) standing in for
a real planning backend. The message store is a signal so the conversation
survives navigation.

### Constants & static data

| Member | Type | Description |
| --- | --- | --- |
| `ASSISTANT_REPLY_DELAY_MS` | `const number` (`1500`) | Exported delay the UI uses to simulate the assistant "thinking". |
| `suggestions` | `string[]` | Prompt chips shown in the empty chat. |
| `history` | `ChatSession[]` | Mock list of past conversations for the sidebar. |

### Public surface

| Member | Signature | Description |
| --- | --- | --- |
| `messages` | `Signal<ChatMessage[]>` | The conversation, seeded with a welcome message. Read-only. |
| `addUserMessage` | `addUserMessage(text: string): void` | Append a user message. |
| `addAssistantReply` | `addAssistantReply(userText: string): void` | Build and append the assistant's reply to the given user input. |
| `reset` | `reset(): void` | Clear the conversation and start fresh. |

```ts
readonly messages: Signal<ChatMessage[]>;

addUserMessage(text: string): void;
addAssistantReply(userText: string): void;
reset(): void;
```

### Behavior

- **`messages`** — initialized with a single assistant welcome message. Every
  mutation replaces the array immutably so the signal fires.
- **`addUserMessage(text)`** — appends `{ sender: 'user', text, ... }` with a
  generated id (`"m1"`, `"m2"`, …) and a formatted local time.
- **`addAssistantReply(userText)`** — runs `userText` through the keyword
  matcher:
  - If a destination matches, it appends an assistant message with
    `isItinerary: true` and an `itineraryData: ChatItinerary` payload.
  - Otherwise it appends a plain small-talk reply (a budget-aware hint or a
    generic prompt for more detail).
- **`reset()`** — replaces the conversation with just the welcome message.

Maps onto [`POST /chat/messages`](./rest-endpoints.md#post-chatmessages), which
in a real backend returns the assistant reply (and itinerary) instead of
computing it client-side.

---

## UserProfileService

> File: [`user-profile.service.ts`](../../src/app/core/services/user-profile.service.ts)

Owns the signed-in user's profile, persisted to `localStorage` (`stp_profile`)
so edits survive a refresh. Seeds a default profile on first run.

### Public surface

| Member | Signature | Description |
| --- | --- | --- |
| `profile` | `Signal<UserProfile>` | The current profile. Read-only. |
| `update` | `update(profile: UserProfile): void` | Persist a full profile update. |

```ts
readonly profile: Signal<UserProfile>;

update(profile: UserProfile): void;
```

### Behavior

- **`profile`** — initialized from `stp_profile` if present (merged over the
  built-in default so newly added fields are always populated), otherwise the
  default profile.
- **`update(profile)`** — replaces the whole profile (a shallow copy is stored),
  updates the signal, and writes the JSON to `stp_profile`. This is a full
  replace, not a partial patch.
- `localStorage` access is guarded; on failure the profile is kept in memory
  only.

Maps onto [`GET /me`](./rest-endpoints.md#get-me) and
[`PUT /me`](./rest-endpoints.md#put-me).

---

## PreferencesService

> File: [`preferences.service.ts`](../../src/app/core/services/preferences.service.ts)

Owns the user's notification preferences, persisted to `localStorage`
(`stp_preferences`). Structurally identical to `UserProfileService`.

### Public surface

| Member | Signature | Description |
| --- | --- | --- |
| `preferences` | `Signal<NotificationPreferences>` | Current preferences. Read-only. |
| `update` | `update(preferences: NotificationPreferences): void` | Persist a full preferences update. |

```ts
readonly preferences: Signal<NotificationPreferences>;

update(preferences: NotificationPreferences): void;
```

### Behavior

- **`preferences`** — initialized from `stp_preferences` (merged over defaults),
  else the defaults: `emailTripReminders: true`, `emailMarketing: false`,
  `pushTravelAlerts: true`, `smsImportantUpdates: false`.
- **`update(preferences)`** — full replace: stores a shallow copy, updates the
  signal, and writes JSON to `stp_preferences`.
- `localStorage` access is guarded.

Maps onto [`PUT /me/preferences`](./rest-endpoints.md#put-mepreferences).

---

## ToastService

> File: [`toast.service.ts`](../../src/app/core/services/toast.service.ts)

App-wide toast/alert state. A single toast is shown at a time and auto-dismisses.
Consumed by the shared `<app-toast>` component; raised from anywhere via DI.
**This is pure UI state — it has no backend counterpart.**

### Supporting types

```ts
export type ToastType = 'success' | 'danger';

export interface Toast {
  type: ToastType;
  message: string;
}
```

### Public surface

| Member | Signature | Description |
| --- | --- | --- |
| `current` | `Signal<Toast \| null>` | The currently displayed toast, or `null`. Read-only. |
| `success` | `success(message: string, durationMs?: number): void` | Show a success toast. |
| `danger` | `danger(message: string, durationMs?: number): void` | Show an error toast. |
| `show` | `show(toast: Toast, durationMs?: number): void` | Show an arbitrary toast. |
| `clear` | `clear(): void` | Dismiss the current toast immediately. |

```ts
readonly current: Signal<Toast | null>;

success(message: string, durationMs?: number): void;   // default 4000 ms
danger(message: string, durationMs?: number): void;     // default 4000 ms
show(toast: Toast, durationMs?: number): void;          // default 4000 ms
clear(): void;
```

### Behavior

- **`success` / `danger`** — convenience wrappers over `show` with the type
  preset.
- **`show(toast, durationMs)`** — sets `current` to the toast and schedules an
  auto-clear after `durationMs` (default `4000`). Calling `show` again resets the
  timer, so a new toast replaces any visible one.
- **`clear()`** — cancels the timer and sets `current` to `null`.

---

## PdfExportService

> File: [`pdf-export.service.ts`](../../src/app/core/services/pdf-export.service.ts)

Renders a trip itinerary to a downloadable PDF using
[jsPDF](https://github.com/parallax/jsPDF). **Entirely client-side — no backend
involved.**

### Public surface

| Member | Signature | Description |
| --- | --- | --- |
| `exportTrip` | `exportTrip(trip: UserTrip): Promise<void>` | Build and trigger download of the trip's PDF itinerary. |

```ts
exportTrip(trip: UserTrip): Promise<void>;
```

### Behavior

- jsPDF is **dynamically imported** inside `exportTrip`, so it never loads during
  server-side rendering and stays out of the initial bundle.
- The document is laid out from the `UserTrip`: a branded header band
  (destination + date range), a summary block (flight + hotel, if present), and a
  day-by-day timeline of each `Activity` (time, location, description), paginating
  as needed.
- The file is saved as `Itinerary_<destination>.pdf` (spaces replaced with
  underscores) via the browser download mechanism.
- Emoji are intentionally omitted from the PDF (jsPDF's core fonts cannot render
  them).
- The returned `Promise` **rejects on failure** (e.g. the dynamic import or
  rendering throws); callers are expected to `await`/`catch` and surface feedback
  (typically via `ToastService`).
