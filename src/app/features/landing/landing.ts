import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { TripPlannerForm } from '../../shared/trip-planner-form/trip-planner-form';

/** Public marketing landing page (route `''`). */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, Navbar, Footer, TripPlannerForm],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingPage {}
