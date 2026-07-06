import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { extractErrorMessage } from '../../../core/utils/http-error';
import { STORAGE_KEYS } from '../../../core/constants/storage';
import { APP_ROUTES } from '../../../core/constants/routes';
import { MESSAGES } from '../../../core/constants/messages';
import { storage } from '../../../core/utils/storage';
import { Logo } from '../../../shared/logo/logo';

/** Sign-in page. Authenticates via {@link AuthService} and honours `returnUrl`. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, Logo],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  email = '';
  password = '';
  rememberMe = false;
  errorMessage = '';
  isLoading = false;
  returnUrl: string = APP_ROUTES.myTrips;
  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  loginWithGoogle(): void {
    this.auth.initiateGoogleLogin();
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || APP_ROUTES.myTrips;

    // Surface a failed Google OAuth round-trip (backend redirects here with ?error=).
    if (this.route.snapshot.queryParams['error'] === 'google_auth_failed') {
      this.errorMessage = 'Google sign-in failed. Please try again or use your email and password.';
    }

    const saved = storage.get(STORAGE_KEYS.rememberedEmail);
    if (saved) {
      this.email = saved;
      this.rememberMe = true;
    }
  }

  login(): void {
    this.errorMessage = '';
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.isLoading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (!success) {
          this.errorMessage = MESSAGES.loginFailed;
          return;
        }

        if (this.rememberMe) {
          storage.set(STORAGE_KEYS.rememberedEmail, this.email);
        } else {
          storage.remove(STORAGE_KEYS.rememberedEmail);
        }

        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = extractErrorMessage(err, MESSAGES.loginFailed);
      }
    });
  }
}
