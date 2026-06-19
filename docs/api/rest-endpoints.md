# Proposed REST API

> **Status: design proposal.** None of these endpoints exist yet — TripMind has
> no HTTP backend (see the [overview](./README.md)). This document defines the
> REST API the [client services](./services.md) are intended to swap onto. When
> the backend is built, each service method's body is replaced with the matching
> call below, returning the same [domain models](./services.md#domain-models) so
> no component changes.

- [Conventions](#conventions)
- [Authentication](#authentication)
- [Error handling](#error-handling)
- [HTTP status codes](#http-status-codes)
- [Auth endpoints](#auth-endpoints)
- [Trip endpoints](#trip-endpoints)
- [Profile & preferences endpoints](#profile--preferences-endpoints)
- [Chat endpoints](#chat-endpoints)

---

## Conventions

- **Base URL:** all endpoints are served under `/api/v1`. Paths in this document
  are relative to that base (e.g. `GET /trips` → `GET /api/v1/trips`).
- **Content type:** request and response bodies are `application/json; charset=utf-8`.
- **Dates:** ISO 8601 (`YYYY-MM-DD` for calendar dates), matching
  `UserTrip.departureDate` / `returnDate`.
- **Identifiers:** opaque strings (e.g. `"trip-1"`), matching the current model
  ids.
- **Times within a day** (`Activity.time`, `DayPlan.date`, `HotelInfo.checkIn`)
  remain human-readable display strings, exactly as the models define them today.

---

## Authentication

Today the "session" is the user's email stored in `localStorage` under
`stp_session_email` (see [`AuthService`](./services.md#authservice)). Under the
REST API this is replaced by a **Bearer token**:

1. `POST /auth/login` (or `/auth/register`) returns an access `token`.
2. The client stores the token (replacing the `stp_session_email` key) and sends
   it on every authenticated request:

   ```http
   Authorization: Bearer <token>
   ```

3. `AuthService.isLoggedIn` becomes "a valid, unexpired token is present".
4. `POST /auth/logout` invalidates the token server-side; the client discards it.

Endpoints that require a token are marked **🔒 Auth required** below. Calling one
without a valid token returns `401 Unauthorized`.

---

## Error handling

All non-2xx responses share a single envelope so the client can handle errors
uniformly:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect."
  }
}
```

| Field | Type | Description |
| --- | --- | --- |
| `error.code` | `string` | Stable, machine-readable code (`SCREAMING_SNAKE_CASE`). Safe to branch on. |
| `error.message` | `string` | Human-readable description, suitable for a toast. |
| `error.details` | `object?` | Optional. Field-level validation errors, present on `422` responses. |

Validation example (`422 Unprocessable Entity`):

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more fields are invalid.",
    "details": {
      "email": "Must be a valid email address.",
      "password": "Must be at least 8 characters."
    }
  }
}
```

### Common error codes

| `code` | Typical status | Meaning |
| --- | --- | --- |
| `VALIDATION_FAILED` | `422` | Request body failed field validation (see `details`). |
| `INVALID_CREDENTIALS` | `401` | Login email/password did not match. |
| `EMAIL_ALREADY_EXISTS` | `409` | Registration email is already taken. |
| `UNAUTHENTICATED` | `401` | Missing or invalid Bearer token. |
| `TRIP_NOT_FOUND` | `404` | No trip with the requested id. |
| `INTERNAL_ERROR` | `500` | Unexpected server error. |

---

## HTTP status codes

| Code | Name | Used when |
| --- | --- | --- |
| `200` | OK | Successful `GET`, `PUT`, or `POST` that returns data (login, logout, chat). |
| `201` | Created | A new resource was created (`POST /auth/register`, future `POST /trips`). |
| `400` | Bad Request | Malformed request (bad JSON, missing required body). |
| `401` | Unauthorized | Bad login credentials, or missing/invalid Bearer token. |
| `404` | Not Found | Resource id does not exist (e.g. `GET /trips/{id}`). |
| `422` | Unprocessable Entity | Well-formed request that fails validation (see `error.details`). |
| `500` | Internal Server Error | Unhandled server-side failure. |

---

## Auth endpoints

Backed by [`AuthService`](./services.md#authservice).

### `POST /auth/login`

Authenticate and obtain a token. Called by `AuthService.login(credentials)`.

**Request**

```json
{
  "email": "traveler@example.com",
  "password": "s3cret-pass"
}
```

**`200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "traveler@example.com",
    "firstName": "Mohamed",
    "lastName": "Elhosinii"
  }
}
```

**Errors**

- `401 INVALID_CREDENTIALS` — email/password do not match.
- `422 VALIDATION_FAILED` — missing or malformed `email` / `password`.

> The current mock accepts *any* non-empty credentials and never checks the
> password; the real endpoint performs an actual credential check and returns
> `401` on mismatch.

---

### `POST /auth/register`

Create an account and sign in. Called by `AuthService.register(data)`.

**Request**

```json
{
  "fullName": "Mohamed Elhosinii",
  "email": "traveler@example.com",
  "password": "s3cret-pass"
}
```

**`201 Created`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "traveler@example.com",
    "firstName": "Mohamed",
    "lastName": "Elhosinii"
  }
}
```

**Errors**

- `409 EMAIL_ALREADY_EXISTS` — the email is already registered.
- `422 VALIDATION_FAILED` — e.g. `password` too short, `email` malformed.

---

### `POST /auth/logout`

🔒 **Auth required.** Invalidate the current token. Called by
`AuthService.logout()`.

**Request:** empty body (the token is taken from the `Authorization` header).

**`200 OK`**

```json
{ "success": true }
```

**Errors**

- `401 UNAUTHENTICATED` — no valid token supplied.

---

### `POST /auth/forgot-password`

Begin password recovery by emailing a reset link. (No client method exists yet;
this backs the "forgot password" form.)

**Request**

```json
{ "email": "traveler@example.com" }
```

**`200 OK`** — always returns success to avoid leaking which emails are
registered:

```json
{
  "success": true,
  "message": "If an account exists for this email, a reset link has been sent."
}
```

**Errors**

- `422 VALIDATION_FAILED` — `email` missing or malformed.

---

## Trip endpoints

Backed by [`TripService`](./services.md#tripservice). Examples use the real
`trip-1` Paris trip from the mock dataset.

### `GET /trips`

🔒 **Auth required.** List the authenticated user's trips. Called by
`TripService.getAll()`.

**`200 OK`** — array of [`UserTrip`](./services.md#usertrip). Abbreviated
(`days` truncated for brevity):

```json
[
  {
    "id": "trip-1",
    "destination": "Paris",
    "country": "France",
    "from": "Cairo",
    "departureDate": "2026-07-15",
    "returnDate": "2026-07-18",
    "coverImage": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
    "totalBudget": 5000,
    "spentBudget": 3200,
    "travelStyle": ["cultural", "foodie"],
    "status": "upcoming",
    "flight": {
      "airline": "Air France",
      "flightNumber": "AF 571",
      "departure": "Cairo (CAI)",
      "arrival": "Paris Charles de Gaulle (CDG)",
      "departureTime": "09:10",
      "arrivalTime": "13:05"
    },
    "hotel": {
      "name": "Hôtel Le Marais",
      "address": "Rue de Rivoli 18, Paris",
      "stars": 4,
      "checkIn": "July 15",
      "checkOut": "July 18",
      "rating": 8.9
    },
    "days": [ "… see GET /trips/trip-1 …" ]
  }
]
```

> The list endpoint may return trips with a trimmed or omitted `days` array for
> payload size; clients fetch the full itinerary via `GET /trips/{id}`.

**Errors**

- `401 UNAUTHENTICATED`.

---

### `GET /trips/{id}`

🔒 **Auth required.** Fetch a single trip by id, including the full day-by-day
itinerary. Called by `TripService.getById(id)`.

**Example:** `GET /api/v1/trips/trip-1`

**`200 OK`** — one [`UserTrip`](./services.md#usertrip) with full `days`
(one day shown; `trip-1` has three):

```json
{
  "id": "trip-1",
  "destination": "Paris",
  "country": "France",
  "from": "Cairo",
  "departureDate": "2026-07-15",
  "returnDate": "2026-07-18",
  "coverImage": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
  "totalBudget": 5000,
  "spentBudget": 3200,
  "travelStyle": ["cultural", "foodie"],
  "status": "upcoming",
  "flight": {
    "airline": "Air France",
    "flightNumber": "AF 571",
    "departure": "Cairo (CAI)",
    "arrival": "Paris Charles de Gaulle (CDG)",
    "departureTime": "09:10",
    "arrivalTime": "13:05"
  },
  "hotel": {
    "name": "Hôtel Le Marais",
    "address": "Rue de Rivoli 18, Paris",
    "stars": 4,
    "checkIn": "July 15",
    "checkOut": "July 18",
    "rating": 8.9
  },
  "days": [
    {
      "dayNumber": 1,
      "date": "July 15 — Wednesday",
      "title": "Icons of the Left Bank",
      "weather": {
        "date": "July 15",
        "tempMax": 26,
        "tempMin": 16,
        "condition": "Sunny",
        "iconUrl": "https://openweathermap.org/img/wn/01d@2x.png",
        "aiTip": "Clear skies all day — ideal for the Eiffel Tower at golden hour. Book lift tickets ahead to skip the queue."
      },
      "activities": [
        {
          "id": "trip-1-d1-a1",
          "time": "10:00 AM",
          "title": "Eiffel Tower",
          "locationName": "Eiffel Tower",
          "lat": 48.8584,
          "lng": 2.2945,
          "description": "Ascend the Iron Lady. Reserve summit access in advance for the best Paris panorama.",
          "type": "sightseeing",
          "category": "attraction",
          "icon": "🗼"
        },
        {
          "id": "trip-1-d1-a2",
          "time": "01:00 PM",
          "title": "Lunch at Café Constant",
          "locationName": "Café Constant",
          "lat": 48.8589,
          "lng": 2.3045,
          "description": "Cosy bistro near the tower. Try the duck confit and crème brûlée.",
          "type": "food",
          "category": "food",
          "icon": "🍽️"
        }
      ]
    }
  ]
}
```

**Errors**

- `404 TRIP_NOT_FOUND` — no trip with that id (mirrors the current `undefined`
  return from `getById`).
- `401 UNAUTHENTICATED`.

---

### `POST /trips` _(future)_

🔒 **Auth required.** Generate a new itinerary from the trip-planner form and
persist it. No client method exists yet; the request body is the existing
[`TripData`](./services.md#tripdata) shape produced by the planner form, and the
response is a freshly generated [`UserTrip`](./services.md#usertrip).

**Request** — a `TripData` payload:

```json
{
  "from": "Cairo",
  "to": "Paris",
  "departureDate": "2026-07-15",
  "returnDate": "2026-07-18",
  "adults": 2,
  "children": 0,
  "rooms": 1,
  "travelStyle": ["cultural", "foodie"],
  "budget": "5000",
  "specialRequests": "Prefer boutique hotels in central districts."
}
```

**`201 Created`** — the generated `UserTrip` (same shape as `GET /trips/{id}`),
with a server-assigned `id` and a `Location: /api/v1/trips/{id}` header.

**Errors**

- `422 VALIDATION_FAILED` — e.g. `returnDate` before `departureDate`, `adults < 1`.
- `401 UNAUTHENTICATED`.

---

## Profile & preferences endpoints

Backed by [`UserProfileService`](./services.md#userprofileservice) and
[`PreferencesService`](./services.md#preferencesservice). These resources are
currently stored in `localStorage` (`stp_profile`, `stp_preferences`) and become
server-owned under the REST API.

### `GET /me`

🔒 **Auth required.** Fetch the signed-in user's profile. Hydrates
`UserProfileService.profile`.

**`200 OK`** — a [`UserProfile`](./services.md#userprofile):

```json
{
  "firstName": "Mohamed",
  "lastName": "Elhosinii",
  "email": "mohamed@example.com",
  "phone": "+20 123 456 7890",
  "country": "Egypt",
  "avatarUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop"
}
```

**Errors**

- `401 UNAUTHENTICATED`.

---

### `PUT /me`

🔒 **Auth required.** Replace the signed-in user's profile. Called by
`UserProfileService.update(profile)` (a full replace, matching the service's
semantics).

**Request** — a full [`UserProfile`](./services.md#userprofile):

```json
{
  "firstName": "Mohamed",
  "lastName": "Elhosinii",
  "email": "mohamed@example.com",
  "phone": "+20 100 000 0000",
  "country": "Egypt",
  "avatarUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}
```

**`200 OK`** — the updated `UserProfile` (echoed back, server-normalized).

**Errors**

- `422 VALIDATION_FAILED` — e.g. malformed `email` or `phone`.
- `401 UNAUTHENTICATED`.

---

### `PUT /me/password`

🔒 **Auth required.** Change the signed-in user's password. (Backs the
account-security form; no client service method exists yet.)

**Request**

```json
{
  "currentPassword": "s3cret-pass",
  "newPassword": "ev3n-more-s3cret"
}
```

**`200 OK`**

```json
{ "success": true }
```

**Errors**

- `401 INVALID_CREDENTIALS` — `currentPassword` is wrong.
- `422 VALIDATION_FAILED` — `newPassword` fails the password policy.

---

### `PUT /me/preferences`

🔒 **Auth required.** Replace the user's notification preferences. Called by
`PreferencesService.update(preferences)` (full replace).

**Request** — a full
[`NotificationPreferences`](./services.md#notificationpreferences):

```json
{
  "emailTripReminders": true,
  "emailMarketing": false,
  "pushTravelAlerts": true,
  "smsImportantUpdates": false
}
```

**`200 OK`** — the updated `NotificationPreferences` (echoed back).

> A matching `GET /me/preferences` returning the same shape hydrates
> `PreferencesService.preferences` on load.

**Errors**

- `422 VALIDATION_FAILED` — a field is missing or not a boolean.
- `401 UNAUTHENTICATED`.

---

## Chat endpoints

Backed by [`ChatService`](./services.md#chatservice). Today the assistant reply
(and any itinerary) is computed client-side by a keyword matcher; under the REST
API the server produces it.

### `POST /chat/messages`

🔒 **Auth required.** Send a user message and receive the assistant's reply.
Replaces the client-side work of `ChatService.addUserMessage` +
`addAssistantReply`: the client posts the user's text and renders the returned
assistant message.

**Request**

```json
{
  "text": "Recommend food spots and cafes in Paris"
}
```

**`200 OK`** — an assistant [`ChatMessage`](./services.md#chat-models). When the
server produces a plan, `isItinerary` is `true` and `itineraryData` carries a
[`ChatItinerary`](./services.md#chat-models):

```json
{
  "id": "m12",
  "sender": "assistant",
  "text": "Here's a draft itinerary from the TripMind planner:",
  "time": "03:00 PM",
  "isItinerary": true,
  "itineraryData": {
    "destination": "Paris, France",
    "duration": "4 Days",
    "budget": "EUR 680 (Moderate)",
    "days": [
      {
        "dayNum": 1,
        "title": "Iconic Monuments",
        "activities": [
          "Eiffel Tower summit access",
          "Seine River sightseeing cruise",
          "Stroll along the Champs-Élysées"
        ]
      },
      {
        "dayNum": 2,
        "title": "Art & Bohemian Vibes",
        "activities": [
          "Visit the Louvre Museum",
          "Walk up Montmartre to Sacré-Cœur",
          "Café dining in the Latin Quarter"
        ]
      }
    ]
  }
}
```

For a small-talk reply, `isItinerary`/`itineraryData` are omitted:

```json
{
  "id": "m13",
  "sender": "assistant",
  "text": "Got it! To build a tailored plan, share your destination, travel dates, nightly budget, or any must-see sights.",
  "time": "03:01 PM"
}
```

**Errors**

- `422 VALIDATION_FAILED` — `text` is empty.
- `401 UNAUTHENTICATED`.

> **Streaming:** a real planner would likely stream tokens (e.g. SSE) rather than
> return a single JSON message — `ChatService` already isolates this behind
> `addAssistantReply`, so the streaming transport is an implementation detail
> hidden from components.
