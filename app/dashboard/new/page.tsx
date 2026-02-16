import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewSignalForm from "./NewSignalForm";

export default async function NewSignalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <NewSignalForm />;
}
