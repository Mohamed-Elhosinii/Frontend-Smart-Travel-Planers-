import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { Signup } from './pages/signup/signup';
import { Login } from './pages/login/login';
import { TripForm } from './pages/trip-form/trip-form';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  { path: 'plan', component: TripForm},
  { path: '**', redirectTo: '' }
];