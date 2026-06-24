import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, ResetPasswordDto } from '../../../core/services/auth.service';

/** Password reset page. The user arrives here from the email link with userId & token query params. */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  email = '';
  token = ''; // this is now the OTP
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  isSuccess = false;
  isLoading = false;

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';

    if (!this.email) {
      this.errorMessage = 'Invalid password reset request. Please start over.';
    }
  }

  submit(): void {
    this.errorMessage = '';

    if (!this.token || this.token.length !== 6) {
      this.errorMessage = 'Please enter the 6-digit code sent to your email.';
      return;
    }
    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (!this.email) {
      this.errorMessage = 'Invalid reset request. Please start over.';
      return;
    }

    this.isLoading = true;

    const dto: ResetPasswordDto = {
      email: this.email,
      token: this.token,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword,
    };

    this.auth.resetPassword(dto).subscribe({
      next: () => {
        this.isSuccess = true;
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.isLoading = false;
        let errorData = err?.error;
        if (typeof errorData === 'string') {
          try {
            errorData = JSON.parse(errorData);
          } catch {
            // Ignore parse failure
          }
        }
        if (errorData?.errors && errorData.errors.length > 0) {
          this.errorMessage = errorData.errors.join(' ');
        } else {
          this.errorMessage = errorData?.message || 'Password reset failed. The link may have expired.';
        }
      },
    });
  }
}
