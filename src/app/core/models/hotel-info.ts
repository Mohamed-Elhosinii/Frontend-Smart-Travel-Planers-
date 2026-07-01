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
  
  // New enriched fields
  hotelId?: string;
  images?: string[];
  pricePerNight?: number | null;
  reviewScore?: number | null;
  reviewCount?: number | null;
  bookingUrl?: string | null;
}
