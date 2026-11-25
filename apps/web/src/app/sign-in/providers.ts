import { isFeatureEnabled } from "@/lib/features";

export const socialAuthProviders = [
  { id: "google", name: "Google", feature: "authGoogle" },
  { id: "azure", name: "Microsoft", feature: "authMicrosoft" },
  { id: "facebook", name: "Facebook", feature: "authFacebook" },
] as const;

export type SocialAuthProvider = (typeof socialAuthProviders)[number]["id"];

export function getEnabledSocialAuthProviders() {
  return socialAuthProviders.filter(({ feature }) => isFeatureEnabled(feature));
}

export function isSocialAuthProvider(value: string): value is SocialAuthProvider {
  return socialAuthProviders.some(
    (provider) => provider.id === value && isFeatureEnabled(provider.feature),
  );
}
