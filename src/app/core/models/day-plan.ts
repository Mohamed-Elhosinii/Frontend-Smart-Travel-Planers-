import { Activity } from './activity';
import { Weather } from './weather';

/** One day of a trip itinerary. */
export interface DayPlan {
  dayNumber: number;
  /** Display date, e.g. "June 18 — Wednesday". */
  date: string;
  title: string;
  activities: Activity[];
  weather?: Weather;
}
