/** Summary of the booked accommodation for a trip. */
export interface HotelInfo {
  name: string;
  address: string;
  /** Star rating, 1–5. */
  stars: number;
  checkIn: string;
  checkOut: string;
  /** Guest review score, 0–10. */
  rating: number;
}
