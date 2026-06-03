import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileIndexPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/home");

  const query = await searchParams;
  return <ProfileView profile={profile} viewerId={user.id} saved={query.saved} />;
}
