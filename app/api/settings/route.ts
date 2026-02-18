import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!profile.account_id) {
    return NextResponse.json({
      account: null,
      prompts: {},
    });
  }

  const { data: account } = await admin
    .from("accounts")
    .select("id, name, product_description, differentiators")
    .eq("id", profile.account_id)
    .single();

  const { data: prompts } = await admin
    .from("account_prompts")
    .select("signal_type, prompt_key, prompt_value")
    .eq("account_id", profile.account_id);

  const promptsByType: Record<string, Record<string, string>> = {};
  for (const p of prompts || []) {
    if (!promptsByType[p.signal_type]) promptsByType[p.signal_type] = {};
    promptsByType[p.signal_type][p.prompt_key] = p.prompt_value;
  }

  return NextResponse.json({
    account,
    prompts: promptsByType,
  });
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("account_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { account, prompts } = body;

  if (account && profile.account_id) {
    await admin
      .from("accounts")
      .update({
        name: account.name,
        product_description: account.product_description ?? null,
        differentiators: account.differentiators ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.account_id);
  }

  if (prompts && typeof prompts === "object" && profile.account_id) {
    for (const [signalType, keys] of Object.entries(prompts)) {
      if (typeof keys !== "object") continue;
      for (const [key, value] of Object.entries(keys as Record<string, string>)) {
        if (typeof value !== "string") continue;
        await admin.from("account_prompts").upsert(
          {
            account_id: profile.account_id,
            signal_type: signalType,
            prompt_key: key,
            prompt_value: value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "account_id,signal_type,prompt_key" }
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
