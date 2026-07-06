import { Component, OnDestroy, OnInit, inject, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { extractErrorMessage } from '../../../core/utils/http-error';
import { APP_ROUTES } from '../../../core/constants/routes';
import { Logo } from '../../../shared/logo/logo';

/** Email OTP confirmation page. */
@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [RouterLink, FormsModule, Logo],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.css',
})
export class ConfirmEmailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  userId = '';
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  errorMessage = '';
  resendMessage = '';
  isResending = false;
  resendCooldown = 0;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  otpDigits: string[] = ['', '', '', '', '', ''];
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParams['userId'] || '';
    if (!this.userId) {
      this.status = 'error';
      this.errorMessage = 'Invalid request. Missing user ID.';
    }
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

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

  submit(): void {
    if (!this.userId || this.status === 'loading') return;

    const token = this.otpDigits.join('');
    if (token.length !== 6) {
      this.status = 'error';
      this.errorMessage = 'Please enter the complete 6-digit code.';
      return;
    }

    this.status = 'loading';
    this.errorMessage = '';

    this.auth.confirmEmail({ userId: this.userId, token }).subscribe({
      next: () => {
        this.status = 'success';
        setTimeout(() => this.router.navigate([APP_ROUTES.login]), 2000);
      },
      error: (err) => {
        this.status = 'error';
        this.errorMessage = extractErrorMessage(err, 'Invalid code — it may have expired.');
      },
    });
  }

  resend(): void {
    if (!this.userId || this.isResending || this.resendCooldown > 0) return;

    this.isResending = true;
    this.resendMessage = 'Sending…';
    this.auth.resendConfirmEmail(this.userId).subscribe({
      next: () => {
        this.isResending = false;
        this.resendMessage = 'A new code has been sent to your email.';
        this.startCooldown(60);
        setTimeout(() => (this.resendMessage = ''), 5000);
      },
      error: (err) => {
        this.isResending = false;
        this.resendMessage = extractErrorMessage(err, 'Failed to resend the code. Please try again later.');
        setTimeout(() => (this.resendMessage = ''), 5000);
      },
    });
  }

  /** Prevents resend-spam: disables the button for `seconds`. */
  private startCooldown(seconds: number): void {
    this.resendCooldown = seconds;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown -= 1;
      if (this.resendCooldown <= 0 && this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }, 1000);
  }
}
