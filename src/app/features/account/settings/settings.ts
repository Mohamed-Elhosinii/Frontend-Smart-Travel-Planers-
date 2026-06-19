import { Component } from '@angular/core';
import { Navbar } from '../../../layout/navbar/navbar';
import { NotificationSettings } from '../components/notification-settings/notification-settings';

/** Account settings page — currently hosts notification preferences. */
@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [Navbar, NotificationSettings],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsPage {}
