import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { Signup } from './pages/signup/signup';
import { Login } from './pages/login/login';
import { TripForm } from './pages/trip-form/trip-form';
import { DestinationCard } from './components/destination-card/destination-card';
import { Destinations } from './pages/destinations/destinations';


export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  { path: 'plan', component: TripForm },
  { path: 'destinations', component: Destinations },
  { path: '**', redirectTo: '' },
];