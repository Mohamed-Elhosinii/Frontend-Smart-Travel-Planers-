/**
 * A single scheduled item within a day of a trip itinerary
 * (e.g. a museum visit, a meal, a transfer).
 */
export type ActivityType = 'sightseeing' | 'food' | 'transport' | 'hotel' | 'activity';
export type ActivityCategory = 'food' | 'attraction' | 'hotel' | 'transport' | 'leisure';

export interface Activity {
  /** Stable unique id, used for list tracking and map markers. */
  id: string;
  time: string;
  title: string;
  locationName: string;
  lat: number;
  lng: number;
  description: string;
  type: ActivityType;
  category: ActivityCategory;
  /** Emoji shown on the timeline dot and map marker. */
  icon: string;
  cost?: number;
}
