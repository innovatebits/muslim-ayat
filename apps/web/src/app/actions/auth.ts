"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getOAuthCallbackUrl } from "@/lib/auth-oauth";
import { isFeatureEnabled } from "@/lib/features";
import { isSocialAuthProvider } from "../sign-in/providers";

function value(formData: FormData, name: string) {
  const field = formData.get(name);
  return typeof field === "string" ? field.trim() : "";
}

function rawValue(formData: FormData, name: string) {
  const field = formData.get(name);
  return typeof field === "string" ? field : "";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) && email.length <= 254;
}

function getCallbackUrl() {
  const url = getOAuthCallbackUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (!url) redirect("/sign-in?error=setup");
  return url;
}

function requireAuthSetup() {
  if (!isSupabaseConfigured()) redirect("/sign-in?error=setup");
}

export async function signInWithProviderAction(formData: FormData) {
  requireAuthSetup();
  const provider = value(formData, "provider");
  if (!isSocialAuthProvider(provider)) redirect("/sign-in?error=method-disabled");

  const redirectTo = getCallbackUrl();
  let authorizationUrl: string | null = null;
  try {
    const client = await createClient();
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (!error) authorizationUrl = data.url;
  } catch {
    redirect("/sign-in?error=oauth");
  }
  if (!authorizationUrl) redirect("/sign-in?error=oauth");
  redirect(authorizationUrl);
}

export async function signInWithPasswordAction(formData: FormData) {
  requireAuthSetup();
  if (!isFeatureEnabled("authEmailPassword")) redirect("/sign-in?error=method-disabled");
  const email = value(formData, "email").toLowerCase();
  const password = rawValue(formData, "password");
  if (!validEmail(email) || !password) redirect("/sign-in?error=invalid-input");

  let failed = false;
  try {
    const client = await createClient();
    const { error } = await client.auth.signInWithPassword({ email, password });
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (failed) redirect("/sign-in?error=credentials");
  redirect("/account");
}

export async function signUpWithPasswordAction(formData: FormData) {
  requireAuthSetup();
  if (!isFeatureEnabled("authEmailPassword")) redirect("/sign-in?error=method-disabled");
  const email = value(formData, "email").toLowerCase();
  const password = rawValue(formData, "password");
  if (!validEmail(email) || password.length < 8) redirect("/sign-in?error=invalid-input");

  const emailRedirectTo = getCallbackUrl();
  let failed = false;
  let hasSession = false;
  try {
    const client = await createClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    failed = Boolean(error);
    hasSession = Boolean(data.session);
  } catch {
    failed = true;
  }
  if (failed) redirect("/sign-in?error=signup");
  redirect(hasSession ? "/account" : "/sign-in?notice=check-email");
}

export async function sendEmailOtpAction(formData: FormData) {
  requireAuthSetup();
  if (!isFeatureEnabled("authEmailOtp")) redirect("/sign-in?error=method-disabled");
  const email = value(formData, "email").toLowerCase();
  if (!validEmail(email)) redirect("/sign-in?error=invalid-input");

  const emailRedirectTo = getCallbackUrl();
  let failed = false;
  try {
    const client = await createClient();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo, shouldCreateUser: true },
    });
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (failed) redirect("/sign-in?error=email");
  redirect("/sign-in?notice=otp-sent");
}

export async function verifyEmailOtpAction(formData: FormData) {
  requireAuthSetup();
  if (!isFeatureEnabled("authEmailOtp")) redirect("/sign-in?error=method-disabled");
  const email = value(formData, "email").toLowerCase();
  const token = value(formData, "token").replace(/\s+/gu, "");
  if (!validEmail(email) || !/^\d{6,8}$/u.test(token)) redirect("/sign-in?error=invalid-input");

  let failed = false;
  try {
    const client = await createClient();
    const { error } = await client.auth.verifyOtp({ email, token, type: "email" });
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (failed) redirect("/sign-in?error=otp");
  redirect("/account");
}

export async function sendMagicLinkAction(formData: FormData) {
  requireAuthSetup();
  if (!isFeatureEnabled("authMagicLink")) redirect("/sign-in?error=method-disabled");
  const email = value(formData, "email").toLowerCase();
  if (!validEmail(email)) redirect("/sign-in?error=invalid-input");

  const emailRedirectTo = getCallbackUrl();
  let failed = false;
  try {
    const client = await createClient();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (failed) redirect("/sign-in?error=email");
  redirect("/sign-in?notice=magic-link-sent");
}

export async function sendPasswordResetAction(formData: FormData) {
  requireAuthSetup();
  if (!isFeatureEnabled("authPasswordReset") || !isFeatureEnabled("authEmailPassword")) {
    redirect("/sign-in?error=method-disabled");
  }
  const email = value(formData, "email").toLowerCase();
  if (!validEmail(email)) redirect("/sign-in?error=invalid-input");

  const resetUrl = new URL(getCallbackUrl());
  resetUrl.searchParams.set("next", "/reset-password");
  let failed = false;
  try {
    const client = await createClient();
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: resetUrl.toString() });
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (failed) redirect("/sign-in?error=email");
  redirect("/sign-in?notice=password-reset-sent");
}

export async function updatePasswordAction(formData: FormData) {
  requireAuthSetup();
  if (!isFeatureEnabled("authPasswordReset") || !isFeatureEnabled("authEmailPassword")) {
    redirect("/sign-in?error=method-disabled");
  }
  const password = rawValue(formData, "password");
  if (password.length < 8) redirect("/reset-password?error=invalid-input");

  let failed = false;
  try {
    const client = await createClient();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) redirect("/sign-in?error=auth");
    const { error } = await client.auth.updateUser({ password });
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (failed) redirect("/reset-password?error=reset");
  redirect("/account?notice=password-updated");
}

export async function signOutAction() {
  requireAuthSetup();
  const client = await createClient();
  await client.auth.signOut();
  redirect("/sign-in?notice=signed-out");
}
