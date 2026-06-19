import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotificationPreferences } from '../../../../core/models';
import { PreferencesService } from '../../../../core/services/preferences.service';
import { ToastService } from '../../../../core/services/toast.service';

/** Notification-preferences form, persisted via {@link PreferencesService}. */
@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './notification-settings.html',
  styleUrl: './notification-settings.css',
})
export class NotificationSettings implements OnInit {
  private readonly preferencesService = inject(PreferencesService);
  private readonly toast = inject(ToastService);

  /** Local editable copy, seeded from the persisted preferences. */
  preferences: NotificationPreferences = { ...this.preferencesService.preferences() };

  ngOnInit(): void {
    this.preferences = { ...this.preferencesService.preferences() };
  }

  savePreferences(): void {
    this.preferencesService.update(this.preferences);
    this.toast.success('Notification preferences updated.');
  }
}
