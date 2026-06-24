import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

const REMEMBERED_EMAIL_KEY = 'stp_remembered_email';

/** Sign-in page. Authenticates via {@link AuthService} and honours `returnUrl`. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
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
  returnUrl = '/my-trips';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/my-trips';
    const saved = this.safeGet(REMEMBERED_EMAIL_KEY);
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
          this.errorMessage = 'We could not sign you in. Please check your details.';
          return;
        }

        if (this.rememberMe) {
          this.safeSet(REMEMBERED_EMAIL_KEY, this.email);
        } else {
          this.safeRemove(REMEMBERED_EMAIL_KEY);
        }

        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        let errorData = err.error;
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
          this.errorMessage = errorData?.message || `Connection/Server Error (${err.status}: ${err.statusText || 'Server unreachable'}).`;
        }
      }
    });
  }

  private safeGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  private safeSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* no-op */
    }
  }
  private safeRemove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* no-op */
    }
  }
}
