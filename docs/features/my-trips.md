# My Trips

Source: `src/app/features/my-trips/` (`MyTripsPage`, `MyTripsLayout`)

## Purpose

The user's trip dashboard: a grid of saved trips with at-a-glance status, budget,
duration, and dates, plus quick links into each full itinerary. It is the
landing spot after sign-in.

## Routes & screens

| Route | Component | Guard | Notes |
| ----- | --------- | ----- | ----- |
| `/my-trips` | `MyTripsLayout` → `MyTripsPage` | Public | Trip grid (child `''`) |
| `/my-trips/plan/:id` | `MyTripsLayout` → `TravelPlanPage` | Public | Full itinerary (see travel-plan.md) |

`MyTripsLayout` is the section shell: it renders a persistent
`<app-navbar [lightBg]="true">` and a `<router-outlet>` for the child views,
padded by `--navbar-height`.

## Workflow

1. The user navigates to `/my-trips` (the page is public; it is also the default
   landing spot after a successful login).
2. `MyTripsPage` reads all trips and renders one card each.
3. Each card shows a status badge, budget progress bar, day count, and formatted
   date range.
4. Selecting a card links to `/my-trips/plan/:id` to open the itinerary.
5. If there are no trips, an empty state is shown instead of the grid.

## Dependencies

- **Components:** `Navbar` (via `MyTripsLayout`).
- **Services:** `TripService` (`core/services/trip.service.ts`) — `getAll()`.
- **Models:** `UserTrip` (+ `TripStatus`).
- **Angular pipes/directives:** `RouterLink`, `NgClass`, `TitleCasePipe`,
  `DecimalPipe`.

## Business logic

`MyTripsPage` eagerly reads `trips = tripService.getAll()` (mock data:
`trip-1` Paris, `trip-2` Dubai, `trip-3` Rome).

- `getStatusClass(status)` — maps `'upcoming' | 'ongoing' | 'completed'` to a
  badge CSS class (`badge-upcoming`, etc.).
- `getBudgetPercent(trip)` — `round(spentBudget / totalBudget * 100)`; guards a
  zero total.
- `getDaysCount(trip)` — `ceil((returnDate - departureDate) / DAY_MS)`, clamped
  to `>= 0`.
- `formatDate(dateStr)` — `toLocaleDateString('en-US', { month: 'short', day:
  'numeric', year: 'numeric' })`.

## Notes / future work

- `getAll()` is synchronous over in-memory mock data; swapping to an async HTTP
  source would mean handling a loading state here.
- No create/delete/edit of trips from this view (planning happens at `/plan`).
