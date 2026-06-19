# Project Structure

This document is an annotated map of the TripMind source tree. For the reasoning behind the
layering, see [architecture.md](./architecture.md).

## Naming conventions

TripMind follows a consistent, framework-current naming scheme:

| Kind | Convention | Examples |
| --- | --- | --- |
| Files | `kebab-case`, **no `.component.` infix** | `flight-card.ts`, `auth.service.ts` |
| Routed pages | `Page` suffix | `LoginPage`, `TravelPlanPage` |
| Reusable components | descriptive name | `Navbar`, `Footer`, `FlightCard`, `WeatherBanner` |
| Services | `…Service`, `providedIn: 'root'` | `AuthService`, `TripService` |
| Guards | functional, `…Guard` | `authGuard` |
| Validators | function, `…Validator` | `emailValidator`, `dateRangeValidator` |
| Models | PascalCase interfaces | `UserTrip`, `DayPlan`, `Activity` |

Each component folder typically holds three sibling files — `name.ts` (logic), `name.html`
(template), and `name.css` (styles). Spec files (`*.spec.ts`) sit next to the code they test.
The tree below lists the `.ts` files; assume a matching `.html`/`.css` pair unless noted.

---

## Top-level tree

```
Frontend-Smart-Travel-Planers-/
├── docs/                         # ← this documentation
│   ├── README.md                 # Documentation hub & getting-started guide
│   ├── architecture.md           # Layered design, data flow, routing, seams
│   ├── project-structure.md      # This file
│   └── state-management.md       # Signals-in-services state model
├── src/
│   ├── index.html                # HTML host; loads Font Awesome 6 + Google Fonts (CDN)
│   ├── main.ts                   # Bootstraps the App with appConfig
│   ├── styles.css                # Global design tokens & base styles (CSS variables)
│   └── app/                      # Application source (detailed below)
├── angular.json                  # Angular CLI workspace config
├── package.json                  # Dependencies & npm scripts
└── README.md                     # Repo root readme
```

---

## `src/app` — application source

