import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';
import { Activity } from '../../../../core/models';

/**
 * Leaflet map plotting a day's activities as numbered, route-connected markers.
 *
 * The map is created in {@link ngAfterViewInit} (browser only) and fully torn
 * down in {@link ngOnDestroy}. Marker/popup HTML is built from trusted in-app
 * trip data; sanitize it before rendering if activities ever become user-supplied.
 */
@Component({
  selector: 'app-interactive-map',
  standalone: true,
  templateUrl: './interactive-map.html',
  styleUrl: './interactive-map.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteractiveMap implements AfterViewInit, OnChanges, OnDestroy {
  @Input() activities: Activity[] | null | undefined = [];
  @Input() dayNumber = 1;
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private markerLayers: L.Marker[] = [];
  private polylineLayer: L.Polyline | null = null;
  private readonly isBrowser: boolean;
  private mapInitialized = false;

  private readonly categoryColors: Record<string, string> = {
    food: '#a53015',
    attraction: '#3D2B2F',
    leisure: '#c46030',
    hotel: '#B54304',
    transport: '#6B6B6B',
  };

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.initMap();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activities'] && this.mapInitialized) {
      this.updateMapMarkers();
    }
  }

  ngOnDestroy(): void {
    this.clearMap();
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;

    const acts = this.activities || [];
    const center: L.LatLngExpression =
      acts.length > 0 ? [acts[0].lat, acts[0].lng] : [41.9028, 12.4964];

    this.map = L.map(this.mapContainer.nativeElement, {
      center,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.mapInitialized = true;
    this.updateMapMarkers();
  }

  private updateMapMarkers(): void {
    this.clearMapLayers();
    if (!this.map) return;

    const acts = this.activities || [];
    if (acts.length === 0) return;

    const latLngs: L.LatLngTuple[] = [];

    acts.forEach((activity, index) => {
      const position: L.LatLngTuple = [activity.lat, activity.lng];
      latLngs.push(position);

      const color = this.categoryColors[activity.category] ?? '#B54304';

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 32px; height: 32px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(61,43,47,0.35);
            display: flex; align-items: center; justify-content: center;
            color: #ffffff;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 13px; font-weight: 700;
          ">${index + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const popupContent = `
        <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:6px;max-width:240px;color:#3D2B2F;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            <span>${activity.icon}</span> <span>${activity.locationName}</span>
          </div>
          <div style="color:#B54304;font-size:11.5px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
            <i class="fa-solid fa-clock"></i> ${activity.time}
          </div>
          <div style="color:#6B6B6B;font-size:11.5px;line-height:1.5;font-weight:500;">
            ${activity.description}
          </div>
        </div>`;

      const marker = L.marker(position, { icon: customIcon })
        .bindPopup(popupContent, { closeButton: true, offset: L.point(0, -5) })
        .addTo(this.map!);

      this.markerLayers.push(marker);
    });

    if (latLngs.length > 1) {
      this.polylineLayer = L.polyline(latLngs, {
        color: '#B54304',
        weight: 4,
        dashArray: '8, 6',
        opacity: 0.85,
      }).addTo(this.map);
    }

    if (latLngs.length > 0) {
      this.map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 15 });
    }
  }

  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  private clearMapLayers(): void {
    this.markerLayers.forEach((marker) => marker.remove());
    this.markerLayers = [];
    if (this.polylineLayer) {
      this.polylineLayer.remove();
      this.polylineLayer = null;
    }
  }

  private clearMap(): void {
    this.clearMapLayers();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.mapInitialized = false;
  }
}
