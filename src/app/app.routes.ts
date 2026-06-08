import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { HomeComponent } from './pages/home/home.component';
import { Signup } from './pages/signup/signup';
import { Login } from './pages/login/login';

export const routes: Routes = [
    {path:'trip-form', loadComponent: () => import('./pages/trip-form/trip-form').then(m => m.TripForm)},
];
