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
  stars?: number | null;
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
  airlineCode: string;
  departureTerminal: string;
  arrivalTerminal: string;
  flightDuration: string;
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
  id: string;
  name: string;
  type: string;
  locationName?: string | null;
  lat?: number | null;
  lng?: number | null;
  timeSlot?: string | null;
  estimatedCost: number;
  placeId?: string | null;
  rating?: number | null;
  address?: string | null;
  imageUrl?: string | null;
  images: ActivityImageDto[];
}

export interface DayPlanDto {
  dayNumber: number;
  date: string;
  budgetAllocated: number;
  activities: ActivityPlanDto[];
  weather?: DayWeatherDto | null;
}

export interface TripSummaryDto {
  id: string;
  destination: string;
  country?: string;
  originCity: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  budgetTotal: number;
  budgetSpent: number;
  travelStyle: string[];
  status: string;
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
  returnFlight: TripFlightDto | null;
  days: DayPlanDto[];
  weather: DayWeatherDto[];
  summary: string;
}

/** A suggested destination returned when a query needs user confirmation. */
export interface DestinationSuggestion {
  resolvedName: string;
  destId: string;
  destType?: string;
}

/**
 * Response of POST /api/places/resolve. The backend `status` is a numeric enum
 * (0 = Resolved, 1 = NeedsConfirmation, 2 = NotFound) which some builds serialise
 * as the string name — callers must accept either.
 */
export interface ResolveDestinationResponse {
  status: number | 'Resolved' | 'NeedsConfirmation' | 'NotFound';
  destId: string;
  destType: string;
  resolvedName: string | null;
  originalInput: string | null;
  source: string | null;
  suggestion: DestinationSuggestion | null;
}

/** Response of POST /api/places/confirm. */
export interface ConfirmDestinationResponse {
  destId: string;
  resolvedName: string;
}

/**
 * Request body for POST /api/Trip/quick-plan (and the chat's TRIP_READY payload).
 * Mirrors the backend `TripCreateDto` exactly. `originCity` null/omitted → no flight.
 */
export interface TripCreateDto {
  destination: string;
  destId?: string | null;
  destType?: string | null;
  originCity?: string | null;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  numTravelers: number;
  budgetTotal: number;
  preferences: string[];
  isRoundTrip?: boolean;
}
