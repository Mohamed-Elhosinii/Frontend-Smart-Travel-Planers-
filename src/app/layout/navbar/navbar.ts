import { Component, HostListener, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/** Fixed top navigation bar with an auth-aware menu and responsive mobile drawer. */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  /** Render the solid (scrolled) style immediately, for pages without a hero. */
  @Input() lightBg = false;

  isScrolled = false;
  isDropdownOpen = false;
  isMenuOpen = false;

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

  logout(): void {
    this.authService.logout();
    this.isDropdownOpen = false;
  }

  get userInitials(): string {
    const email = this.authService.currentEmail();
    if (!email) return 'U';
    
    // Extract part before @
    const namePart = email.split('@')[0];
    const parts = namePart.split(/[._-]/).filter((p: string) => p.length > 0);
    
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
