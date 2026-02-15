import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-primary">
                Signal
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
            </div>
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
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
