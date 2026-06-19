import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { NgClass, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserTrip } from '../../../core/models';
import { TripService } from '../../../core/services/trip.service';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import { ToastService } from '../../../core/services/toast.service';
import { FlightCard } from '../itinerary/flight-card/flight-card';
import { HotelCard } from '../itinerary/hotel-card/hotel-card';
import { WeatherBanner } from '../itinerary/weather-banner/weather-banner';
import { InteractiveMap } from '../itinerary/interactive-map/interactive-map';

/** Full itinerary view for one trip, loaded by `:id` from {@link TripService}. */
@Component({
  selector: 'app-travel-plan',
  standalone: true,
  imports: [NgClass, RouterLink, FlightCard, HotelCard, WeatherBanner, InteractiveMap],
  templateUrl: './travel-plan.html',
  styleUrl: './travel-plan.css',
})
export class TravelPlanPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tripService = inject(TripService);
  private readonly pdfExport = inject(PdfExportService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly trip = signal<UserTrip | null>(null);
  readonly notFound = signal(false);
  readonly selectedDayIndex = signal(0);
  readonly isExporting = signal(false);

  readonly currentDayPlan = computed(() => {
    const t = this.trip();
    if (!t || t.days.length === 0) return null;
    return t.days[this.selectedDayIndex()] ?? null;
  });
  readonly currentDayActivities = computed(() => this.currentDayPlan()?.activities ?? []);
  readonly currentDayWeather = computed(() => this.currentDayPlan()?.weather ?? null);
  readonly budgetPercent = computed(() => {
    const t = this.trip();
    if (!t || t.totalBudget === 0) return 0;
    return Math.min(100, Math.round((t.spentBudget / t.totalBudget) * 100));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const trip = id ? this.tripService.getById(id) : undefined;
    if (trip) {
      this.trip.set(trip);
    } else {
      this.notFound.set(true);
    }
  }

  selectDay(index: number): void {
    this.selectedDayIndex.set(index);
  }

  getCategoryClass(category: string): string {
    const map: Record<string, string> = {
      food: 'cat-food',
      attraction: 'cat-attraction',
      leisure: 'cat-leisure',
      hotel: 'cat-hotel',
      transport: 'cat-transport',
    };
    return map[category] ?? 'cat-attraction';
  }

  async exportToPDF(): Promise<void> {
    const t = this.trip();
    if (!this.isBrowser || !t || this.isExporting()) return;

    this.isExporting.set(true);
    try {
      await this.pdfExport.exportTrip(t);
    } catch {
      this.toast.danger('Sorry, the PDF could not be generated. Please try again.');
    } finally {
      this.isExporting.set(false);
    }
  }
}
