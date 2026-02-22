import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const accountId = session.metadata?.account_id;
    if (!accountId) {
      console.error("No account_id in session metadata");
      return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();
    await admin
      .from("accounts")
      .update({
        plan: "premium",
        stripe_customer_id: session.customer as string | null,
        stripe_subscription_id: session.subscription as string | null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const accountId = subscription.metadata?.account_id;
    if (!accountId) {
      const admin = createAdminClient();
      const { data: acc } = await admin
        .from("accounts")
        .select("id")
        .eq("stripe_subscription_id", subscription.id)
        .single();
      if (acc) {
        await admin
          .from("accounts")
          .update({
            plan: "free",
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", acc.id);
      }
    } else {
      const admin = createAdminClient();
      await admin
        .from("accounts")
        .update({
          plan: "free",
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accountId);
    }
  }

  return NextResponse.json({ received: true });
}
