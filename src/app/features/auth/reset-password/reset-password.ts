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

  userId = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  isSuccess = false;
  isLoading = false;

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParams['userId'] || '';
    this.token = this.route.snapshot.queryParams['token'] || '';

    if (!this.userId || !this.token) {
      this.errorMessage = 'Invalid or expired password reset link. Please request a new one.';
    }
  }

  submit(): void {
    this.errorMessage = '';

    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (!this.userId || !this.token) {
      this.errorMessage = 'Invalid reset link. Please request a new one.';
      return;
    }

    this.isLoading = true;

    const dto: ResetPasswordDto = {
      userId: this.userId,
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
        this.errorMessage = err?.error?.message || 'Password reset failed. The link may have expired.';
      },
    });
  }
}
