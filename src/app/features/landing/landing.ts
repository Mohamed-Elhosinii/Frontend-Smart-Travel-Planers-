import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';

/** Public marketing landing page (route `''`). */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingPage {}
