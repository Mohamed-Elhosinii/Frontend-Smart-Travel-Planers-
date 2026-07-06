import { Component, HostListener, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Modal } from '../../shared/modal/modal';
import { TripPlannerForm } from '../../shared/trip-planner-form/trip-planner-form';
import { Logo } from '../../shared/logo/logo';

/** Fixed top navigation bar with an auth-aware menu and responsive mobile drawer. */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Modal, TripPlannerForm, Logo],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  /** Render the solid (scrolled) style immediately, for pages without a hero. */
  @Input() lightBg = false;

  isScrolled = false;
  isDropdownOpen = false;
  isMenuOpen = false;
  isPlannerOpen = false;

  constructor(public readonly authService: AuthService) {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 60;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.isDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isDropdownOpen = false;
    this.isMenuOpen = false;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  openPlanner(): void {
    this.isPlannerOpen = true;
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.isDropdownOpen = false;
  }
}
