import { redirect } from "next/navigation";
import { CollectionRoom } from "@/components/profile/CollectionRoom";
import { getOrCreateOwnProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OwnCollectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOrCreateOwnProfile(supabase, user);
  return <CollectionRoom profile={profile} viewerId={user.id} />;
}
