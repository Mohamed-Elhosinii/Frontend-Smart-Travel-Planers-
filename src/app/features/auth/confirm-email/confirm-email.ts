import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Email OTP confirmation page.
 */
@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.css',
})
export class ConfirmEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  userId = '';
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  errorMessage = '';
  resendMessage = '';

  readonly form = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParams['userId'] || '';
    if (!this.userId) {
      this.status = 'error';
      this.errorMessage = 'Invalid request. Missing user ID.';
    }
  }

  submit(): void {
    if (this.form.invalid || !this.userId) return;

    this.status = 'loading';
    this.errorMessage = '';
    
    this.auth.confirmEmail({ userId: this.userId, token: this.form.getRawValue().otp }).subscribe({
      next: () => {
        this.status = 'success';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.status = 'error';
        let errorData = err?.error;
        if (typeof errorData === 'string') {
          try {
            errorData = JSON.parse(errorData);
          } catch {}
        }
        if (errorData?.errors && errorData.errors.length > 0) {
          this.errorMessage = errorData.errors.join(' ');
        } else {
          this.errorMessage = errorData?.message || 'Invalid code or it may have expired.';
        }
      }
    });
  }

  resend(): void {
    if (!this.userId) return;
    this.resendMessage = 'Sending...';
    this.auth.resendConfirmEmail(this.userId).subscribe({
      next: () => {
        this.resendMessage = 'A new code has been sent to your email!';
        setTimeout(() => this.resendMessage = '', 5000);
      },
      error: () => {
        this.resendMessage = 'Failed to resend code. Please try again later.';
        setTimeout(() => this.resendMessage = '', 5000);
      }
    });
  }
}
