/** The signed-in user's editable profile. */
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  /** Avatar image URL or base64 data URL. */
  avatarUrl: string;
}
