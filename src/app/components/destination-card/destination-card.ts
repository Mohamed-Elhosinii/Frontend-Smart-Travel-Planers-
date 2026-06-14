import { Component, Input } from '@angular/core';


import { Destination } from '../../interfaces/destination';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-destination-card',
  imports: [RouterLink],
  templateUrl: './destination-card.html',
  styleUrl: './destination-card.css',
})
export class DestinationCard {
   @Input() destination!: Destination;
    
  
}
