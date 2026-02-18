import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import NewSignalForm from "./NewSignalForm";

export default async function NewSignalPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const type = ["prospecting", "mid_deal", "deal_stalled"].includes(
    params.type ?? ""
  )
    ? params.type
    : undefined;

  let defaultLandingIntro = "";
  let defaultValueProp = "";
  const admin = createAdminClient();
  const { data: profile } = await admin.from("users").select("account_id").eq("id", user.id).single();
  if (profile?.account_id) {
    const { data: rows } = await admin
      .from("account_prompts")
      .select("prompt_key, prompt_value")
      .eq("account_id", profile.account_id)
      .eq("signal_type", "prospecting");
    for (const r of rows ?? []) {
      if (r.prompt_key === "default_landing_intro") defaultLandingIntro = r.prompt_value || "";
      if (r.prompt_key === "default_value_prop") defaultValueProp = r.prompt_value || "";
    }
  }

  return (
    <NewSignalForm
      initialSignalType={type}
      defaultLandingIntro={defaultLandingIntro}
      defaultValueProp={defaultValueProp}
    />
  );
}
