# TripMind — UI/UX Guidelines

The design system and UX standards for **TripMind**, an AI travel planner built with
**Angular 20.3** (standalone + signals), **Bootstrap 5**, **Font Awesome 6**, **Leaflet**, and
**jsPDF**. There is no backend yet — data comes from mock fixtures and `localStorage`.

This document is the single source of truth for visual language, tokens, and interaction
standards. For how the app is wired together and where things live, see
[./architecture.md](./architecture.md) and [./project-structure.md](./project-structure.md).
For contribution and coding standards, see [./contributing.md](./contributing.md).

---

## 1. Design tokens

All tokens are CSS custom properties declared in the `:root` block of
[`src/styles.css`](../src/styles.css). **Always reference the token, never the raw hex value**, so
the palette can evolve in one place. Some tokens are aliases that keep older references working —
they are noted below.

### 1.1 Brand & neutral colors

| Token | Hex | Usage |
| --- | --- | --- |
| `--primary-brand` | `#74341b` | Deep brand brown — primary brand accents, the warm end of brand gradients. |
| `--primary-orange` | `#B54304` | Primary action / accent orange — links, focus border, buttons, toast success accent. |
| `--primary` | `#B54304` | **Alias of `--primary-orange`.** Use for newer references; identical value. |
| `--secondary-dark` | `#3D2B2F` | Default heading and body text color; dark UI chrome. |
| `--primary-dark` | `#3D2B2F` | **Alias of `--secondary-dark`.** |
| `--surface-dark` | `#3D2B2F` | Dark surfaces — footer, overlays. (Same value as `--secondary-dark`.) |
| `--text-deep` | `#261814` | Deepest brand brown; used directly by select components (e.g. itinerary card titles). |
| `--text-muted` | `#6B6B6B` | Secondary / muted text, captions, metadata. |
| `--body-bg` | `#FDFBF7` | Warm cream application background (`html, body`). |
| `--border-color` | `#e8ddd6` | Hairline borders, dividers, card edges. |

The browser theme color (`<meta name="theme-color">` in [`index.html`](../src/index.html)) is set to
the primary orange `#B54304` to match the brand in mobile browser chrome.

> Note on toast colors: success accents reuse the brand orange `#B54304`; the danger state uses
> Bootstrap's `#dc3545`. These are hard-coded in the `.alert-toast` rules (see §4.3).

### 1.2 Gradients

| Token | Value | Usage |
| --- | --- | --- |
| `--primary-gradient` | `linear-gradient(135deg, #432115 0%, #ba5829 100%)` | Diagonal brand gradient for large hero/brand surfaces. |
| `--trip-gradient` | `linear-gradient(90deg, #5b2814 0%, #c25925 100%)` | Horizontal gradient powering all primary brand buttons; animated on hover via `background-position`. |

Brand buttons set `background-size: 200% auto` and shift `background-position: right center` on
hover so the gradient appears to slide — see §4.2.

### 1.3 Shadows

| Token | Value | Usage |
| --- | --- | --- |
| `--shadow-sm` | `0 2px 8px rgba(61, 43, 47, 0.06)` | Subtle lift — chips/badges on hover, low-elevation cards. |
| `--shadow-md` | `0 8px 24px rgba(61, 43, 47, 0.1)` | Medium elevation — resting cards, popovers. |
| `--shadow-lg` | `0 16px 48px rgba(61, 43, 47, 0.14)` | High elevation — cards and buttons on hover. |
| `--shadow-brand` | `0 4px 16px rgba(181, 67, 4, 0.25)` | Warm branded glow on primary/save buttons at rest. |

All shadows are tinted with the brand brown (`rgba(61, 43, 47, …)`) rather than neutral black, which
keeps elevation feeling warm and on-brand.

### 1.4 Focus ring

| Token | Value | Usage |
| --- | --- | --- |
| `--focus-ring` | `0 0 0 4px rgba(181, 67, 4, 0.12)` | Standard 4px soft orange focus halo on form controls. |

Focus is applied to `.form-control:focus` and `.form-check-input:focus` together with a
`--primary-orange` border and `outline: none`. Never remove focus styling without providing an
equally visible replacement.

### 1.5 Transitions

| Token | Value | Usage |
| --- | --- | --- |
| `--transition-fast` | `all 0.2s ease` | Quick state changes — links, small hovers. |
| `--transition-smooth` | `all 0.3s ease-in-out` | General-purpose smoothing. |
| `--transition-spring` | `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` | Default for interactive elements (buttons, cards, badges, inputs, nav links); gives a slight spring. |

A universal rule applies `--transition-spring` to `button, a, .btn, .card, .badge, input, select,
textarea, .nav-link, .list-group-item`, so most interactive elements animate consistently by
default. All transitions are neutralized under reduced-motion (see §6.6).

