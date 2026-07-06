import { Injectable } from '@angular/core';
import { UNSPLASH_CONFIG } from '../config/external.config';

@Injectable({ providedIn: 'root' })
export class UnsplashService {
  private readonly accessKey = UNSPLASH_CONFIG.accessKey;
  private readonly cache = new Map<string, string>();

  /**
   * Fetch the best photo URL for a destination from Unsplash.
   * Returns a fallback generic travel image if the API fails.
   */
  async getDestinationPhoto(destination: string): Promise<string> {
    const key = destination.toLowerCase().trim();

    // Return cached result if available
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    try {
      const query = encodeURIComponent(`${destination} city travel landmark`);
      const url = `${UNSPLASH_CONFIG.searchUrl}?query=${query}&per_page=1&orientation=landscape&client_id=${this.accessKey}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Unsplash API error');

      const data = await response.json();
      const photo = data?.results?.[0];

      if (!photo) throw new Error('No results');

      // Trigger download event as required by Unsplash API guidelines
      this.triggerDownload(photo.links.download_location);

      const imageUrl = photo.urls.regular; // regular = ~1080px wide, good quality
      this.cache.set(key, imageUrl);
      return imageUrl;

    } catch {
      const fallback = UNSPLASH_CONFIG.fallbackImage;
      this.cache.set(key, fallback);
      return fallback;
    }
  }

  /** Required by Unsplash API guidelines when a photo is used */
  private triggerDownload(downloadLocation: string): void {
    fetch(`${downloadLocation}?client_id=${this.accessKey}`).catch(() => {});
  }
}