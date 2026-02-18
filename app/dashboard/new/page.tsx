import { createClient } from "@/lib/supabase/server";
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

  return <NewSignalForm initialSignalType={type} />;
}
