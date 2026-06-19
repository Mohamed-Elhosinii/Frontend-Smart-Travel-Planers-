import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';

/**
 * Shared chrome for legal/policy pages (navbar, header, card, footer).
 * Page-specific prose is projected via `<ng-content>`.
 */
@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './legal-page.html',
  styleUrl: './legal-page.css',
})
export class LegalPage {
  @Input({ required: true }) heading!: string;
  @Input({ required: true }) lastUpdated!: string;
}
