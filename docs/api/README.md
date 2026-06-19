# TripMind — Data & API Layer

This directory documents TripMind's data layer: how the app reads and writes
data today, and the REST API the app is designed to grow into.

## There is no HTTP backend yet

TripMind is a standalone Angular 20 single-page app. **It currently makes no
network calls for application data.** Everything is served from two sources:

- **In-memory mock data** — `src/app/core/data/mock-trips.data.ts` is the single
  source of truth for trips while the app runs without a server.
- **Browser `localStorage`** — the signed-in session, profile, and notification
  preferences survive a page refresh by being written to `localStorage`.

All of this is accessed exclusively through injectable Angular services in
[`src/app/core/services`](../../src/app/core/services). No component reads mock
data or touches `localStorage` directly.

## The service layer is the backend seam

The services in `src/app/core/services` are deliberately written as the **seam**
where a real HTTP backend will plug in. Each data-access method returns the
domain model types defined in
[`src/app/core/models`](../../src/app/core/models). When a backend is added, the
method *bodies* are replaced with HTTP calls that return those same types — the
public signatures (and therefore every calling component) stay unchanged.

```
Components ──▶ core/services ──┬─▶ (today)  mock data + localStorage
                               └─▶ (future) HttpClient → REST API  (/api/v1)
```

Because of this design, the **current service contracts double as the de-facto
API**, and the proposed REST endpoints are a near-mechanical mapping of those
same method signatures onto HTTP.

## Services

| Service | File | Responsibility | Persistence |
| --- | --- | --- | --- |
| `AuthService` | `auth.service.ts` | Sign-in / sign-up / sign-out; exposes session state | `localStorage` (session email) |
| `TripService` | `trip.service.ts` | Read access to the user's trips | In-memory mock data |
| `ChatService` | `chat.service.ts` | AI co-pilot conversation state + demo itinerary planner | In-memory (signal) |
| `UserProfileService` | `user-profile.service.ts` | The signed-in user's editable profile | `localStorage` |
| `PreferencesService` | `preferences.service.ts` | Notification / communication preferences | `localStorage` |
| `ToastService` | `toast.service.ts` | App-wide toast/alert state | In-memory (signal) |
| `PdfExportService` | `pdf-export.service.ts` | Render a trip itinerary to a downloadable PDF | None (client-side jsPDF) |

See [`services.md`](./services.md) for full method/signal signatures and behavior.

## `localStorage` keys

The app reads and writes exactly three keys. They are namespaced with the
`stp_` prefix (Smart Travel Planner).

| Key | Owner | Stored value | Format |
| --- | --- | --- | --- |
| `stp_session_email` | `AuthService` | Signed-in user's email (presence implies "logged in") | Plain string |
| `stp_profile` | `UserProfileService` | The user's `UserProfile` | JSON |
| `stp_preferences` | `PreferencesService` | The user's `NotificationPreferences` | JSON |

All access is wrapped in `try/catch` so the app degrades gracefully to
in-memory-only state when storage is unavailable (e.g. server-side rendering or
browser privacy mode).

> **Migration note:** when the REST API lands, `stp_session_email` is replaced by
> a Bearer access token (see the [authentication note](./rest-endpoints.md#authentication)),
> while `stp_profile` and `stp_preferences` become server-owned resources fetched
> from `GET /me` and `PUT /me/preferences`.

## Documents in this directory

- [`README.md`](./README.md) — this overview.
- [`services.md`](./services.md) — current client-side service contracts and the
  domain model interfaces.
- [`rest-endpoints.md`](./rest-endpoints.md) — the proposed REST API the services
  map onto once a backend is added, with request/response examples and error
  handling.

## Related

- [Architecture overview](../architecture.md) — how the app is structured
  end-to-end (modules, routing, components, and where this data layer fits).
