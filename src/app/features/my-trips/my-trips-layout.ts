import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';

/** Shell layout for the My Trips section: persistent navbar + routed child views. */
@Component({
  selector: 'app-my-trips-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar],
  template: `
    <app-navbar [lightBg]="true" />
    <div style="padding-top: var(--navbar-height)">
      <router-outlet />
    </div>
  `,
})
export class MyTripsLayout {}
