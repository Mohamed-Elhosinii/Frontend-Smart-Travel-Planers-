import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, timer, forkJoin } from 'rxjs';
import { catchError, concatMap, first, take, map, switchMap } from 'rxjs/operators';
import { TripCreateDto, TripPlanDto, UserTrip, TripSummaryDto } from '../models';
import { mapTripPlanDtoToUserTrip } from '../../features/my-trips/travel-plan/travel-plan';

const CHAT_API_BASE = '/api/Chat';
const TRIP_API_BASE = '/api/Trip';

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly http = inject(HttpClient);

  /**
   * Fetch all trips for the authenticated user from the backend.
   */
  getAllFromApi(): Observable<UserTrip[]> {
    return this.http.get<TripSummaryDto[]>(TRIP_API_BASE).pipe(
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
        status: dto.status.toLowerCase() as any
      } as UserTrip)))
    );
  }

  createQuickPlan(dto: TripCreateDto): Observable<{ tripId?: string; message?: string }> {
    return this.http.post<{ tripId?: string; message?: string }>(
      `${TRIP_API_BASE}/quick-plan`,
      dto,
    );
  }

  getPlan(tripId: string): Observable<TripPlanDto> {
    return this.http.get<TripPlanDto>(`${CHAT_API_BASE}/plan/${tripId}`);
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

  resolveDestination(query: string): Observable<any> {
    return this.http.post('/api/places/resolve', { query });
  }

  confirmDestination(destId: string, resolvedName: string): Observable<any> {
    return this.http.post('/api/places/confirm', { destId, resolvedName });
  }
}