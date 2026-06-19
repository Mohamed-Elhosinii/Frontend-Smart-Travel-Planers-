# Account (Profile & Settings)

Source: `src/app/features/account/` (`ProfilePage`, `SettingsPage`, and child
components `personal-info`, `password-form`, `notification-settings`)

## Purpose

Lets the user manage their profile (personal info + avatar), change their
password, and configure notification preferences. Profile and preference edits
persist locally so they survive a refresh. These pages are publicly browsable —
they are not behind a route guard.

## Routes & screens

| Route | Component | Guard | Notes |
| ----- | --------- | ----- | ----- |
| `/profile` | `ProfilePage` | Public | Tabs: personal info / security |
| `/settings` | `SettingsPage` | Public | Notification preferences |
| `/portfolio` | → redirects to `/profile` | — | `pathMatch: 'full'` |

## Workflow

**Profile.** `ProfilePage` has two tabs. The **personal** tab hosts
`PersonalInfo` (edit name, email, phone, country, avatar). Saving emits the
updated profile up to `ProfilePage`, which persists it via `UserProfileService`;
the sidebar summary reflects the live profile. The **security** tab hosts
`PasswordForm`.

**Password.** `PasswordForm` validates current/new/confirm fields live and, on a
valid submit, shows a success toast and resets — it does not persist (mock).

**Settings.** `SettingsPage` hosts `NotificationSettings`, which edits a local
copy of preferences and persists them via `PreferencesService` on save.

All user feedback is delivered through the global `ToastService`.

## Dependencies

- **Services:** `UserProfileService` (profile persistence), `PreferencesService`
  (notification persistence), `ToastService` (feedback) — all signal-based,
  `providedIn: 'root'`, backed by `localStorage`.
- **Components:** `Navbar`; children `PersonalInfo`, `PasswordForm`,
  `NotificationSettings`.
- **Models:** `UserProfile`, `NotificationPreferences`.
- **Angular:** `FormsModule`, `@Input`/`@Output` for child↔parent data flow.

## Business logic

**`ProfilePage`** — `activeTab: 'personal' | 'security'`; keeps an
`editableProfile` working copy (so service state stays immutable);
`onProfileSaved(updated)` calls `profileService.update(updated)` and refreshes
the working copy.

**`PersonalInfo`** — `@Input({ required: true }) userProfile`, `@Output()
saveProfile`. `onSubmit()` requires non-empty first/last name then emits.
`onAvatarFileChange(event)` validates the file is an image and ≤ 2 MB
(`MAX_AVATAR_BYTES`), reads it as a base64 data URL via `FileReader`, and emits
the updated profile.

**`PasswordForm`** — getters `isNewPasswordLengthValid` (≥ 8),
`doPasswordsMatch`, and `isSecurityFormValid`. `changePassword()` toasts and
resets the form on success; it does **not** call any backend (a comment points to
a future `AuthService.changePassword()`).

**`NotificationSettings`** — seeds a local `preferences` copy from
`PreferencesService` (`OnInit`); `savePreferences()` calls
`preferencesService.update(...)` and toasts.

## Notes / future work

- `PasswordForm` is mock — wire it to a real change-password endpoint.
- Avatars are stored inline as base64 data URLs in `localStorage`; a real build
  would upload to storage and persist a URL.
- The default profile/preferences live in the respective services.
