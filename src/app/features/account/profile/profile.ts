import { Component, inject, OnInit, effect } from '@angular/core';
import { Navbar } from '../../../layout/navbar/navbar';
import { PersonalInfo } from '../components/personal-info/personal-info';
import { PasswordForm } from '../components/password-form/password-form';
import { UserProfile } from '../../../core/models';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { ToastService } from '../../../core/services/toast.service';

/** Account page hosting the personal-info and security tabs. */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [Navbar, PersonalInfo, PasswordForm],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage implements OnInit {
  private readonly profileService = inject(UserProfileService);
  private readonly toast = inject(ToastService);

  activeTab: 'personal' | 'security' = 'personal';

  readonly loading = this.profileService.loading;

  /** Working copy handed to the editable form (keeps service state immutable). */
  editableProfile: UserProfile = { ...this.profileService.profile() };

  constructor() {
    effect(() => {
      // Sync working copy when API data loads
      this.editableProfile = { ...this.profileService.profile() };
    });
  }

  ngOnInit(): void {
    this.profileService.loadFromApi();
  }

  /** Live profile for the sidebar summary. */
  get userProfile(): UserProfile {
    return this.profileService.profile();
  }

  get userInitials(): string {
    const f = this.userProfile.firstName?.charAt(0) || '';
    const l = this.userProfile.lastName?.charAt(0) || '';
    const initials = (f + l).toUpperCase();
    return initials || '?';
  }

  setActiveTab(tab: 'personal' | 'security'): void {
    this.activeTab = tab;
  }

  onProfileSaved(updated: UserProfile): void {
    this.editableProfile = { ...updated };
    this.profileService.update(updated).subscribe((ok) => {
      if (ok) {
        this.toast.success('Personal information updated.');
      } else {
        this.toast.danger('Could not save your changes. Please try again.');
        // Optimistic change was rolled back in the service; resync the form.
        this.editableProfile = { ...this.profileService.profile() };
      }
    });
  }
}
