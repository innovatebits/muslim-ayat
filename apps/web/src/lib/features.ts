function enabled(value: string | undefined, defaultValue: boolean) {
  return value === undefined ? defaultValue : value.toLowerCase() !== "false";
}

export const featureFlags = {
  translations: enabled(process.env.NEXT_PUBLIC_FEATURE_TRANSLATIONS, true),
  transliteration: enabled(process.env.NEXT_PUBLIC_FEATURE_TRANSLITERATION, true),
  tafsir: enabled(process.env.NEXT_PUBLIC_FEATURE_TAFSIR, true),
  wordByWord: enabled(process.env.NEXT_PUBLIC_FEATURE_WORD_BY_WORD, true),
  search: enabled(process.env.NEXT_PUBLIC_FEATURE_SEARCH, true),
  audio: enabled(process.env.NEXT_PUBLIC_FEATURE_AUDIO, true),
  offline: enabled(process.env.NEXT_PUBLIC_FEATURE_OFFLINE, true),
  bookmarks: enabled(process.env.NEXT_PUBLIC_FEATURE_BOOKMARKS, true),
  notes: enabled(process.env.NEXT_PUBLIC_FEATURE_NOTES, true),
  readingProgress: enabled(process.env.NEXT_PUBLIC_FEATURE_READING_PROGRESS, true),
  readerPreferences: enabled(process.env.NEXT_PUBLIC_FEATURE_READER_PREFERENCES, true),
  accountProfile: enabled(process.env.NEXT_PUBLIC_FEATURE_ACCOUNT_PROFILE, true),
  authEmailPassword: enabled(process.env.NEXT_PUBLIC_FEATURE_AUTH_EMAIL_PASSWORD, true),
  authPasswordReset: enabled(process.env.NEXT_PUBLIC_FEATURE_AUTH_PASSWORD_RESET, true),
  authEmailOtp: enabled(process.env.NEXT_PUBLIC_FEATURE_AUTH_EMAIL_OTP, true),
  authMagicLink: enabled(process.env.NEXT_PUBLIC_FEATURE_AUTH_MAGIC_LINK, true),
  authGoogle: enabled(process.env.NEXT_PUBLIC_FEATURE_AUTH_GOOGLE, true),
  authMicrosoft: enabled(process.env.NEXT_PUBLIC_FEATURE_AUTH_MICROSOFT, true),
  authFacebook: enabled(process.env.NEXT_PUBLIC_FEATURE_AUTH_FACEBOOK, true),
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(feature: FeatureFlag) {
  return featureFlags[feature];
}
