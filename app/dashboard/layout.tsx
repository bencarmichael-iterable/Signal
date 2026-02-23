import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import UserMenu from "./UserMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = await import("@/lib/supabase/admin").then((m) => m.createAdminClient());
  const { data: profile } = await admin
    .from("users")
    .select("full_name, photo_url, role, account_id, plan")
    .eq("id", user.id)
    .single();

  const { data: managedTeams } = await admin
    .from("teams")
    .select("id")
    .eq("manager_id", user.id);
  const isManager = profile?.role === "manager" || profile?.role === "admin" || (managedTeams && managedTeams.length > 0);

  let showLimitBanner = false;
  const userPlan = profile?.plan ?? "free";
  if (userPlan !== "premium" && userPlan !== "pro") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: userSignals } = await admin
      .from("signals")
      .select("id")
      .eq("user_id", user.id);
    const userSignalIds = new Set(userSignals?.map((s) => s.id) ?? []);
    if (userSignalIds.size > 0) {
      const { data: responses } = await admin
        .from("responses")
        .select("signal_id, completed_at")
        .not("completed_at", "is", null)
        .gte("completed_at", startOfMonth.toISOString());
      const userResponses = (responses ?? []).filter((r) => userSignalIds.has(r.signal_id));
      const sorted = userResponses.sort(
        (a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime()
      );
      showLimitBanner = sorted.length >= 4;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center">
                <Image src="/signal-v2-logo-teal-accent.svg" alt="Signal" width={160} height={40} className="h-8 w-auto" />
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-primary"
              >
                Signals
              </Link>
              <Link
                href="/dashboard/insights"
                className="text-gray-600 hover:text-primary"
              >
                Insights
              </Link>
              {isManager && (
                <Link
                  href="/dashboard/manager"
                  className="text-gray-600 hover:text-primary"
                >
                  Manager
                </Link>
              )}
              {profile?.role === "admin" && (
                <Link
                  href="/dashboard/settings"
                  className="text-gray-600 hover:text-primary"
                >
                  Settings
                </Link>
              )}
            </div>
            <UserMenu
              fullName={profile?.full_name ?? null}
              photoUrl={profile?.photo_url ?? null}
              email={user.email ?? ""}
            />
          </div>
        </div>
      </nav>
      {showLimitBanner && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm text-amber-800">
              You&apos;ve exceeded your Signal limit for this month.{" "}
              <Link href="/dashboard/settings" className="font-medium underline hover:text-amber-900">
                Upgrade to Premium
              </Link>{" "}
              for unlimited Signals.
            </p>
          </div>
        </div>
      )}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
