import { Component, OnInit, inject, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, ResetPasswordDto } from '../../../core/services/auth.service';
import { PASSWORD_RULE_HINT } from '../../../core/validators/password.validator';
import { extractErrorMessage } from '../../../core/utils/http-error';
import { APP_ROUTES } from '../../../core/constants/routes';
import { Logo } from '../../../shared/logo/logo';

/** Password reset page. The user arrives here from forgot-password with the email query param. */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, Logo],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  email = '';
  token = ''; // the 6-digit OTP
  otpDigits: string[] = ['', '', '', '', '', ''];
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  isSuccess = false;
  isLoading = false;
  showNewPassword = false;
  showConfirmPassword = false;

  /** Backend password policy, shown under the field. */
  readonly passwordHint = PASSWORD_RULE_HINT;

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  onOtpInput(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    if (key === 'ArrowLeft' && index > 0) {
      this.otpInputs.get(index - 1)?.nativeElement.focus();
      return;
    }
    if (key === 'ArrowRight' && index < 5) {
      this.otpInputs.get(index + 1)?.nativeElement.focus();
      return;
    }

    if (key === 'Backspace') {
      if (!input.value && index > 0) {
        this.otpDigits[index - 1] = '';
        this.otpInputs.get(index - 1)?.nativeElement.focus();
      }
      return;
    }

    if (/^[0-9]$/.test(key) && index < 5) {
      setTimeout(() => {
        this.otpInputs.get(index + 1)?.nativeElement.focus();
      }, 10);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');
    if (!pastedData) return;

    const digits = pastedData.replace(/[^0-9]/g, '').split('');
    for (let i = 0; i < 6; i++) {
      if (digits[i]) {
        this.otpDigits[i] = digits[i];
      }
    }

    const nextIndex = Math.min(digits.length, 5);
    this.otpInputs.get(nextIndex)?.nativeElement.focus();
  }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';
    if (!this.email) {
      this.errorMessage = 'Invalid password reset request. Please start over.';
    }
  }

  /** Mirrors the backend ResetPasswordDtoValidator complexity rules. */
  private isPasswordStrong(pw: string): boolean {
    return (
      pw.length >= 6 &&
      /[A-Z]/.test(pw) &&
      /[a-z]/.test(pw) &&
      /[0-9]/.test(pw) &&
      /[^a-zA-Z0-9]/.test(pw)
    );
  }

  submit(): void {
    if (this.isLoading) return; // guard against duplicate submissions
    this.errorMessage = '';
    this.token = this.otpDigits.join('');

    if (!this.email) {
      this.errorMessage = 'Invalid reset request. Please start over.';
      return;
    }
    if (!this.token || this.token.length !== 6) {
      this.errorMessage = 'Please enter the 6-digit code sent to your email.';
      return;
    }
    if (!this.isPasswordStrong(this.newPassword)) {
      this.errorMessage = this.passwordHint;
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
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
        setTimeout(() => this.router.navigate([APP_ROUTES.login]), 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = extractErrorMessage(err, 'Password reset failed. The code may have expired.');
      },
    });
  }
}
