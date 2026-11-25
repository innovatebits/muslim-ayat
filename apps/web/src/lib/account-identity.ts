export function getAccountIdentityLabel(email: string | null | undefined) {
  return email?.trim() || "a provider account (email not shared)";
}