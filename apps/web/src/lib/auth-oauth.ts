export function getOAuthCallbackUrl(appUrl: string | undefined) {
  try {
    const url = new URL(appUrl ?? "http://localhost:3000");
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
      return null;
    }

    url.pathname = "/auth/callback";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export async function exchangeOAuthCode(
  code: string | null,
  exchangeCodeForSession: (code: string) => Promise<{ error: unknown | null }>,
) {
  if (!code) return false;

  try {
    const { error } = await exchangeCodeForSession(code);
    return !error;
  } catch {
    return false;
  }
}