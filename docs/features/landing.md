# Landing

Source: `src/app/features/landing/` (`LandingPage`)

## Purpose

The public marketing home page for TripMind. It is the app's front door: it
pitches the product, showcases what it does, and funnels visitors toward signing
up or starting a trip plan. It carries no application state or data fetching.

## Routes & screens

| Route | Component | Guard | Notes |
| ----- | --------- | ----- | ----- |
| `''`  | `LandingPage` | Public | App root / home page |

Single full-page scrolling screen composed of marketing sections.

## Workflow

1. A visitor lands on `/`.
2. They scroll through the hero, features, how-it-works, destinations, and CTA
   sections.
3. Calls to action route them onward via `routerLink` — e.g. to `/plan` to start
   planning, or `/signup` / `/login` to create or access an account.
4. The shared navbar and footer provide secondary navigation across the site.

## Dependencies

- **Components:** `Navbar` (`layout/navbar`), `Footer` (`layout/footer`).
- **Angular:** `RouterLink` for in-app navigation.
- **Services / models:** none — the page is fully static.

## Business logic

`LandingPage` is an empty standalone component (`export class LandingPage {}`):
all content lives in the template (`landing.html`) and styles (`landing.css`).
Page structure:

- **Hero** — headline, sub-copy, and primary CTA.
- **Features grid** — the product's key capabilities.
- **How it works** — the step-by-step planning narrative.
- **Destinations** — featured/sample destinations.
- **CTA** — closing prompt to start planning or sign up.

The `Navbar` is auth-aware (it reads `AuthService`), so the menu it renders
adapts to whether the visitor is signed in.

## Notes / future work

- Content is hard-coded in the template; a CMS or config-driven content source
  could make it editable without code changes.
- Destination cards are illustrative and not backed by real inventory.
