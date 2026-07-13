import { ChangeDetectionStrategy, Component, Input, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HotelInfo } from '../../../../core/models';
import { ENDPOINTS } from '../../../../core/config/endpoints';

/** Compact summary card for a trip's accommodation. */
@Component({
  selector: 'app-hotel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-card.html',
  styleUrl: './hotel-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelCard implements OnInit, OnDestroy {
  @Input() hotel: HotelInfo | null | undefined = null;
  @Input() isGenerating = false;

  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoadingLinks = false;
  currentImageIndex = 0;
  private autoPlayInterval: any;

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  startAutoPlay(): void {
    if (this.hotel?.images && this.hotel.images.length > 1) {
      this.autoPlayInterval = setInterval(() => {
        this.nextImage();
      }, 4000);
    }
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  nextImage(event?: Event): void {
    if (event) {
      event.stopPropagation();
      this.stopAutoPlay(); // Stop autoplay if user manually interacts
    }
    if (this.hotel?.images?.length) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.hotel.images.length;
      this.cdr.markForCheck();
    }
  }

  prevImage(event?: Event): void {
    if (event) {
      event.stopPropagation();
      this.stopAutoPlay();
    }
    if (this.hotel?.images?.length) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.hotel.images.length) % this.hotel.images.length;
      this.cdr.markForCheck();
    }
  }

  goToImage(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
      this.stopAutoPlay();
    }
    this.currentImageIndex = index;
    this.cdr.markForCheck();
  }

  onImageError(index: number): void {
    if (this.hotel?.images) {
      // Remove the broken image
      this.hotel.images.splice(index, 1);
      // Adjust index if we went out of bounds
      if (this.currentImageIndex >= this.hotel.images.length) {
        this.currentImageIndex = Math.max(0, this.hotel.images.length - 1);
      }
      this.cdr.markForCheck();
    }
  }

  /** Returns array of star types (full, half, empty) representing the review rating out of 5. */
  getStarsFromRating(): ('full' | 'half' | 'empty')[] {
    if (!this.hotel) return Array(5).fill('empty');
    const score = this.hotel.reviewScore ?? this.hotel.rating ?? 0;
    const ratingOutOfFive = score / 2;
    
    const stars: ('full' | 'half' | 'empty')[] = [];
    const rounded = Math.round(ratingOutOfFive * 2) / 2;
    
    for (let i = 1; i <= 5; i++) {
      if (rounded >= i) {
        stars.push('full');
      } else if (rounded === i - 0.5) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  }

  /** Scaled review score from base 10 to base 5, formatted to 1 decimal place. */
  getRatingOutOfFive(): string {
    if (!this.hotel) return '0.0';
    const score = this.hotel.reviewScore ?? this.hotel.rating ?? 0;
    return (score / 2).toFixed(1);
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
    this.http.get<any>(ENDPOINTS.hotels.bookingLinks(this.hotel.name)).subscribe({
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