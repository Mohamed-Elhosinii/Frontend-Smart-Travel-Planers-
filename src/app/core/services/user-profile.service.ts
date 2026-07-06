import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { UserProfile } from '../models';
import { AuthService } from './auth.service';

const DEFAULT_PROFILE: UserProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  currentPlan: ''
};

/**
 * Owns the signed-in user's profile. Interacts with AuthService to fetch and update.
 */
@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly auth = inject(AuthService);
  private readonly _profile = signal<UserProfile>(DEFAULT_PROFILE);
  private readonly _loading = signal<boolean>(false);

  /** The current profile (read-only signal). */
  readonly profile = this._profile.asReadonly();
  /** True while the profile is being fetched from the API. */
  readonly loading = this._loading.asReadonly();

  loadFromApi(): void {
    this._loading.set(true);
    this.auth.getCurrentUser().subscribe({
      next: (dto) => {
        if (dto) {
          this._profile.set({
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phoneNumber || '',
            country: dto.country || '',
            currentPlan: dto.currentPlan,
            emailConfirmed: dto.emailConfirmed
          });
        }
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  /**
   * Persist a profile update. Applies the change optimistically and returns the
   * backend result (`true` on success) so the caller can confirm or resync.
   */
  update(profile: UserProfile): Observable<boolean> {
    const previous = this._profile();
    const next = { ...previous, ...profile };
    this._profile.set(next);

    return this.auth.updateProfile({
      firstName: next.firstName,
      lastName: next.lastName,
      phoneNumber: next.phone,
      country: next.country,
    }).pipe(
      tap((ok) => {
        // Roll back the optimistic change if the backend rejected it.
        if (!ok) this._profile.set(previous);
      }),
    );
  }
}
