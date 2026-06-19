# Authentication

Source: `src/app/features/auth/` (`LoginPage`, `SignupPage`, `ForgotPasswordPage`)

> **All auth is mock.** There is no backend. A "session" is just the signed-in
> email persisted to `localStorage` by `AuthService`. The public signal surface
> is designed so that swapping in real HTTP calls (returning a token) requires no
> changes to consumers.

## Purpose

Lets users sign in, register, and request a password reset.

> **Routes are public.** The app no longer bounces logged-out users away from
> `/my-trips`, `/chat`, `/profile`, or `/settings` — every page is freely
> browsable. Authentication is enforced at a single action instead: **saving a
> chat-generated itinerary** (`ChatPage.savePlan()`), which redirects logged-out
> users here with `?returnUrl=/chat`. The `returnUrl` mechanism below still works;
> it is now driven by that save-plan redirect rather than by a route guard. The
> reusable `authGuard` still exists (and is unit-tested) but is not applied to any
> route — see [architecture.md](../architecture.md#the-auth-guard-available-for-future-use).

## Routes & screens

| Route | Component | Guard | Notes |
| ----- | --------- | ----- | ----- |
| `/login` | `LoginPage` | Public | Sign-in; honours `returnUrl` |
| `/signup` | `SignupPage` | Public | Registration (reactive form) |
| `/forgot-password` | `ForgotPasswordPage` | Public | Password-reset request |

## Workflow

**Sign-in.** User enters email + password and submits. On success `AuthService`
persists the session and the page redirects to the `returnUrl` query param,
defaulting to `/my-trips`. `returnUrl` is set by the save-plan redirect
(`ChatPage.savePlan()` sends logged-out users here with `?returnUrl=/chat`); it is
no longer set by a route guard, since no route is guarded. If "remember me" is
checked, the email is saved to `localStorage` (`stp_remembered_email`) and
pre-filled on the next visit.

**Registration.** User fills the reactive form (full name, email, password,
confirm password, accept terms). On a valid submit, `AuthService.register` is
called and the user is routed to `/my-trips`. A **"Continue with Google"** button
(official 4-colour logo) offers one-tap sign-up via
`SignupPage.continueWithGoogle()` → `AuthService.signInWithGoogle()` — a mock OAuth
flow (no backend) that registers a demo Google account, then routes to `/my-trips`.
See the Google Identity Services seam in *Notes / future work*.

**Password reset.** User enters an email; a valid one flips the page to a mock
confirmation screen. No email is actually sent.

## Dependencies

- **Services:** `AuthService` (`core/services/auth.service.ts`) — signal-based
  (`currentEmail`, `isLoggedIn`), `providedIn: 'root'`.
- **Validators:** `emailValidator`, `passwordMatchValidator` (signup).
- **Angular:** `FormsModule` (login, forgot-password), `ReactiveFormsModule`
  (signup), `Router` / `ActivatedRoute`, `RouterLink`.
- **Guard:** `authGuard` (`core/guards/auth-guard.ts`) consumes `AuthService` and
  is still unit-tested, but it is **not applied to any route** — available for
  future use only. `AuthService` itself is still used: by the navbar (auth-aware
  menu) and by `ChatPage.savePlan()` (the save-plan auth check / `returnUrl`
  redirect).

## Business logic

**`AuthService`**
- `login({ email, password })` — succeeds for any non-empty credentials;
  persists `stp_session_email`. Returns `boolean`.
- `register({ fullName, email, password })` — persists a session for the new
  account. Returns `boolean`.
- `signInWithGoogle(googleProfile?)` — mock "Continue with Google"; registers a
  demo Google account (`demo.user@gmail.com`) via `register()` and persists a
  session. Returns `boolean`. Pass a real decoded-JWT profile once GIS is wired.
- `logout()` — clears the signal and removes the stored email.
- `isLoggedIn` is a `computed` over the email signal. All `localStorage` access
  is wrapped in try/catch for SSR / privacy-mode safety.

**`LoginPage.login()`** — guards empty fields, calls `auth.login`, manages the
remembered-email key, then `navigateByUrl(returnUrl)`.

**`SignupPage`** — `fb.nonNullable.group` with controls: `fullName`
(required, minLength 2), `email` (required + `emailValidator`), `password`
(required, minLength 8), `confirmPassword` (required), `acceptTerms`
(`requiredTrue`). Group-level validator: `passwordMatchValidator('password',
'confirmPassword')`. `submit()` marks all touched if invalid, otherwise registers
and navigates.

**`ForgotPasswordPage.sendResetLink()`** — validates against an email regex,
sets `isSubmitted = true` to show the confirmation; no network call.

## Notes / future work

- Replace `login`/`register` with real auth endpoints returning a token; the
  signal API can stay the same.
- **Google Identity Services seam:** to make "Continue with Google" real, load
  `https://accounts.google.com/gsi/client`, configure an OAuth **Client ID** (with
  authorised origins), render the GIS button, and in the credential callback decode
  the returned JWT (name + email) and pass it to `signInWithGoogle(profile)`.
  Token verification should happen server-side in production.
- `ForgotPasswordPage` would POST to `/auth/forgot-password` in a real build.
- No real credential verification, password storage, or rate limiting exists.
