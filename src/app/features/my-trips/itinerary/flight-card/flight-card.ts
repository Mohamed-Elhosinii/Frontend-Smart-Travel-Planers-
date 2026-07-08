import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightInfo } from '../../../../core/models';

@Component({
  selector: 'app-flight-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flight-card.html',
  styleUrl: './flight-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightCard {
  @Input() flight: FlightInfo | null | undefined = null;
  @Input() isGenerating = false;

  formatTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}