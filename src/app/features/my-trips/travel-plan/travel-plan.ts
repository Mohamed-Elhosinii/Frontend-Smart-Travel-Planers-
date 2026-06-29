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
import { UnsplashService } from '../../../core/services/unsplash.service';
import { FlightCard } from '../itinerary/flight-card/flight-card';
import { HotelCard } from '../itinerary/hotel-card/hotel-card';
import { WeatherBanner } from '../itinerary/weather-banner/weather-banner';
import { InteractiveMap } from '../itinerary/interactive-map/interactive-map';
import { TripChatPanel } from '../itinerary/trip-chat-panel/trip-chat-panel';

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
  ], // ← أضفنا TripChatPanel
  templateUrl: './travel-plan.html',
  styleUrl: './travel-plan.css',
})
export class TravelPlanPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tripService = inject(TripService);
  private readonly pdfExport = inject(PdfExportService);
  private readonly toast = inject(ToastService);
  private readonly unsplash = inject(UnsplashService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly trip = signal<UserTrip | null>(null);
  readonly notFound = signal(false);
  readonly selectedDayIndex = signal(0);
  readonly isExporting = signal(false);
  readonly isSplitOpen = signal(false); // ← جديد: حالة الـ split view

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

    this.tripService.getPlan(id).subscribe({
      next: async (dto) => {
        const mapped = mapTripPlanDtoToUserTrip(dto);
        const coverImage = await this.unsplash.getDestinationPhoto(dto.destination);
        this.trip.set({ ...mapped, coverImage });
      },
      error: () => this.notFound.set(true),
    });
  }

  /** فتح الـ split view */
  openSplit(): void {
    this.isSplitOpen.set(true);
  }

  /** إغلاق الـ split view */
  closeSplit(): void {
    this.isSplitOpen.set(false);
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
  // onTripUpdated(): void {
  //   const id = this.route.snapshot.paramMap.get('id');
  //   if (!id) return;

  //  setTimeout(() => {
  //    this.tripService.getPlan(id).subscribe({
  //      next: async (dto) => {
  //        const mapped = mapTripPlanDtoToUserTrip(dto);
  //        const coverImage = await this.unsplash.getDestinationPhoto(dto.destination);
  //        this.trip.set({ ...mapped, coverImage });
  //      },
  //    });
  //  }, 15000);
  onTripUpdated(): void {
  const id = this.route.snapshot.paramMap.get('id');
  if (!id) return;

  this.tripService.getPlan(id).subscribe({
    next: async (dto) => {
      const mapped = mapTripPlanDtoToUserTrip(dto);
      const coverImage = await this.unsplash.getDestinationPhoto(dto.destination);
      this.trip.set({ ...mapped, coverImage });
    },
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
  };
 
}