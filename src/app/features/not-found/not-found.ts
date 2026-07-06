import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * 404 page shown for any unmatched route. Replaces the previous silent
 * `redirectTo: ''` so users get clear feedback and a way back.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="container d-flex flex-column align-items-center justify-content-center text-center min-vh-100 py-5">
      <p class="display-1 fw-bold mb-0 lh-1" style="color: var(--primary-orange)">404</p>
      <h1 class="h3 fw-semibold mt-3 mb-2">Page not found</h1>
      <p class="text-muted mb-4 mx-auto" style="max-width: 32rem">
        The page you're looking for doesn't exist or may have moved. Let's get you back on track.
      </p>
      <div class="d-flex flex-column flex-sm-row gap-2 gap-sm-3">
        <a routerLink="/" class="btn btn-primary rounded-pill px-4 fw-semibold">Back to home</a>
        <a routerLink="/my-trips" class="btn btn-outline-secondary rounded-pill px-4 fw-semibold">View my trips</a>
      </div>
    </main>
  `,
})
export class NotFoundPage {}
