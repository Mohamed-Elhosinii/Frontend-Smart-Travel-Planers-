import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../../core/models';

/** Editable personal-information form. Emits the saved profile to its parent,
 *  which persists it and reports success/error. */
@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './personal-info.html',
  styleUrl: './personal-info.css',
})
export class PersonalInfo {
  @Input({ required: true }) userProfile!: UserProfile;
  @Output() saveProfile = new EventEmitter<UserProfile>();

  /** Set once the user attempts to submit, to reveal inline validation. */
  submitted = false;

  get firstNameInvalid(): boolean {
    return !this.userProfile.firstName?.trim();
  }
  get lastNameInvalid(): boolean {
    return !this.userProfile.lastName?.trim();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.firstNameInvalid || this.lastNameInvalid) return;
    this.saveProfile.emit({ ...this.userProfile });
  }
}
