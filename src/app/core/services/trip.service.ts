import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, timer, forkJoin } from 'rxjs';
import { catchError, concatMap, first, take, map, switchMap } from 'rxjs/operators';
<<<<<<< Updated upstream
import { TripCreateDto, TripPlanDto, UserTrip } from '../models';
=======
import {
  ConfirmDestinationResponse,
  ResolveDestinationResponse,
  TripCreateDto,
  TripPlanDto,
  TripStatus,
  UserTrip,
  TripSummaryDto,
} from '../models';
>>>>>>> Stashed changes
import { mapTripPlanDtoToUserTrip } from '../../features/my-trips/travel-plan/travel-plan';
import { ENDPOINTS } from '../config/endpoints';

/** Narrows an arbitrary backend status string to the app's `TripStatus`. */
function toTripStatus(raw: string | null | undefined): TripStatus {
  switch ((raw ?? '').toLowerCase()) {
    case 'upcoming':
      return 'upcoming';
    case 'completed':
      return 'completed';
    case 'ongoing':
    default:
      return 'ongoing';
  }
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly http = inject(HttpClient);

  /**
   * جيب كل trips اليوزر من الـ API عن طريق الـ tripIds
   * المحفوظة في localStorage من الـ sessions.
   */
  getAllFromApi(): Observable<UserTrip[]> {
<<<<<<< Updated upstream
    const stored = localStorage.getItem('userTripIds');
    const tripIds: string[] = stored ? JSON.parse(stored) : [];

    if (tripIds.length === 0) return of([]);

    const requests = tripIds.map(id =>
      this.getPlan(id).pipe(
        map(dto => mapTripPlanDtoToUserTrip(dto)),
        catchError(() => of(null))
      )
    );

    return forkJoin(requests).pipe(
      map(results => results.filter((t): t is UserTrip => t !== null))
=======
    return this.http.get<TripSummaryDto[]>(ENDPOINTS.trip.base).pipe(
      map(dtos => dtos.map(dto => ({
        id: dto.id,
        destination: dto.destination,
        country: dto.country || '',
        from: dto.originCity,
        departureDate: dto.startDate,
        returnDate: dto.endDate,
        coverImage: dto.coverImage || 'assets/images/default-trip.jpg', // Provide a fallback cover image
        totalBudget: dto.budgetTotal,
        spentBudget: dto.budgetSpent,
        travelStyle: dto.travelStyle,
        days: [], // Day details are not fetched in the summary
        status: toTripStatus(dto.status),
      } as UserTrip)))
>>>>>>> Stashed changes
    );
  }

  createQuickPlan(dto: TripCreateDto): Observable<{ tripId?: string; message?: string }> {
    return this.http.post<{ tripId?: string; message?: string }>(
      ENDPOINTS.trip.quickPlan,
      dto,
    );
  }

  getPlan(tripId: string): Observable<TripPlanDto> {
    return this.http.get<TripPlanDto>(ENDPOINTS.chat.plan(tripId));
  }

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
<<<<<<< Updated upstream
=======

  resolveDestination(query: string): Observable<ResolveDestinationResponse> {
    return this.http.post<ResolveDestinationResponse>(ENDPOINTS.places.resolve, { query });
  }

  confirmDestination(destId: string, resolvedName: string): Observable<ConfirmDestinationResponse> {
    return this.http.post<ConfirmDestinationResponse>(ENDPOINTS.places.confirm, { destId, resolvedName });
  }
>>>>>>> Stashed changes
}