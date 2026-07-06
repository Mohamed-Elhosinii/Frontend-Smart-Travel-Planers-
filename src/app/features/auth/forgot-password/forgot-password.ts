import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EMAIL_PATTERN } from '../../../core/validators/email.validator';
import { APP_ROUTES } from '../../../core/constants/routes';
import { Logo } from '../../../shared/logo/logo';

/** Password-reset request page. Hits POST /api/Auth/forgot-password. */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, Logo],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

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
        this.isLoading = false;
        // Navigate to reset password page to enter OTP
        this.router.navigate([APP_ROUTES.resetPassword], { queryParams: { email } });
      },
      error: () => {
        this.isLoading = false;
        // Even on error, navigate to avoid leaking email existence (standard security practice)
        this.router.navigate([APP_ROUTES.resetPassword], { queryParams: { email } });
      },
    });
  }
}
