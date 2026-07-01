import { ChangeDetectionStrategy, Component, Input, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HotelInfo } from '../../../../core/models';

/** Compact summary card for a trip's accommodation. */
@Component({
  selector: 'app-hotel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-card.html',
  styleUrl: './hotel-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelCard {
  @Input() hotel: HotelInfo | null | undefined = null;

  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoadingLinks = false;

  /** Array sized to the (0–5 clamped) star rating, for rendering star icons. */
  getStars(count: number): number[] {
    return Array.from({ length: Math.min(5, Math.max(0, count || 0)) });
  }

  /** Format ISO/date string to readable format e.g. "Aug 10, 2026" */
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

  loadBookingLinks(): void {
    if (!this.hotel) return;
    if (this.hotel.bookingUrl) {
      window.open(this.hotel.bookingUrl, '_blank');
      return;
    }
    
    this.isLoadingLinks = true;
    this.http.get<any>(`/api/hotels/${encodeURIComponent(this.hotel.name)}/booking-links`).subscribe({
      next: (res) => {
        this.isLoadingLinks = false;
        if (res && res.links && Object.keys(res.links).length > 0) {
          const links = res.links;
          const url = links['Booking.com'] || links['Booking'] || links['Tripadvisor'] || Object.values(links)[0];
          this.hotel!.bookingUrl = url as string;
          window.open(this.hotel!.bookingUrl, '_blank');
        } else {
          this.hotel!.bookingUrl = `https://www.google.com/search?q=book+${encodeURIComponent(this.hotel!.name)}+hotel`;
          window.open(this.hotel!.bookingUrl, '_blank');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingLinks = false;
        this.hotel!.bookingUrl = `https://www.google.com/search?q=book+${encodeURIComponent(this.hotel!.name)}+hotel`;
        window.open(this.hotel!.bookingUrl, '_blank');
        this.cdr.markForCheck();
      }
    });
  }
}