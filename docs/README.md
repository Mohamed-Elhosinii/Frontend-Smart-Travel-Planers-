# TripMind — Documentation

**TripMind** is an AI-powered travel-planning single-page application (SPA) built with
Angular 20. It turns a few trip parameters into a polished, day-by-day itinerary —
complete with smart budgets, weather tips, an interactive map, and a conversational
AI co-pilot.

This folder is the documentation hub. Start here, then follow the table of contents
to the topic you need.

---

## What TripMind does

TripMind is organised around a handful of user-facing journeys:

| Area | Route | What it offers |
| --- | --- | --- |
| **Landing** | `/` | Marketing hero, feature highlights, and the entry point into planning. |
| **Authentication** | `/login`, `/signup`, `/forgot-password` | Mock sign-in, registration, and password-recovery flows. |
| **Trip planner** | `/plan` | A form that captures the trip brief (origin, destination, dates, party size, budget, travel style). |
| **AI chat** | `/chat` | A conversational co-pilot that drafts itineraries from natural-language prompts. |
| **My Trips** | `/my-trips` | A list of the user's planned trips, each opening into a full itinerary view. |
| **Itinerary view** | `/my-trips/plan/:id` | Day-by-day timeline, flight & hotel cards, weather banner, interactive map, and one-click PDF export. |
| **Account** | `/profile`, `/settings` | Profile editing, password form, and notification preferences. |
| **About & legal** | `/about`, `/terms`, `/privacy` | Static informational pages. |

> **No backend.** TripMind runs entirely in the browser. Data is served from in-memory
> mock datasets and persisted to `localStorage`. The AI is a deterministic, keyword-based
> demo planner. Every service is written so its method bodies can be swapped for real
> HTTP calls without touching a single component — see the
> [mock-to-backend seam](./architecture.md#the-mock-to-backend-seam).

> **Auth policy.** Every page is publicly browsable — there are no route guards.
> Authentication is enforced at a single action: **saving a chat-generated itinerary**
> (`ChatPage.savePlan()`), which sends logged-out users to `/login?returnUrl=/chat`. See
> [Routing & the auth policy](./architecture.md#routing--the-auth-policy).

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | **Angular 20.3** (standalone components, no `NgModule`s) |
| Reactivity / state | **Angular signals** in `providedIn: 'root'` services — no NgRx/Redux |
| Change detection | Zone-based, with **`OnPush`** on leaf components |
| Styling | **Bootstrap 5** + a custom CSS design-token system (`src/styles.css`) |
| Icons | **Font Awesome 6** (CDN, loaded in `index.html`) |
| Fonts | Playfair Display + Plus Jakarta Sans (Google Fonts, CDN) |
| Maps | **Leaflet** (interactive itinerary map) |
| PDF export | **jsPDF** (dynamically imported) |
| Testing | Karma + Jasmine |
| Tooling | Angular CLI, Prettier, TypeScript 5.9 |

---

## Architecture at a glance

TripMind uses a **layered, feature-first architecture**. A thin root shell
(`App`) hosts a `<router-outlet>` and a single global toast outlet. Routed **feature**
components compose presentational pieces and inject **core** services to read and mutate
state. All shared application state lives in singleton, signal-based services
(`providedIn: 'root'`): components call methods on a service, the service updates a
`signal`, and any template reading that signal re-renders automatically. Cross-cutting
building blocks are split into four layers — **core** (models, services, guards,
validators, mock data), **layout** (navbar, footer), **shared** (reusable UI such as the
toast and the legal-page chrome), and **features** (the routed screens). Because every
data access funnels through a service, the in-memory mock data is the only thing that has
to change to connect a real API. See [architecture.md](./architecture.md) for the full
picture.

---

## Table of contents

| Document | Contents |
| --- | --- |
| [architecture.md](./architecture.md) | Layered design, data flow, routing & the auth policy (save-time, not route guards), the mock-to-backend seam, rendering strategy, diagrams. |
| [project-structure.md](./project-structure.md) | Annotated folder & file tree with one-line descriptions. |
| [state-management.md](./state-management.md) | The signals-in-services approach, per-service signal surface, the read-only pattern, and the rationale. |
| [ui-ux-guidelines.md](./ui-ux-guidelines.md) | Design tokens, component conventions, and accessibility notes. |
| [contributing.md](./contributing.md) | Branching, naming conventions, and PR workflow. |
| [features/](./features/) | Per-feature deep-dives (landing, auth, planner, chat, my-trips, account, legal, about). |
| [api/](./api/) | Service & model API reference and the future HTTP contract. |
| [bootstrap-migration-report.md](./bootstrap-migration-report.md) | CSS → Bootstrap utility migration: per-component metrics and what remains custom. |

> All documents above are complete and kept in sync with the codebase.

---

## Getting started

### Prerequisites

- **Node.js** 18.19+ or 20.11+ (per Angular 20 requirements)
- **npm** 9+

### Install & run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (with live reload)
npm start
# → the app is served at http://localhost:4200
```

`npm start` is an alias for `ng serve`. The app reloads automatically whenever you edit a
source file.

### Build for production

```bash
npm run build
```

Compiled assets are emitted to `dist/`. A development watch build is also available via
`npm run watch`.

### Run unit tests

```bash
npm test
```

This runs the Karma + Jasmine suite (`ng test`) in watch mode. Spec files live next to the
code they cover (for example `auth.service.spec.ts`, `auth-guard.spec.ts`,
`email.validator.spec.ts`).

### Useful npm scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `npm start` | `ng serve` | Dev server at `http://localhost:4200`. |
| `npm run build` | `ng build` | Production build to `dist/`. |
| `npm run watch` | `ng build --watch --configuration development` | Continuous development build. |
| `npm test` | `ng test` | Unit tests (Karma + Jasmine). |
