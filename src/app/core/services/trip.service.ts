import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, concatMap, first, take } from 'rxjs/operators';
import { TripCreateDto, TripPlanDto, UserTrip } from '../models';
import { MOCK_TRIPS } from '../data/mock-trips.data';

/** Same-origin API paths — proxied to the backend by the Angular dev server (proxy.conf.json). */
const CHAT_API_BASE = '/api/Chat';
const TRIP_API_BASE = '/api/Trip';

/**
 * Provides access to the user's trips.
 *
 * The list view still reads in-memory mock data (`getAll`/`getById`). The real,
 * AI-generated itinerary is fetched from the backend via `getPlan`/`pollPlan`,
 * which conform to the async build contract: the orchestrator builds the plan in
 * the background, so GET /api/Chat/plan/{tripId} returns 404 ("not ready") until
 * the plan has been persisted, then 200 with the `TripPlanDto`.
 */
@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly http = inject(HttpClient);

  /** All trips belonging to the user (mock list data). */
  getAll(): UserTrip[] {
    return MOCK_TRIPS;
  }

  /** A single mock trip by id, or `undefined` if it does not exist. */
  getById(id: string): UserTrip | undefined {
    return MOCK_TRIPS.find((trip) => trip.id === id);
  }

  /**
   * POST /api/Trip/quick-plan — form-driven trip creation (no chat/AI).
   * Returns `{ tripId }` immediately; the plan builds in the background (poll with
   * `pollPlan`). If the monthly trip limit is reached, the backend returns
   * `{ message }` (no tripId) — callers should surface it and not poll.
   */
  createQuickPlan(dto: TripCreateDto): Observable<{ tripId?: string; message?: string }> {
    return this.http.post<{ tripId?: string; message?: string }>(
      `${TRIP_API_BASE}/quick-plan`,
      dto,
    );
  }

  /**
   * GET /api/Chat/plan/{tripId} — the persisted plan.
   * 200 `TripPlanDto` once the background build finished; 404 until then.
   */
  getPlan(tripId: string): Observable<TripPlanDto> {
    return this.http.get<TripPlanDto>(`${CHAT_API_BASE}/plan/${tripId}`);
  }

  /**
   * Polls `getPlan` every `intervalMs` (default 3s), treating 404 as
   * "still building". Emits the `TripPlanDto` on the first 200 and completes.
   * Errors out after `maxAttempts` (default 20) with no ready plan
   * (RxJS `first` throws `EmptyError` when the bounded stream completes empty),
   * or immediately on any non-404 error.
   *
   * NOTE: the backend returns 200 as soon as the *Draft* trip row exists — i.e.
   * BEFORE the background orchestrator has persisted the itinerary (verified at
   * runtime). A built plan always has at least one day, so we treat a 200 with
   * `days.length === 0` as "still building" and resolve only once it's populated.
   */
  pollPlan(tripId: string, intervalMs = 3000, maxAttempts = 20): Observable<TripPlanDto> {
    return timer(0, intervalMs).pipe(
      take(maxAttempts),
      concatMap(() =>
        this.getPlan(tripId).pipe(
          catchError((err: HttpErrorResponse) =>
            err.status === 404 ? of(null) : throwError(() => err),
          ),
        ),
      ),
      first((plan): plan is TripPlanDto => !!plan && plan.days.length > 0),
    );
  }
}
