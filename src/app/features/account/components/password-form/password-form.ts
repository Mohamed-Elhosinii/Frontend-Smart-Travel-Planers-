import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import { APP_ROUTES } from '../../../../core/constants/routes';

/**
 * Security tab. The backend has no authenticated "change password" endpoint —
 * password changes are only supported via the email-verified reset flow
 * (POST /Auth/forgot-password → /reset-password). This component triggers that
 * real flow instead of faking a change.
 */
@Component({
  selector: 'app-password-form',
  standalone: true,
  imports: [],
  templateUrl: './password-form.html',
  styleUrl: './password-form.css',
})
export class PasswordForm {
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(UserProfileService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly sending = signal(false);

  get email(): string {
    return this.profileService.profile().email;
  }

  sendResetCode(): void {
    const email = this.email?.trim();
    if (!email) {
      this.toast.danger('Your account email is still loading — please try again in a moment.');
      return;
    }
    if (this.sending()) return;

    this.sending.set(true);
    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.sending.set(false);
        this.toast.success(`We've emailed a reset code to ${email}.`);
        this.router.navigate([APP_ROUTES.resetPassword], { queryParams: { email } });
      },
      error: () => {
        this.sending.set(false);
        this.toast.danger('Could not start the password reset. Please try again.');
      },
    });
  }
}
