import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, TitleCasePipe, DecimalPipe } from '@angular/common';
import { UserTrip } from '../../core/models';
import { TripService } from '../../core/services/trip.service';

const DAY_MS = 1000 * 60 * 60 * 24;

/** Grid of the user's trips with status, budget and quick links to itineraries. */
@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [RouterLink, NgClass, TitleCasePipe, DecimalPipe],
  templateUrl: './my-trips.html',
  styleUrl: './my-trips.css',
})
export class MyTripsPage {
  private readonly tripService = inject(TripService);

  readonly trips: UserTrip[] = this.tripService.getAll();

  getStatusClass(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'badge-upcoming';
      case 'ongoing':
        return 'badge-ongoing';
      case 'completed':
        return 'badge-completed';
      default:
        return '';
    }
  }

  getBudgetPercent(trip: UserTrip): number {
    if (trip.totalBudget === 0) return 0;
    return Math.round((trip.spentBudget / trip.totalBudget) * 100);
  }

  getDaysCount(trip: UserTrip): number {
    const start = new Date(trip.departureDate).getTime();
    const end = new Date(trip.returnDate).getTime();
    return Math.max(0, Math.ceil((end - start) / DAY_MS));
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
