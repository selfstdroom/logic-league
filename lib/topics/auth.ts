import type { User } from "@supabase/supabase-js";

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function isAdminUser(user: User | null) {
  const userEmail = normalizeEmail(user?.email);
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  return Boolean(userEmail && adminEmail && userEmail === adminEmail);
}
