import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Weather } from '../../../../core/models';

/** Banner showing a day's forecast and an AI packing tip. */
@Component({
  selector: 'app-weather-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-banner.html',
  styleUrl: './weather-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherBanner {
  @Input() weather: Weather | null | undefined = null;
  @Input() isGenerating = false;

  /** Theme class derived from the weather condition string. */
  getWeatherClass(condition: string): string {
    if (!condition) return 'weather-default';
    const c = condition.toLowerCase();
    if (c.includes('sunny') || c.includes('hot')) return 'weather-sunny';
    if (c.includes('cloud')) return 'weather-cloudy';
    if (c.includes('rain')) return 'weather-rainy';
    return 'weather-default';
  }
}