```
src/app/
├── app.ts                        # Root shell component (App): hosts router-outlet + app-toast
├── app.html                      # Shell template: <router-outlet/> + <app-toast/>
├── app.css                       # Shell styles
├── app.config.ts                 # ApplicationConfig: provideRouter, zone change detection
├── app.routes.ts                 # Central route table (all routes public; no guards wired)
├── app.spec.ts                   # Root component test
│
├── core/                         # ───────── CORE LAYER (no feature imports) ─────────
│   ├── models/                   # Domain interfaces (PascalCase), re-exported via barrel
│   │   ├── index.ts              #   Barrel — import models from here, not individual files
│   │   ├── user-trip.ts          #   UserTrip + TripStatus ('upcoming'|'ongoing'|'completed')
│   │   ├── day-plan.ts           #   DayPlan — one day of an itinerary (activities + weather)
│   │   ├── activity.ts           #   Activity (stable `id`), ActivityType, ActivityCategory
│   │   ├── weather.ts            #   Weather — tempMax/tempMin, condition, iconUrl, aiTip
│   │   ├── flight-info.ts        #   FlightInfo — outbound flight summary
│   │   ├── hotel-info.ts         #   HotelInfo — accommodation summary
│   │   ├── trip-data.ts          #   TripData — raw trip-planner form payload
│   │   ├── user-profile.ts       #   UserProfile — editable account profile
│   │   ├── notification-preferences.ts  # NotificationPreferences — email/push/SMS toggles
│   │   └── chat-message.ts       #   ChatMessage, ChatItinerary, ChatSession
│   │
│   ├── services/                 # Singleton, signal-based state holders (providedIn: 'root')
│   │   ├── auth.service.ts       #   AuthService — session signal + login/register/logout
│   │   ├── trip.service.ts       #   TripService — getAll()/getById() over MOCK_TRIPS
│   │   ├── chat.service.ts       #   ChatService — messages signal + demo itinerary planner
│   │   ├── user-profile.service.ts  # UserProfileService — profile signal (localStorage)
│   │   ├── preferences.service.ts   # PreferencesService — notification prefs (localStorage)
│   │   ├── toast.service.ts      #   ToastService — global toast signal, auto-dismiss 4s
│   │   ├── pdf-export.service.ts #   PdfExportService — exportTrip() via dynamic jsPDF import
│   │   ├── auth.service.spec.ts  #   Tests
│   │   └── trip.service.spec.ts  #   Tests
│   │
│   ├── guards/
│   │   ├── auth-guard.ts         #   authGuard — CanActivateFn (available for future use; not wired to any route)
│   │   └── auth-guard.spec.ts    #   Tests
│   │
│   ├── validators/               # Pure reactive-forms validators
│   │   ├── email.validator.ts    #   emailValidator — email format
│   │   ├── password-match.validator.ts  # passwordMatchValidator — group validator factory
│   │   ├── date-range.validator.ts      # dateRangeValidator — returnDate ≥ departureDate
│   │   ├── email.validator.spec.ts          # Tests
│   │   └── password-match.validator.spec.ts # Tests
│   │
│   └── data/
│       └── mock-trips.data.ts    #   MOCK_TRIPS — in-memory trip dataset (the API swap point)
│
├── layout/                       # ───────── LAYOUT LAYER (app chrome) ─────────
│   ├── navbar/
│   │   └── navbar.ts             #   Navbar — fixed, auth-aware nav + responsive mobile drawer
│   └── footer/
│       └── footer.ts            #   Footer — site footer
│
├── shared/                       # ───────── SHARED LAYER (reusable UI) ─────────
│   ├── toast/
│   │   └── toast.ts             #   Toast — single global toast host (OnPush); mount once
│   └── legal-page/
│       └── legal-page.ts       #   LegalPage — shared chrome for policy pages, <ng-content>
│
└── features/                     # ───────── FEATURES LAYER (routed screens) ─────────
    ├── landing/
    │   └── landing.ts           #   LandingPage — marketing hero & entry point ('/')
    │
    ├── auth/                     #   Authentication flows
    │   ├── login/login.ts       #     LoginPage — sign-in; honours returnUrl, "remember me"
    │   ├── signup/signup.ts     #     SignupPage — registration
    │   └── forgot-password/forgot-password.ts  # ForgotPasswordPage — password recovery
    │
    ├── trip-form/
    │   └── trip-form.ts         #   TripFormPage — captures the trip brief ('/plan')
    │
    ├── my-trips/                 #   Trips list + full itinerary view
    │   ├── my-trips-layout.ts   #     MyTripsLayout — navbar + child <router-outlet>
    │   ├── my-trips.ts          #     MyTripsPage — list of the user's trips
    │   ├── travel-plan/
    │   │   └── travel-plan.ts   #     TravelPlanPage — full itinerary for one trip (/plan/:id)
    │   └── itinerary/           #     Presentational pieces of the itinerary view (OnPush)
    │       ├── flight-card/flight-card.ts        # FlightCard — flight summary card
    │       ├── hotel-card/hotel-card.ts          # HotelCard — hotel summary card
    │       ├── weather-banner/weather-banner.ts  # WeatherBanner — daily forecast + AI tip
    │       └── interactive-map/interactive-map.ts# InteractiveMap — Leaflet map of activities
    │
    ├── chat/
    │   └── chat.ts              #   ChatPage — AI co-pilot conversation ('/chat')
    │
    ├── account/                 #   Profile & settings
    │   ├── profile/profile.ts   #     ProfilePage — profile overview ('/profile')
    │   ├── settings/settings.ts #     SettingsPage — account settings ('/settings')
    │   └── components/          #     Reusable account sub-forms
    │       ├── personal-info/personal-info.ts            # PersonalInfo — name/contact form
    │       ├── password-form/password-form.ts            # PasswordForm — change-password form
    │       └── notification-settings/notification-settings.ts # NotificationSettings — prefs toggles
    │
    ├── about/
    │   └── about.ts             #   AboutPage — about page ('/about')
    │
    └── legal/                   #   Static policy pages (use shared LegalPage chrome)
        ├── terms/terms.ts       #     TermsPage — terms of service ('/terms')
        └── privacy/privacy.ts   #     PrivacyPage — privacy policy ('/privacy')
```

---

## Where things live (quick reference)

| I want to… | Look in… |
| --- | --- |
| Add or change a route | `src/app/app.routes.ts` |
| Add a domain type | `src/app/core/models/` (and export it from `index.ts`) |
| Change how data is fetched / stored | the relevant `src/app/core/services/*.service.ts` |
| Change the demo trip data | `src/app/core/data/mock-trips.data.ts` |
| Protect a route | apply `authGuard` in `app.routes.ts` (general guidance — no routes are guarded today) |
| Add a form validation rule | `src/app/core/validators/` |
| Tweak global colours / spacing tokens | `src/styles.css` |
| Add app-wide chrome | `src/app/layout/` |
| Add a reusable presentational component | `src/app/shared/` |
| Build a new screen | a new folder under `src/app/features/` |