### 1.6 Layout & layering

| Token | Value | Usage |
| --- | --- | --- |
| `--navbar-height` | `64px` | Height of the fixed top navbar; reserve this space below the navbar. |
| `--z-navbar` | `1050` | Stacking order of the fixed navbar (above Bootstrap content, below toasts). |
| `--z-toast` | `2500` | Stacking order of toasts/alerts — always above the navbar and dropdowns. |

Toasts render at `top: 76px` (just below the 64px navbar plus margin) and `z-index: 2500`, ensuring
they float above the navbar (`1050`) and any open dropdown.

---

## 2. Typography

Two Google Fonts are loaded in [`index.html`](../src/index.html) (preconnected, `display=swap`):

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

| Role | Family | How to apply |
| --- | --- | --- |
| Display / headings | **Playfair Display** (serif, weights 400/700/800) | Add the `.font-serif` utility (`font-family: 'Playfair Display', serif`). |
| Body / UI | **Plus Jakarta Sans** (sans-serif, weights 400/500/600/700) | Default `body` font; no class needed. |

Base typography (from `styles.css`):

- `body` — `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`, with
  `line-height: 1.6` and font smoothing enabled.
- `h1`–`h6` — colored `--secondary-dark` with `line-height: 1.25`.
- Headings scale fluidly on mobile (`max-width: 768px`) using `clamp()`:
  - `h1` → `clamp(1.6rem, 5vw, 2.4rem)`
  - `h2` → `clamp(1.4rem, 4vw, 2rem)`
  - `h3` → `clamp(1.1rem, 3vw, 1.5rem)`

**Usage:** reach for `.font-serif` on page titles, hero headings, and empty/not-found state
headings (e.g. _"Trip not found"_, _"Preparing your itinerary…"_). Keep body copy, labels, and
controls in Plus Jakarta Sans.

```html
<h1 class="font-serif">Plan your perfect trip</h1>
<p class="leading-relaxed">Body copy stays in Plus Jakarta Sans for legibility.</p>
```

---

## 3. Color & contrast usage

- **Backgrounds:** the app sits on warm cream `--body-bg` (`#FDFBF7`); dark surfaces use
  `--surface-dark`.
- **Text:** default to `--secondary-dark` (also available as the `.text-deep`
  utility); use `--text-muted` for secondary text.
- **Links:** `--primary-orange` at rest, darkening to `--secondary-dark` on hover (global `a` rule).
- **Accents:** `.text-primary-accent` applies `--primary-orange` for inline emphasis (e.g. the small
  calendar/clock icons on trip cards).

---

## 4. Global utilities & component primitives

These are promoted into `styles.css` so they are not duplicated per component. Prefer them before
writing new component CSS.

### 4.1 Text & layout utilities

| Class | Effect |
| --- | --- |
| `.text-deep` | `color: var(--secondary-dark)` — high-emphasis text. |
| `.text-primary-accent` | `color: var(--primary-orange)` — inline accent. |
| `.cursor-pointer` | `cursor: pointer` for clickable non-button elements. |
| `.leading-relaxed` | `line-height: 1.75` for comfortable long-form reading. |
| `.font-serif` | Switches to Playfair Display. |

### 4.2 Brand buttons

The following selectors share one branded look (gradient fill, white text, brand shadow, animated
hover, press feedback):

```
.btn-primary, .btn-auth-submit, .btn-plan, .btn-cta,
.generate-btn, .btn-add-trip, .btn-signup
```

Behavior:

- **Rest:** `--trip-gradient` background, `--shadow-brand`, white text.
- **Hover:** gradient slides (`background-position: right center`), `transform: translateY(-2px)`,
  `--shadow-lg`.
- **Active:** `transform: translateY(0) scale(0.98)` for a tactile press.

`.btn-save` is the standalone equivalent used on account/settings forms, including a disabled state
(`opacity: 0.6; cursor: not-allowed`). Use `.btn-save` for "Save" actions inside forms and one of
the brand-button classes (commonly `.btn-plan` / `.btn-add-trip`) for primary CTAs.

```html
<!-- Primary CTA -->
<a routerLink="/plan" class="btn btn-plan border-0 btn-lg rounded-pill px-4 py-2">
  Plan Your First Trip <i class="fa fa-arrow-right" aria-hidden="true"></i>
</a>

<!-- Save action inside a form -->
<button type="submit" class="btn btn-save" [disabled]="form.invalid">Save changes</button>
```

> Bootstrap utilities (`btn`, `rounded-pill`, spacing) compose with the brand class. Add
> `border-0` since the brand buttons remove their border.

