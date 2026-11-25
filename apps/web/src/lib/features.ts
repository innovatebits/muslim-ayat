export const featureFlags = {
  translations: enabled("TRANSLATIONS", true),
  transliteration: enabled("TRANSLITERATION", true),
  tafsir: enabled("TAFSIR", true),
  wordByWord: enabled("WORD_BY_WORD", true),
  search: enabled("SEARCH", true),
  audio: enabled("AUDIO", true),
  offline: enabled("OFFLINE", true),
  bookmarks: enabled("BOOKMARKS", true),
  notes: enabled("NOTES", true),
  readingProgress: enabled("READING_PROGRESS", true),
  readerPreferences: enabled("READER_PREFERENCES", true),
  accountProfile: enabled("ACCOUNT_PROFILE", true),
  authEmailPassword: enabled("AUTH_EMAIL_PASSWORD", true),
  authEmailOtp: enabled("AUTH_EMAIL_OTP", true),
  authMagicLink: enabled("AUTH_MAGIC_LINK", true),
  authGoogle: enabled("AUTH_GOOGLE", true),
  authMicrosoft: enabled("AUTH_MICROSOFT", true),
  authFacebook: enabled("AUTH_FACEBOOK", true),
} as const;

export type FeatureFlag = keyof typeof featureFlags;

function enabled(name: string, defaultValue: boolean) {
  const value = process.env[`NEXT_PUBLIC_FEATURE_${name}`];
  return value === undefined ? defaultValue : value.toLowerCase() !== "false";
}

export function isFeatureEnabled(feature: FeatureFlag) {
  return featureFlags[feature];
}
