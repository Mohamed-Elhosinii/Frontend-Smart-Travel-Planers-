/**
 * Backend trip-plan contract — mirrors the .NET `TripPlanDto` returned by
 * GET /api/Chat/plan/{tripId} (Orchestrator). Field names match the JSON
 * exactly (camelCase). This is the RAW API shape; the My-Trips view maps it
 * to the `UserTrip` view-model via `mapTripPlanDtoToUserTrip`.
 */

export interface TripHotelDto {
  name: string;
  pricePerNight?: number | null;
  rating?: number | null;
  address?: string | null;
  images: string[];
}

export interface TripFlightDto {
  airlineName: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  estimatedPrice: number;
}

export interface DayWeatherDto {
  date: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  precipProb: number;
  conditions: string;
  iconUrl: string;
}

export interface ActivityImageDto {
  urls: string[];
}

export interface ActivityPlanDto {
  name: string;
  type: string;
  locationName?: string | null;
  lat?: number | null;
  lng?: number | null;
  timeSlot?: string | null;
  estimatedCost: number;
  placeId?: string | null;
  images: ActivityImageDto[];
}

export interface DayPlanDto {
  dayNumber: number;
  date: string;
  budgetAllocated: number;
  activities: ActivityPlanDto[];
  weather?: DayWeatherDto | null;
}

export interface TripPlanDto {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetTotal: number;
  estimatedTotalCost: number;
  hotel: TripHotelDto | null;
  flight: TripFlightDto | null;
  days: DayPlanDto[];
  weather: DayWeatherDto[];
  summary: string;
}

/**
 * Request body for POST /api/Trip/quick-plan (and the chat's TRIP_READY payload).
 * Mirrors the backend `TripCreateDto` exactly. `originCity` null/omitted → no flight.
 */
export interface TripCreateDto {
  destination: string;
  originCity?: string | null;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  numTravelers: number;
  budgetTotal: number;
  preferences: string[];
}
