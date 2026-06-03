import type { User } from "@supabase/supabase-js";

export function isAdminUser(user: User | null) {
  const adminEmail = process.env.ADMIN_EMAIL;
  return Boolean(user?.email && adminEmail && user.email === adminEmail);
}
