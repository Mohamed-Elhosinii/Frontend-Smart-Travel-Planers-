import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
import { AuthService } from '../../../core/services/auth.service';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import { ToastService } from '../../../core/services/toast.service';
import { UnsplashService } from '../../../core/services/unsplash.service';
import { ENDPOINTS } from '../../../core/config/endpoints';
import { FlightCard } from '../itinerary/flight-card/flight-card';
import { HotelCard } from '../itinerary/hotel-card/hotel-card';
import { WeatherBanner } from '../itinerary/weather-banner/weather-banner';
import { InteractiveMap } from '../itinerary/interactive-map/interactive-map';
import { TripChatPanel } from '../itinerary/trip-chat-panel/trip-chat-panel';
import { GenerationLoader } from '../../../shared/generation-loader/generation-loader';

export interface PlaceSuggestion {
  fsqPlaceId: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  images: string[];
}

@Component({
  selector: 'app-travel-plan',
  standalone: true,
  imports: [
    NgClass,
    RouterLink,
    FlightCard,
    HotelCard,
    WeatherBanner,
    InteractiveMap,
    TripChatPanel,
    GenerationLoader,
  ],
  templateUrl: './travel-plan.html',
  styleUrl: './travel-plan.css',
  // NOTE: default change detection is intentional. This page hosts child
  // components (trip-chat-panel, cards, map) that update internal state from
  // async callbacks; OnPush here would gate their re-render.
})
export class TravelPlanPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly tripService = inject(TripService);
  private readonly auth = inject(AuthService);
  private readonly pdfExport = inject(PdfExportService);
  private readonly toast = inject(ToastService);
  private readonly unsplash = inject(UnsplashService);
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly trip = signal<UserTrip | null>(null);
  readonly notFound = signal(false);
  /** True while the itinerary is still being generated (drives the premium loader). */
  readonly isGenerating = signal(false);
  readonly selectedDayIndex = signal(0);
  readonly isExporting = signal(false);
  readonly isSplitOpen = signal(false);
  readonly suggestions = signal<PlaceSuggestion[]>([]);
  readonly isSuggestionsLoading = signal(false);

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

  /** Number of planned days, for the hero subtitle. */
  readonly durationDays = computed(() => this.trip()?.days.length ?? 0);



  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      return;
    }

    // Arriving straight from trip creation (chat / planner form) — the itinerary
    // may still be building, so poll behind the premium loader. This is the ONLY
    // place that waits for generation; the origin pages just navigate here.
    const generating = this.route.snapshot.queryParamMap.get('generating') === '1';
    this.loadPlan(id, generating);
  }

  /**
   * Load the trip plan. When `poll` is true we wait (via {@link TripService.pollPlan})
   * for the background generation to finish, showing the generation loader; a slow
   * generation falls back to a direct fetch so the page still renders.
   */
  private loadPlan(id: string, poll: boolean): void {
    if (poll) this.isGenerating.set(true);

    const source$ = poll ? this.tripService.pollPlan(id) : this.tripService.getPlan(id);
    source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: async (dto) => {
        await this.setTripFromDto(dto);
        this.isGenerating.set(false);
        this.loadSuggestions(id);
      },
      error: () => {
        if (poll) {
          // Generation didn't finish within the poll window — fetch once more so a
          // partial itinerary still shows instead of a dead end.
          this.tripService.getPlan(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: async (dto) => {
              await this.setTripFromDto(dto);
              this.isGenerating.set(false);
              this.loadSuggestions(id);
            },
            error: () => {
              this.isGenerating.set(false);
              this.notFound.set(true);
            },
          });
        } else {
          this.notFound.set(true);
        }
      },
    });
  }

  /**
   * Map a plan DTO into the view model and render it immediately, then fetch the
   * cover image and patch it in without blocking the itinerary (FE-13).
   */
  private async setTripFromDto(dto: TripPlanDto): Promise<void> {
    const mapped = mapTripPlanDtoToUserTrip(dto);
    this.trip.set(mapped);
    if (this.selectedDayIndex() >= mapped.days.length) {
      this.selectedDayIndex.set(0);
    }

    // Non-blocking: the itinerary is already visible; the hero cover fills in when ready.
    const coverImage = await this.unsplash.getDestinationPhoto(dto.destination);
    const current = this.trip();
    if (current && current.id === mapped.id) {
      this.trip.set({ ...current, coverImage });
    }
  }

  private loadSuggestions(tripId: string): void {
    this.isSuggestionsLoading.set(true);
    const headers = this.auth.getAuthHeaders();

    this.http.get<PlaceSuggestion[]>(ENDPOINTS.trip.suggestions(tripId), { headers, params: { limit: '6' } })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.suggestions.set(data);
          this.isSuggestionsLoading.set(false);
        },
        error: () => this.isSuggestionsLoading.set(false),
      });
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Restaurant': '🍽️',
      'Cafe': '☕',
      'Museum': '🏛️',
      'Park': '🌿',
      'Shopping Mall': '🛍️',
      'Movie Theater': '🎬',
      'Theater': '🎭',
      'Mosque': '🕌',
      'Church': '⛪',
      'Historic and Protected Site': '🏰',
      'Pastry Shop': '🥐',
      'Dessert Shop': '🍰',
      'Hotel': '🏨',
      'Art Museum': '🎨',
      'Beach': '🏖️',
    };
    return icons[category] ?? '📍';
  }

  openInMaps(lat: number, lng: number, name: string): void {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_name=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  }



  openSplit(): void { this.isSplitOpen.set(true); }
  closeSplit(): void { this.isSplitOpen.set(false); }
  selectDay(index: number): void { this.selectedDayIndex.set(index); }

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

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
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
  onTripUpdated(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // The AI panel edits the same trip in-place; re-fetch quietly (no full-page
    // loader) so the itinerary updates without a jarring reload.
    this.tripService.getPlan(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (dto) => this.setTripFromDto(dto),
    });
  }
}

// ---------------------------------------------------------------------------
// Backend (TripPlanDto) → view-model (UserTrip) mapping
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  food: '🍽️',
  attraction: '🏛️',
  leisure: '🎯',
  hotel: '🏨',
  transport: '🚕',
};

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
    humidity: w.humidity,
    precipProb: w.precipProb,
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
      stars: Math.round(dto.hotel.rating ?? 0),
      checkIn: dto.startDate,
      checkOut: dto.endDate,
      rating: dto.hotel.rating ?? 0,
      pricePerNight: dto.hotel.pricePerNight,
      images: dto.hotel.images ?? [],
    }
    : undefined;

  return {
    id: dto.tripId,
    destination: dto.destination,
    from: dto.flight?.departureAirport ?? '',
    departureDate: dto.startDate,
    returnDate: dto.endDate,
    coverImage: '',
    totalBudget: dto.budgetTotal,
    spentBudget: dto.estimatedTotalCost,
    travelStyle: [],
    days: (dto.days ?? []).map(mapDay),
    status: deriveStatus(dto.startDate, dto.endDate),
    flight,
    hotel,
    weather: (dto.weather ?? [])
      .map(mapWeather)
      .filter((w): w is Weather => !!w)
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}