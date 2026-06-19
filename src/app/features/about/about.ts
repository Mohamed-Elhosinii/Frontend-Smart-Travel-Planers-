import { Component } from '@angular/core';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';

/** Static "About Us" marketing page. */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class AboutPage {}
