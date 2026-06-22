import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Password-reset request page. Hits POST /api/Auth/forgot-password. */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);

  email = '';
  isSubmitted = false;
  errorMessage = '';
  isLoading = false;

  sendResetLink(): void {
    const email = this.email.trim();
    if (!email || !EMAIL_PATTERN.test(email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.isSubmitted = true;
        this.isLoading = false;
      },
      error: () => {
        // The backend always returns 200 even if email doesn't exist (security)
        // so this only fires on network/server errors
        this.isSubmitted = true;
        this.isLoading = false;
      },
    });
  }
}
