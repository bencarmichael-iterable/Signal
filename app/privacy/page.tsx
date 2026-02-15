import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Image src="/signal-v2-logo-teal-accent.svg" alt="Signal" width={160} height={40} className="h-8 w-auto" />
            </Link>
            <Link href="/" className="text-gray-600 hover:text-primary text-sm">
              ← Back
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>
        <p className="text-gray-600 mb-8">
          This page is a placeholder. A full privacy policy will be published
          here before launch.
        </p>
        <Link href="/" className="text-accent hover:underline">
          Return to home
        </Link>
      </main>
    </div>
  );
}
