import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightInfo } from '../../../../core/models';

/** Compact summary card for a trip's outbound flight. */
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
}
