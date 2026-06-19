import { Injectable } from '@angular/core';
import { UserTrip } from '../models';
import { MOCK_TRIPS } from '../data/mock-trips.data';

/**
 * Provides access to the user's trips.
 *
 * Currently reads from in-memory mock data. To connect a backend, replace the
 * method bodies with HTTP calls returning the same types — callers won't change.
 */
@Injectable({ providedIn: 'root' })
export class TripService {
  /** All trips belonging to the user. */
  getAll(): UserTrip[] {
    return MOCK_TRIPS;
  }

  /** A single trip by id, or `undefined` if it does not exist. */
  getById(id: string): UserTrip | undefined {
    return MOCK_TRIPS.find((trip) => trip.id === id);
  }
}
