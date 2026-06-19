# Travel Plan (Itinerary View)

Source: `src/app/features/my-trips/travel-plan/` (`TravelPlanPage`)

## Purpose

The full day-by-day itinerary for a single trip: flight & hotel summary, a
selectable day with its activity timeline, a weather banner, an interactive map,
a budget bar, and PDF export. It is the detail view behind each My Trips card.

## Routes & screens

| Route | Component | Guard | Notes |
| ----- | --------- | ----- | ----- |
| `/my-trips/plan/:id` | `TravelPlanPage` | Public | Child of `MyTripsLayout` |

States rendered by the page: **loaded** (trip found), **not-found** (`notFound`
signal), and an implicit **loading**/empty state before resolution.

## Workflow

1. The page reads the `:id` route param in `ngOnInit` and loads the trip via
   `TripService.getById(id)`.
2. Found → the trip is shown; not found → a not-found message.
3. Day tabs let the user switch the selected day; the activity timeline, weather
   banner, and map all update to the selected day.
4. The budget bar shows spent/total as a percentage.
5. "Export to PDF" generates a downloadable itinerary; failures surface a toast.

## Dependencies

- **Services:** `TripService` (`getById`), `PdfExportService` (`exportTrip`),
  `ToastService` (error feedback).
- **Child components:** `FlightCard`, `HotelCard`, `WeatherBanner`,
  `InteractiveMap` (all in `itinerary/`, see itinerary.md).
- **Models:** `UserTrip`, `DayPlan`, `Activity`, `Weather`.
- **Angular:** signals/`computed`, `ActivatedRoute`, `RouterLink`, `NgClass`,
  `PLATFORM_ID` / `isPlatformBrowser`.

## Business logic

State is signal-based: `trip`, `notFound`, `selectedDayIndex`, `isExporting`.
Derived (`computed`) values:

- `currentDayPlan` — `trip.days[selectedDayIndex]` (or `null`).
- `currentDayActivities` / `currentDayWeather` — projections of the current day.
- `budgetPercent` — `min(100, round(spentBudget / totalBudget * 100))`,
  zero-total guarded.

Methods:
- `ngOnInit()` — resolves the trip from the route id; sets `notFound` if missing.
- `selectDay(index)` — sets `selectedDayIndex` (drives the day tabs).
- `getCategoryClass(category)` — maps an activity category to a CSS class
  (`cat-food`, `cat-attraction`, `cat-leisure`, `cat-hotel`, `cat-transport`),
  defaulting to `cat-attraction`.
- `exportToPDF()` — browser-guarded and re-entrancy-guarded via `isExporting`;
  `await pdfExport.exportTrip(trip)` inside try/catch/finally, raising
  `toast.danger(...)` on failure.

The activity timeline is tracked by `activity.id` (ids are auto-generated in the
mock data, e.g. `trip-1-d1-a1`).

## Notes / future work

- `PdfExportService` dynamically imports `jspdf` (kept out of the initial bundle
  and SSR); emoji are intentionally omitted from the PDF (core fonts can't render
  them).
- Trip data is read once on init from mock data; a real API would add a loading
  state and error handling beyond not-found.
