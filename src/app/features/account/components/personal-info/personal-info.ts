import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../../core/models';
import { ToastService } from '../../../../core/services/toast.service';

/** Maximum avatar upload size (2 MB) before client-side rejection. */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** Editable personal-information form. Emits the saved profile to its parent. */
@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './personal-info.html',
  styleUrl: './personal-info.css',
})
export class PersonalInfo {
  private readonly toast = inject(ToastService);

  @Input({ required: true }) userProfile!: UserProfile;
  @Output() saveProfile = new EventEmitter<UserProfile>();

  onSubmit(): void {
    if (!this.userProfile.firstName.trim() || !this.userProfile.lastName.trim()) {
      this.toast.danger('First and last name are required.');
      return;
    }
    this.saveProfile.emit({ ...this.userProfile });
    this.toast.success('Personal information updated.');
  }

  onAvatarFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.danger('Please choose an image file.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      this.toast.danger('Image is too large (max 2 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        this.userProfile = { ...this.userProfile, avatarUrl: result };
        this.saveProfile.emit({ ...this.userProfile });
        this.toast.success('Profile photo updated.');
      }
    };
    reader.onerror = () => this.toast.danger('Could not read the selected image.');
    reader.readAsDataURL(file);
  }
}
