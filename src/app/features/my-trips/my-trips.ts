import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, TitleCasePipe, DecimalPipe } from '@angular/common';
import { UserTrip } from '../../core/models';
import { TripService } from '../../core/services/trip.service';
import { UnsplashService } from '../../core/services/unsplash.service';
import { ToastService } from '../../core/services/toast.service';
import { Modal } from '../../shared/modal/modal';
import { STORAGE_KEYS } from '../../core/constants/storage';
import { storage } from '../../core/utils/storage';

const DAY_MS = 1000 * 60 * 60 * 24;

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [RouterLink, FormsModule, NgClass, TitleCasePipe, DecimalPipe, Modal],
  templateUrl: './my-trips.html',
  styleUrl: './my-trips.css',
})
export class MyTripsPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly tripService = inject(TripService);
  private readonly unsplash = inject(UnsplashService);
  private readonly toast = inject(ToastService);

  readonly trips = signal<UserTrip[]>([]);
  readonly isLoading = signal(true);

  /** Trip queued for deletion; drives the confirmation modal (FE-10). */
  readonly tripPendingDelete = signal<UserTrip | null>(null);

  /** Filter + sort state for the controls above the grid. */
  readonly sortOrder = signal<string>('newest');

  /** Trips after applying the active sort order. */
  readonly visibleTrips = computed(() => {
    const order = this.sortOrder();
    const list = this.trips();

    const byDate = (t: UserTrip) => new Date(t.departureDate).getTime() || 0;
    const sorted = [...list].sort((a, b) => byDate(b) - byDate(a));
    return order === 'oldest' ? sorted.reverse() : sorted;
  });

  ngOnInit(): void {
    this.loadTrips();
  }

  private loadTrips(): void {
    this.tripService.getAllFromApi()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (trips) => {
          const deleted = this.getDeletedIds();
          const filtered = trips.filter((t) => !deleted.includes(t.id));

          // Render the grid immediately (each trip already has a fallback cover),
          // then fill in Unsplash photos individually so the slowest image never
          // blocks first paint (FE-13).
          this.trips.set(filtered);
          this.isLoading.set(false);
          this.hydrateCovers(filtered);
        },
        error: () => {
          this.trips.set([]);
          this.isLoading.set(false);
        },
      });
  }

  /** Fetch each trip's cover photo lazily and patch it into the grid when ready. */
  private hydrateCovers(trips: UserTrip[]): void {
    for (const trip of trips) {
      this.unsplash.getDestinationPhoto(trip.destination).then((coverImage) => {
        if (!coverImage) return;
        this.trips.update((list) =>
          list.map((t) => (t.id === trip.id ? { ...t, coverImage } : t)),
        );
      });
    }
  }

  /** Opens the delete confirmation for a trip (FE-10). */
  requestDelete(trip: UserTrip, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.tripPendingDelete.set(trip);
  }

  /** Dismisses the delete confirmation without removing anything. */
  cancelDelete(): void {
    this.tripPendingDelete.set(null);
  }

  /** Confirms removal of the queued trip. */
  confirmDelete(): void {
    const trip = this.tripPendingDelete();
    if (!trip) return;

    const deleted = this.getDeletedIds();
    if (!deleted.includes(trip.id)) {
      deleted.push(trip.id);
      storage.set(STORAGE_KEYS.deletedTripIds, JSON.stringify(deleted));
    }
    this.trips.update((list) => list.filter((t) => t.id !== trip.id));
    this.tripPendingDelete.set(null);
    this.toast.success(`"${trip.destination}" was removed from your trips.`);
  }

  private getDeletedIds(): string[] {
    const stored = storage.get(STORAGE_KEYS.deletedTripIds);
    return stored ? JSON.parse(stored) : [];
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