import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewSignalForm from "./NewSignalForm";

export default async function NewSignalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("company_name")
    .eq("id", user.id)
    .single();

  return <NewSignalForm companyName={profile?.company_name ?? null} />;
}
