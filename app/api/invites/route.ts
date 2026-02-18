import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
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
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await admin
    .from("users")
    .select("id")
    .ilike("email", normalizedEmail)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "User already exists. Add them to your account via User management instead." },
      { status: 400 }
    );
  }

  const { error: inviteError } = await admin.from("invites").insert({
    account_id: profile.account_id,
    email: normalizedEmail,
    invited_by: user.id,
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectTo = `${baseUrl}/auth/callback`;

  const { data: inviteData, error: authError } = await admin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      redirectTo,
      data: { invited_to_account: profile.account_id },
    }
  );

  if (authError) {
    return NextResponse.json(
      { error: authError.message || "Failed to send invite" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: `Invite sent to ${normalizedEmail}. They'll receive an email to sign up.`,
  });
}
