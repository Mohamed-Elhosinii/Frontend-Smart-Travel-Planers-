/** Raw form payload captured by the trip planner before an itinerary is generated. */
export interface TripData {
  from: string;
  to: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  rooms: number;
  travelStyle: string[];
  budget: string;
  specialRequests: string;
}
