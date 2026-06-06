import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Profile } from "@/types/logic-league";

function getMetadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function buildFallbackUsername(user: User) {
  const metadataUsername = normalizeUsername(getMetadataString(user, "username"));
  const emailPrefix = normalizeUsername(user.email?.split("@")[0] ?? "");
  const base = metadataUsername || emailPrefix || "user";
  return `${base}-${user.id.slice(0, 8)}`.slice(0, 40);
}

function buildDisplayName(user: User, username: string) {
  return getMetadataString(user, "display_name") || getMetadataString(user, "name") || username;
}

export async function getOrCreateOwnProfile(supabase: SupabaseClient<Database>, user: User): Promise<Profile> {
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to fetch profile: ${selectError.message}`);
  }

  if (existingProfile) return existingProfile;

  const username = buildFallbackUsername(user);
  const now = new Date().toISOString();
  const { data: createdProfile, error: createError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      username,
      display_name: buildDisplayName(user, username),
      bio: null,
      predicted_deviation: null,
      qualified: false,
      rating: 0,
      rank: "Visitor",
      archetype: null,
      x_url: null,
      youtube_url: null,
      github_url: null,
      display_deviation_type: "certification",
      display_title: null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (createError) {
    throw new Error(`Failed to create profile: ${createError.message}`);
  }

  return createdProfile;
}
