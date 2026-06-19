/**
 * Daily weather forecast attached to a day plan.
 * Temperatures are in degrees Celsius.
 */
export interface Weather {
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  /** Forecast icon URL (e.g. OpenWeatherMap). */
  iconUrl: string;
  /** Short AI-generated packing/planning tip for the day. */
  aiTip: string;
}
