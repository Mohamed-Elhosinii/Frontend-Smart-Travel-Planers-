# Itinerary Components

Source: `src/app/features/my-trips/itinerary/` (`FlightCard`, `HotelCard`,
`WeatherBanner`, `InteractiveMap`)

## Purpose

The presentational building blocks of the trip detail view. Each is a small,
self-contained, `OnPush` component fed entirely by `@Input()`s — they hold no
service dependencies and render a slice of a trip. They are composed by
`TravelPlanPage` (see travel-plan.md).

## Routes & screens

None — these are child components, not routed pages.

## Workflow

`TravelPlanPage` passes the relevant data down per selected day:

- `FlightCard` ← `flight: FlightInfo`
- `HotelCard` ← `hotel: HotelInfo`
- `WeatherBanner` ← `weather: Weather`
- `InteractiveMap` ← `activities: Activity[]`, `dayNumber: number`

When the user changes the selected day, the parent's `computed` inputs change and
each card re-renders (or the map re-plots).

## Dependencies

- **Models:** `FlightInfo`, `HotelInfo`, `Weather`, `Activity`.
- **Library:** `leaflet` (map only) with OpenStreetMap tiles.
- **Angular:** `ChangeDetectionStrategy.OnPush`, `CommonModule`; the map also
  uses `PLATFORM_ID` / `isPlatformBrowser`, `ViewChild`, lifecycle hooks.

## Business logic

**`FlightCard`** — pure display of a `FlightInfo` input; no methods.

**`HotelCard`** — `getStars(count)` returns an array sized to the rating clamped
to 0–5, used to render star icons.

**`WeatherBanner`** — `getWeatherClass(condition)` derives a theme class from the
condition string (`weather-sunny` / `weather-cloudy` / `weather-rainy` /
`weather-default`).

**`InteractiveMap`** (Leaflet):
- The map is created in `ngAfterViewInit`, **browser-guarded** via
  `isPlatformBrowser` so it never runs during SSR.
- `updateMapMarkers()` clears existing layers, then for each activity adds a
  numbered `divIcon` marker (color per `category`) with a popup, and connects the
  day's points with a dashed route **polyline** (when more than one point). The
  view `fitBounds` to the markers.
- `ngOnChanges` re-plots when `activities` changes after init
  (`mapInitialized`).
- `zoomIn()` / `zoomOut()` proxy to the Leaflet map.
- `ngOnDestroy` calls `clearMap()` to remove markers, polyline, and the map
  instance — the map is **fully torn down** to avoid leaks.
- Marker/popup HTML is built from trusted in-app trip data (a code comment notes
  it must be sanitized if activities ever become user-supplied).

## Notes / future work

- Leaflet marker HTML is inline-styled; if activity data ever becomes
  user-generated it must be sanitized before injection.
- Cards assume well-formed inputs; missing `flight`/`hotel`/`weather` are handled
  by `null`-defaulted inputs and the parent's conditional rendering.
