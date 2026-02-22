import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

export async function POST() {
  try {
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
      return NextResponse.json(
        { error: "Only account admins can upgrade" },
        { status: 403 }
      );
    }

    if (!profile.account_id) {
      return NextResponse.json(
        { error: "No account found" },
        { status: 400 }
      );
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Billing is not configured. Contact support." },
        { status: 503 }
      );
    }

    const { data: account } = await admin
      .from("accounts")
      .select("id, plan, stripe_customer_id")
      .eq("id", profile.account_id)
      .single();

    if (account?.plan === "premium") {
      return NextResponse.json(
        { error: "Account is already on Premium" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://signal-project.netlify.app";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/settings?upgraded=1`,
      cancel_url: `${baseUrl}/dashboard/settings?canceled=1`,
      metadata: {
        account_id: profile.account_id,
      },
      subscription_data: {
        metadata: {
          account_id: profile.account_id,
        },
      },
    };

    if (account?.stripe_customer_id) {
      sessionParams.customer = account.stripe_customer_id;
    } else {
      sessionParams.customer_email = user.email ?? undefined;
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Create checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
