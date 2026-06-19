import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Change-password form with live validation.
 *
 * There is no auth backend, so this validates input and resets on success
 * without persisting — wire it to `AuthService.changePassword()` when available.
 */
@Component({
  selector: 'app-password-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './password-form.html',
  styleUrl: './password-form.css',
})
export class PasswordForm {
  private readonly toast = inject(ToastService);

  security = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  get isNewPasswordLengthValid(): boolean {
    return this.security.newPassword.length >= MIN_PASSWORD_LENGTH;
  }

  get doPasswordsMatch(): boolean {
    return (
      this.security.newPassword.length > 0 &&
      this.security.newPassword === this.security.confirmPassword
    );
  }

  get isSecurityFormValid(): boolean {
    return (
      this.security.currentPassword.length > 0 &&
      this.isNewPasswordLengthValid &&
      this.doPasswordsMatch
    );
  }

  changePassword(): void {
    if (!this.isSecurityFormValid) {
      this.toast.danger('Please fix the highlighted fields before submitting.');
      return;
    }
    this.toast.success('Password updated successfully.');
    this.security = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }
}
