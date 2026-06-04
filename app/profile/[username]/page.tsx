import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function PublicProfilePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { username } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const readClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;
  const { data: profile } = await readClient.from("profiles").select("*").or(`username.eq.${username},id.eq.${username}`).maybeSingle();
  if (!profile) notFound();

  return <ProfileView profile={profile} viewerId={user?.id ?? ""} saved={query.saved} />;
}
