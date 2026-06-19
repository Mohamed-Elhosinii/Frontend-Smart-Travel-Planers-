import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Global site footer with legal links and social media. */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {}
