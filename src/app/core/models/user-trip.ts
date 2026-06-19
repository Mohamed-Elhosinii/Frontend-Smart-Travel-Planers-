import { DayPlan } from './day-plan';
import { FlightInfo } from './flight-info';
import { HotelInfo } from './hotel-info';

export type TripStatus = 'upcoming' | 'ongoing' | 'completed';

/** A fully planned trip belonging to the user. */
export interface UserTrip {
  id: string;
  destination: string;
  country?: string;
  from: string;
  departureDate: string;
  returnDate: string;
  coverImage: string;
  totalBudget: number;
  spentBudget: number;
  travelStyle: string[];
  days: DayPlan[];
  status: TripStatus;
  flight?: FlightInfo;
  hotel?: HotelInfo;
}
