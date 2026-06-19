# TripMind — AI Travel Planner

TripMind is an AI-themed travel-planning single-page application built with **Angular 20**
(standalone components + signals). Plan a trip, browse an AI-generated day-by-day itinerary with
flights, hotels, weather and an interactive map, chat with a travel assistant, and manage your
profile and notification preferences.

> **Status:** front-end prototype. There is no backend yet — data is served from in-memory mock
> data and persisted to the browser's `localStorage`. The service layer in `src/app/core/services`
> is the seam where real HTTP will plug in.

## Features

- **Landing** marketing page with hero, features, destinations and CTAs
- **Auth** — sign in, register (reactive form with validation), and password reset (mock)
- **Trip planner** — a guided form that captures destination, dates, travellers, styles and budget
- **My Trips** — your trips with status, budget progress and a full **itinerary view** loaded by id
- **AI Chat** — a travel assistant that returns inline itineraries (demo keyword planner)
- **Account** — profile, password and notification-preference management (persisted locally)
- **Interactive map** (Leaflet) and **PDF export** (jsPDF) of itineraries

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Angular 20.3 (standalone components, signals) |
| Styling | Bootstrap 5 + a CSS design-token system (`src/styles.css`) |
| Icons / Fonts | Font Awesome 6, Google Fonts (Playfair Display, Plus Jakarta Sans) |
| Maps | Leaflet + OpenStreetMap |
| PDF | jsPDF (dynamically imported) |
| State | Angular signals in `providedIn: 'root'` services (no NgRx) |
| Tests | Karma + Jasmine |

## Quick start

```bash
npm install        # install dependencies
npm start          # dev server at http://localhost:4200
npm run build      # production build to dist/
npm test           # unit tests (Karma/Jasmine)
```

## Project structure

```
src/app/
  core/       models · services · guards · validators · mock data   (non-visual foundation)
  layout/     navbar · footer                                       (app chrome)
  shared/     toast · legal-page                                    (reusable UI)
  features/   landing · auth · trip-form · my-trips · chat ·        (routed feature areas)
              account · about · legal
```

See **[docs/project-structure.md](docs/project-structure.md)** for the full annotated tree.

## Documentation

Full documentation lives in **[`/docs`](docs/README.md)**:

- [Architecture](docs/architecture.md) · [Project structure](docs/project-structure.md) · [State management](docs/state-management.md)
- [UI/UX guidelines](docs/ui-ux-guidelines.md) · [Contributing & conventions](docs/contributing.md)
- [Feature docs](docs/features/) · [API / service contracts](docs/api/README.md)

## Contributing

Please read **[docs/contributing.md](docs/contributing.md)** for the naming conventions, project
conventions, and PR guidelines. In short: standalone components, `inject()`, signals for state,
`OnPush` for presentational components, kebab-case filenames (no `.component.` infix), and a `Page`
suffix for routed pages. Run `npm run build` and `npm test` before opening a PR.
