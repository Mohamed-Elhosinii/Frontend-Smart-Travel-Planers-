import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { NgClass, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Activity,
  ActivityCategory,
  ActivityPlanDto,
  ActivityType,
  DayPlan,
  DayPlanDto,
  DayWeatherDto,
  FlightInfo,
  HotelInfo,
  TripPlanDto,
  TripStatus,
  UserTrip,
  Weather,
} from '../../../core/models';
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
    if (!id) {
      this.notFound.set(true);
      return;
    }

    // Fetch the real persisted itinerary (GET /api/Chat/plan/{id}).
    // 404 / any error → show the existing "not found" state.
    this.tripService.getPlan(id).subscribe({
      next: (dto) => this.trip.set(mapTripPlanDtoToUserTrip(dto)),
      error: () => this.notFound.set(true),
    });
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

// ---------------------------------------------------------------------------
// Backend (TripPlanDto) → view-model (UserTrip) mapping
// ---------------------------------------------------------------------------
// The backend plan shape differs from what the itinerary components expect.
// This mapper bridges the two without changing any template. It only fills UI-only
// fields (icon, cover image, status, day title) that the backend doesn't provide;
// it never invents itinerary data.

const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  food: '🍽️',
  attraction: '🏛️',
  leisure: '🎯',
  hotel: '🏨',
  transport: '🚕',
};

/** Maps a backend activity `type` string to the view-model type + category. */
function classifyActivity(dtoType: string): { type: ActivityType; category: ActivityCategory } {
  switch ((dtoType || '').toLowerCase()) {
    case 'restaurant':
    case 'cafe':
    case 'food':
      return { type: 'food', category: 'food' };
    case 'hotel':
      return { type: 'hotel', category: 'hotel' };
    case 'transport':
      return { type: 'transport', category: 'transport' };
    case 'shopping':
    case 'nightlife':
    case 'leisure':
      return { type: 'activity', category: 'leisure' };
    case 'attraction':
    case 'museum':
    case 'park':
    case 'sightseeing':
      return { type: 'sightseeing', category: 'attraction' };
    default:
      return { type: 'activity', category: 'attraction' };
  }
}

function mapActivity(a: ActivityPlanDto, dayNumber: number, index: number): Activity {
  const { type, category } = classifyActivity(a.type);
  return {
    id: a.placeId || `d${dayNumber}-a${index + 1}`,
    time: a.timeSlot ?? '',
    title: a.name,
    locationName: a.locationName ?? a.name,
    // Template calls `.toFixed(4)` on lat/lng, so they MUST be numbers.
    lat: a.lat ?? 0,
    lng: a.lng ?? 0,
    description: '',
    type,
    category,
    icon: CATEGORY_ICONS[category],
    cost: a.estimatedCost,
  };
}

function mapWeather(w: DayWeatherDto | null | undefined): Weather | undefined {
  if (!w) return undefined;
  return {
    date: w.date,
    tempMax: w.tempMax,
    tempMin: w.tempMin,
    condition: w.conditions,
    iconUrl: w.iconUrl,
    aiTip: '',
  };
}

function mapDay(d: DayPlanDto): DayPlan {
  return {
    dayNumber: d.dayNumber,
    date: d.date,
    title: `Day ${d.dayNumber}`,
    activities: (d.activities ?? []).map((a, i) => mapActivity(a, d.dayNumber, i)),
    weather: mapWeather(d.weather),
  };
}

function deriveStatus(startDate: string, endDate: string): TripStatus {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (!Number.isNaN(end) && end < now) return 'completed';
  if (!Number.isNaN(start) && start > now) return 'upcoming';
  return 'ongoing';
}

export function mapTripPlanDtoToUserTrip(dto: TripPlanDto): UserTrip {
  const firstActivityImage = (dto.days ?? [])
    .flatMap((d) => d.activities ?? [])
    .flatMap((a) => a.images ?? [])
    .flatMap((img) => img.urls ?? [])
    .find((url) => !!url);

  const coverImage = dto.hotel?.images?.find((u) => !!u) ?? firstActivityImage ?? '';

  const flight: FlightInfo | undefined = dto.flight
    ? {
        airline: dto.flight.airlineName,
        flightNumber: dto.flight.flightNumber,
        departure: dto.flight.departureAirport,
        arrival: dto.flight.arrivalAirport,
        departureTime: dto.flight.departureTime,
        arrivalTime: dto.flight.arrivalTime,
      }
    : undefined;

  const hotel: HotelInfo | undefined = dto.hotel
    ? {
        name: dto.hotel.name,
        address: dto.hotel.address ?? '',
        // Backend `rating` carries the star count (see Orchestrator.GetCurrentPlanAsync).
        stars: Math.round(dto.hotel.rating ?? 0),
        checkIn: dto.startDate,
        checkOut: dto.endDate,
        rating: dto.hotel.rating ?? 0,
      }
    : undefined;

  return {
    id: dto.tripId,
    destination: dto.destination,
    from: dto.flight?.departureAirport ?? '',
    departureDate: dto.startDate,
    returnDate: dto.endDate,
    coverImage,
    totalBudget: dto.budgetTotal,
    spentBudget: dto.estimatedTotalCost,
    travelStyle: [],
    days: (dto.days ?? []).map(mapDay),
    status: deriveStatus(dto.startDate, dto.endDate),
    flight,
    hotel,
  };
}