### 4.3 Toast / alert

`.alert-toast` is the fixed, animated container for global feedback (see §5.2 for the service):

- Fixed at `top: 76px; right: 24px`, `z-index: 2500`, width `320–450px`.
- Slides in with `toastSlideIn` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) and a 5px left accent border.
- `.alert-toast.alert-success` → orange accent (`#B54304`) on a `#fff9f5` background.
- `.alert-toast.alert-danger` → red accent (`#dc3545`) on a `#fff5f5` background.

### 4.4 Skeleton loaders

`.skeleton` and `.skeleton-line` render a shimmering placeholder via the `skeleton-shimmer`
keyframes (a `1.4s` animated gradient, `8px` radius). `.skeleton-line` adds a default
`0.85rem` height and bottom margin. Use these for content that loads asynchronously — the
`TravelPlanPage` day timeline composes them (`skeleton-line skeleton-short/medium/long`,
`skeleton-pulse`) while activities resolve.

```html
<div class="skeleton-line skeleton-medium"></div>
<div class="skeleton-line skeleton-long"></div>
```

### 4.5 Cards

`.card` lifts on hover (`translateY(-4px)` + `--shadow-lg`). Static container cards opt out of the
lift via `:has()` guards (`.card:has(form)`, `.card:has(app-settings)`, etc.) — keep settings/form
containers static and reserve the lift for content cards (e.g. trip cards in My Trips).

---

## 5. UX principles

### 5.1 State coverage: loading, empty, not-found

Every data-driven view must handle **loading**, **empty**, and **error/not-found** explicitly —
never leave a blank screen. Two reference implementations:

**`TravelPlanPage`** ([`src/app/features/my-trips/travel-plan/travel-plan.html`](../src/app/features/my-trips/travel-plan/travel-plan.html))
drives three top-level states from signals (`trip`, `notFound`) in
[`travel-plan.ts`](../src/app/features/my-trips/travel-plan/travel-plan.ts):

- **Loaded** — `@if (trip(); as t)` renders the full itinerary (hero, summary cards, day timeline,
  map).
- **Not found** — `@else if (notFound())` shows a map-pin icon, a `.font-serif` "Trip not found"
  heading, an explanation, and a "Back to My Trips" action.
- **Loading** — the final `@else` shows a spinner with `.visually-hidden` text "Loading plan…" and a
  "Preparing your itinerary…" heading.

The day timeline additionally distinguishes **has activities** vs **empty day** (a
`fa-calendar-xmark` icon + "No activities planned for this day.") vs **still loading** (skeleton
rows), and the PDF button swaps its label to "Generating…" while `isExporting()` is true.

**`MyTripsPage`** ([`src/app/features/my-trips/my-trips.html`](../src/app/features/my-trips/my-trips.html))
shows a dedicated **empty state** when `trips.length === 0`: a compass icon, a "No trips yet"
heading, encouraging copy, and a "Plan Your First Trip" CTA — instead of an empty grid.

```html
@if (trip(); as t) {
  <!-- loaded -->
} @else if (notFound()) {
  <!-- not found -->
} @else {
  <!-- loading -->
}
```

### 5.2 Global feedback via `ToastService`

User feedback for async actions and errors is centralized.
[`ToastService`](../src/app/core/services/toast.service.ts) (`providedIn: 'root'`) holds a single
toast in a signal and auto-dismisses after `4000ms`:

- `toast.success('…')` / `toast.danger('…')` — convenience methods.
- One global host, `<app-toast>`, is mounted once in the root shell
  ([`app.ts`](../src/app/app.ts)) and renders whatever the service holds.

Raise toasts from anywhere via DI rather than building local banners. Example from
`TravelPlanPage.exportToPDF()`:

```ts
try {
  await this.pdfExport.exportTrip(t);
} catch {
  this.toast.danger('Sorry, the PDF could not be generated. Please try again.');
}
```

### 5.3 Accessible forms

Both auth flows demonstrate the expected pattern: visible `<label>`s, inline validation messages,
and programmatic invalid state.

- **Reactive forms** ([`signup.ts`](../src/app/features/auth/signup/signup.ts)) use a typed
  `nonNullable` form group with `Validators` plus project validators (`emailValidator`,
  `passwordMatchValidator`); on submit, invalid forms call `markAllAsTouched()` so all errors
  surface at once.
- Bind `aria-invalid` to the control's touched-and-invalid state and render an inline error next to
  the field.
- **Template forms** ([`login.ts`](../src/app/features/auth/login/login.ts)) keep a single
  `errorMessage` string for top-level failures (e.g. bad credentials).

