import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Email confirmation landing page.
 *
 * The user arrives here from a verification email link containing `userId` and
 * `token` as query parameters. The component immediately calls the backend
 * GET /api/Auth/confirm-email endpoint and displays the result.
 */
@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.css',
})
export class ConfirmEmailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  status: 'loading' | 'success' | 'error' = 'loading';
  errorMessage = '';

  ngOnInit(): void {
    const userId = this.route.snapshot.queryParams['userId'] || '';
    const token = this.route.snapshot.queryParams['token'] || '';

    if (!userId || !token) {
      this.status = 'error';
      this.errorMessage = 'Invalid confirmation link. Missing required parameters.';
      return;
    }

    this.auth.confirmEmail({ userId, token }).subscribe({
      next: () => {
        this.status = 'success';
        setTimeout(() => this.router.navigate(['/login']), 4000);
      },
      error: (err) => {
        this.status = 'error';
        this.errorMessage = err?.error?.message || 'Email confirmation failed. The link may have expired.';
      },
    });
  }
}
