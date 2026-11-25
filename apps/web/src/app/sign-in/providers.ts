export const socialAuthProviders = [
  { id: "google", name: "Google" },
  { id: "azure", name: "Microsoft" },
  { id: "facebook", name: "Facebook" },
] as const;

export type SocialAuthProvider = (typeof socialAuthProviders)[number]["id"];

export function isSocialAuthProvider(value: string): value is SocialAuthProvider {
  return socialAuthProviders.some((provider) => provider.id === value);
}