```html
<input
  type="email"
  formControlName="email"
  [attr.aria-invalid]="f.email.touched && f.email.invalid"
/>
@if (f.email.touched && f.email.errors?.['email']) {
  <p class="invalid-feedback d-block">Enter a valid email address.</p>
}
```

### 5.4 Keyboard-accessible navbar dropdown

The user menu in [`navbar.ts`](../src/app/layout/navbar/navbar.ts) /
[`navbar.html`](../src/app/layout/navbar/navbar.html) is keyboard- and screen-reader-friendly:

- The dropdown container uses `role="menu"`; the trigger has `aria-label="User menu"`.
- **Escape closes** both the dropdown and the mobile menu via
  `@HostListener('document:keydown.escape')`.
- A `document:click` listener closes the dropdown when the user clicks outside `.user-menu`.
- Scroll past 60px toggles the solid navbar style (`isScrolled`); pages without a hero can force it
  via the `lightBg` input.

Replicate this pattern (role, Esc-to-close, outside-click-to-close, `aria-label` on the trigger) for
any custom menu/popover.

### 5.5 Responsive, mobile-first

- Global guards prevent horizontal scroll (`overflow-x: hidden` on `html`/`body` and all layout
  sections; `max-width: 100vw`) and make media fluid (`img, video, iframe, svg { max-width: 100% }`).
- Build layouts with Bootstrap's responsive grid (`col-12 col-md-6 col-lg-4`, as in the My Trips
  grid) and let the `clamp()` heading scale handle small screens.
- Reserve `--navbar-height` (64px) of top space under the fixed navbar.

---

## 6. Accessibility & motion checklist

| # | Standard | How TripMind meets it |
| --- | --- | --- |
| 6.1 | Visible focus | `--focus-ring` + orange border on `:focus`; never remove without replacement. |
| 6.2 | Decorative icons hidden | Font Awesome icons carry `aria-hidden="true"` (e.g. all icons in the navbar dropdown). |
| 6.3 | Icon-only controls labelled | Provide `aria-label` (e.g. the navbar toggle `aria-label="Toggle navigation"`, user trigger `aria-label="User menu"`). |
| 6.4 | Screen-reader-only text | Use Bootstrap's `.visually-hidden` for spinner/status text (e.g. "Loading plan…"). |
| 6.5 | Progress semantics | Budget bars use `role="progressbar"` with `aria-valuenow/min/max`. |
| 6.6 | Reduced motion | `@media (prefers-reduced-motion: reduce)` collapses animations/transitions to `0.01ms` and forces `scroll-behavior: auto`. |
| 6.7 | Keyboard menus | `role="menu"`, Escape-to-close, outside-click-to-close (see §5.4). |

---

## 7. Component standards

- **Standalone components only** — every component sets `standalone: true` and imports exactly what
  it needs (no `NgModule`s).
- **Bootstrap utilities for layout in templates; brand styling via tokens/component CSS.** Use
  Bootstrap classes for grid, spacing, and flex; apply brand color/elevation through the tokens and
  the shared component classes above (don't hard-code hex in templates).
- **`OnPush` on presentational components.** Pure, input-driven components set
  `changeDetection: ChangeDetectionStrategy.OnPush` — e.g.
  [`FlightCard`](../src/app/features/my-trips/itinerary/flight-card/flight-card.ts) and the global
  [`Toast`](../src/app/shared/toast/toast.ts). Page components that own signal state use the default
  strategy.
- **Signals for view state.** Components expose state as signals/`computed` (e.g. `TravelPlanPage`'s
  `trip`, `notFound`, `selectedDayIndex`, `budgetPercent`) and dependency injection via `inject()`.
- **Icons are decorative.** Mark Font Awesome icons `aria-hidden="true"`; put the accessible name on
  the interactive control via `aria-label` for icon-only buttons.

```ts
@Component({
  selector: 'app-flight-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flight-card.html',
  styleUrl: './flight-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightCard {
  @Input() flight: FlightInfo | null | undefined = null;
}
```

---

## 8. Quick reference

- **Use a token, not a hex value** — everything in §1 lives in [`src/styles.css`](../src/styles.css).
- **Headings** → `.font-serif` (Playfair Display); **body** → default (Plus Jakarta Sans).
- **Primary CTA** → a brand-button class (e.g. `.btn-plan`, `.btn-add-trip`); **form save** →
  `.btn-save`.
- **Feedback** → `ToastService.success/danger`, never an ad-hoc banner.
- **Every data view** → loading + empty + not-found states.
- **Every icon** → `aria-hidden`; **every icon-only control** → `aria-label`.
- **Respect** `prefers-reduced-motion`.

See also: [./architecture.md](./architecture.md) · [./project-structure.md](./project-structure.md) ·
[./contributing.md](./contributing.md)
