# Bootstrap 5 Migration Report

**Goal:** replace custom CSS with Bootstrap 5 utility classes wherever an _exact_
equivalent exists, with **zero visual change** (pixel-perfect). Off-scale values,
brand colors/gradients, shadows, transitions, animations, and pseudo-elements have
no Bootstrap utility and were intentionally kept.

**Verification:** `ng build` (prod) passes with no errors; 18/18 unit tests pass.
Each removed declaration was replaced by its exact-equivalent utility on the same
element (e.g. `display:flex`→`d-flex`, `font-weight:700`→`fw-bold`,
`border-radius:50%`→`rounded-circle`, `position:relative`→`position-relative`).

> Note: the project's **templates were already heavily Bootstrap-utility-based**, and
> brand styling is driven by a CSS design-token system (`src/styles.css`). So the
> migratable surface was the custom CSS that duplicated utilities or expressed
> exact-equivalent layout/typography — not the brand layer, which Bootstrap cannot
> express without a Sass re-theme (out of scope to preserve pixels).

## Per-component results

| Component | CSS before | CSS after | Removed | Outcome |
|---|---:|---:|---:|---|
| footer | 43 | 30 | 13 | flex/centering/shape → utilities; dead `.brand-logo`/`.font-serif` removed |
| navbar | 305 | 276 | 29 | flex/position/typography → utilities; glassmorphism, hamburger-X, underline `::after` kept |
| my-trips | 232 | 226 | 6 | font-weights → utilities; gradients, hero, `pulse` kept |
| travel-plan | 368 | 342 | 26 | position/flex/typography → utilities; timeline grid, `.cat-*`, skeleton kept |
| chat | 565 | 545 | 20 | flex/typography → utilities; bubbles, keyframes, scrollbars, dead `.btn-primary-action` removed |
| flight-card | 105 | 92 | 13 | flex/typography/shape → utilities; off-scale, skeleton kept |
| hotel-card | 109 | 97 | 12 | same as flight-card; `.star-icon` kept |
| weather-banner | 132 | 117 | 15 | position/flex/typography → utilities; gradients, `object-fit:contain` kept |
| interactive-map | 124 | 91 | 33 | position/flex/shape → utilities; backdrop-filter, px offsets, `pulse` kept |
| login | 161 | 141 | 20 | dead `.btn-gmail` + global-dup `.font-serif` removed; brand banner/inputs kept |
| signup | 236 | 216 | 20 | dead `.btn-google` + `.font-serif` removed; brand + fragile `@media` block kept |
| forgot-password | 129 | 124 | 5 | `.font-serif` removed; brand banner/inputs kept |
| legal-page | 32 | 32 | 0 | fully custom (off-scale + brand tokens) |
| about | 174 | 167 | 7 | font-weights → utilities; gradients, `font-weight:800`, local `.leading-relaxed` (1.7 override) kept |
| landing | 214 | 214 | 0 | markup already 100% Bootstrap; remainder is brand/`clamp()`/off-scale |
| trip-form | 172 | 162 | 10 | input `w-100`/`position-*`/font-weights → utilities; glass card, 60px inputs, `::calendar-picker` kept |
| profile | 27 | 22 | 5 | local `.text-deep` duplicate removed |
| settings (page) | 4 | 4 | 0 | only off-scale `padding-top` |
| personal-info | 52 | 47 | 5 | local `.text-deep` duplicate removed |
| password-form | 38 | 33 | 5 | local `.text-deep` duplicate removed |
| notification-settings | 43 | 36 | 7 | local `.text-deep` duplicate removed |
| toast | 6 | 6 | 0 | only `font-size` |

**Aggregate:** ~3,282 → ~3,010 lines of component CSS (**≈ 272 lines / ~8% removed**),
plus the shared utilities consolidated into `src/styles.css` (`.text-deep`,
`.leading-relaxed`, `.btn-save`, `.font-serif`, `.cursor-pointer`).

## Bootstrap classes introduced

`d-flex`, `d-inline-flex`, `d-block`, `d-none`, `flex-column`, `flex-row`, `flex-wrap`,
`align-items-{center,start,end}`, `justify-content-{center,between,end,start}`,
`text-{center,start,end}`, `fw-{bold,semibold,medium,normal}`, `fst-italic`,
`text-uppercase`, `text-decoration-none`, `text-nowrap`, `rounded-circle`, `w-100`,
`h-100`, `position-{relative,absolute}`, `top-0`/`start-0`/`end-0`/`bottom-0`,
`overflow-hidden`, `overflow-y-auto`, `flex-shrink-0`, `flex-grow-1`,
`object-fit-cover`, `p-0`, `gap-2`/`gap-3`, `opacity-*`, `mb-0`, `cursor-pointer`.

## Components still requiring custom CSS — and why

**All** components retain some custom CSS by necessity. None of the following have a
Bootstrap-utility equivalent, so removing them would break pixel-parity:

- **Brand colors & gradients** — `#B54304`, `--trip-gradient`, hero overlays, button
  gradients (Bootstrap theme colors are blue/grey; a Sass re-theme was out of scope).
- **Off-scale spacing/sizing** — `14px`, `18px`, `36px`, `42px`, `60px`, `210px`,
  `calc(100vh - 280px)` (Bootstrap's scale is 4/8/16/24/48px only).
- **Animations / `@keyframes`** — typing dots, hamburger→X, `pulse`, `slideDown`,
  skeleton shimmer.
- **Pseudo-elements** — nav-link `::after` underline, `::placeholder`,
  `::-webkit-calendar-picker-indicator`.
- **`backdrop-filter`** glassmorphism (navbar, mobile menu).
- **Custom geometry** — the day-by-day timeline CSS grid, sticky map offsets.
- **box-shadows, transitions, focus/hover states, `text-overflow:ellipsis`,
  `object-fit:contain`, `font-weight:800`** — no exact utility.

## Deliberate "keep" decisions (to preserve pixels)

- Local `.btn-save` overrides kept in the account forms — they use a **different
  gradient/shadow** than the global `.btn-save`.
- Local `.text-deep` kept in the auth pages (`#261814`) — **differs** from the global
  value (`#3D2B2F`).
- Local `.leading-relaxed` kept in `about.css` (`1.7`) — **differs** from global (`1.75`).
- `.user-dropdown` positioning kept as CSS — the mobile `@media` overrides
  `position:static` **without** `!important`, which a `position-absolute` utility
  (which is `!important`) would have broken.
- `signup.css` `@media (min-height:600px) { … !important }` block left untouched.
