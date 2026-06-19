# Trip Planner Form

Source: `src/app/features/trip-form/` (`TripFormPage`)

## Purpose

Collects a user's trip preferences (route, dates, party size, travel styles,
budget, special requests) as the entry point to itinerary generation. It is the
input side of the AI planning flow.

## Routes & screens

| Route | Component | Guard | Notes |
| ----- | --------- | ----- | ----- |
| `/plan` | `TripFormPage` | Public | Single reactive-form screen |

## Workflow

1. User opens `/plan` (reachable from the landing CTA).
2. Fills in origin/destination, departure & return dates, traveler counts
   (stepper buttons), selects one or more travel-style chips, enters a budget and
   optional special requests.
3. On submit, if the form is valid a success toast ("Generating your trip to
   …") is shown and the user is routed to `/my-trips`.
4. If invalid, all controls are marked touched so validation messages appear.

> There is **no generation backend yet** — submit only acknowledges and
> navigates; it does not produce a real itinerary.

## Dependencies

- **Components:** `Navbar` (`layout/navbar`).
- **Services:** `ToastService` (`core/services/toast.service.ts`) for the
  submit acknowledgement.
- **Validators:** `dateRangeValidator` (group-level).
- **Models:** `TripData` (the raw form payload shape).
- **Angular:** `ReactiveFormsModule`, `CommonModule`, `Router`, `FormBuilder`.

## Business logic

**Form** (`fb.group`):

| Control | Validators |
| ------- | ---------- |
| `from` | required |
| `to` | required |
| `departureDate` | required |
| `returnDate` | required |
| `adults` | required, min 1 |
| `children` | — |
| `rooms` | — |
| `travelStyle` | — (string array) |
| `budget` | required, min `MIN_BUDGET` (1000) |
| `specialRequests` | — |

Group validator: `dateRangeValidator` (flags `{ dateInvalid: true }` when the
return date precedes departure).

**Methods**
- `increase(field)` / `decrease(field)` — counter steppers. `decrease` respects
  per-field minimums in `STEP_MINIMUMS` (`adults: 1, children: 0, rooms: 1`).
- `isStyleSelected(style)` / `toggleStyle(style)` — manage the multi-select
  travel-style chips, rendered from the `TRAVEL_STYLES` array (Adventure,
  Relaxation, Cultural, Foodie, Nature, Luxury, Nightlife, Family).
- `submit()` — marks all touched if invalid; otherwise reads
  `form.getRawValue()` as `TripData`, fires `toast.success(...)`, and navigates
  to `/my-trips`.

## Notes / future work

- Wire `submit()` to a real itinerary-generation API; map `TripData` into the
  request and route to the generated trip rather than the trips list.
- Travel-style options are a hard-coded `const` array.
