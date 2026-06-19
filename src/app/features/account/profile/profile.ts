import { Component, inject } from '@angular/core';
import { Navbar } from '../../../layout/navbar/navbar';
import { PersonalInfo } from '../components/personal-info/personal-info';
import { PasswordForm } from '../components/password-form/password-form';
import { UserProfile } from '../../../core/models';
import { UserProfileService } from '../../../core/services/user-profile.service';

/** Account page hosting the personal-info and security tabs. */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [Navbar, PersonalInfo, PasswordForm],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage {
  private readonly profileService = inject(UserProfileService);

  activeTab: 'personal' | 'security' = 'personal';

  /** Working copy handed to the editable form (keeps service state immutable). */
  editableProfile: UserProfile = { ...this.profileService.profile() };

  /** Live profile for the sidebar summary. */
  get userProfile(): UserProfile {
    return this.profileService.profile();
  }

  setActiveTab(tab: 'personal' | 'security'): void {
    this.activeTab = tab;
  }

  onProfileSaved(updated: UserProfile): void {
    this.profileService.update(updated);
    this.editableProfile = { ...updated };
  }
}
