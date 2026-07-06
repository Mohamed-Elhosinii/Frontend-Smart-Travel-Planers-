/** Every localStorage key used by the app — declared once. */
export const STORAGE_KEYS = {
  token: 'token',
  refreshToken: 'refreshToken',
  sessionEmail: 'stp_session_email',
  profile: 'stp_profile',
  rememberedEmail: 'stp_remembered_email',
  preferences: 'stp_preferences',
  deletedTripIds: 'deletedTripIds',
} as const;
