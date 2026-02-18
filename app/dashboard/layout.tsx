import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, photo_url, role")
    .eq("id", user.id)
    .single();

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
                href="/dashboard/new"
                className="text-gray-600 hover:text-primary"
              >
                New Signal
              </Link>
              <Link
                href="/dashboard/account"
                className="text-gray-600 hover:text-primary"
              >
                Account
              </Link>
              {profile?.role === "admin" && (
                <Link
                  href="/dashboard/settings"
                  className="text-gray-600 hover:text-primary"
                >
                  Settings
                </Link>
              )}
              <Link
                href="/dashboard/insights"
                className="text-gray-600 hover:text-primary"
              >
                Insights
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {profile?.photo_url ? (
                <Link href="/dashboard/account" className="flex items-center">
                  <img
                    src={profile.photo_url}
                    alt={profile.full_name || "Profile"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </Link>
              ) : (
                <Link
                  href="/dashboard/account"
                  className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium"
                  title="Add profile photo"
                >
                  {(profile?.full_name || user.email)?.[0]?.toUpperCase() ?? "?"}
                </Link>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-gray-600 hover:text-primary text-sm"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
