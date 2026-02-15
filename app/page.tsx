import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-xl font-bold text-primary">Signal</span>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-primary transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
            Know why they went quiet.
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            When a prospect goes dark, stop sending desperate follow-ups. Signal
            generates a personalised micro-page — 45 seconds of honest feedback
            that tells you whether to re-engage, pivot, or move on.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/25"
            >
              Start free — 3 Signals/month
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary border-2 border-primary rounded-xl hover:bg-primary/5 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                For reps
              </h3>
              <p className="text-gray-600">
                Closure, intel, and occasionally a deal back from the dead.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                For leaders
              </h3>
              <p className="text-gray-600">
                Pattern data on why pipeline is really stalling.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                For prospects
              </h3>
              <p className="text-gray-600">
                A graceful, zero-pressure way to tell you the truth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiator */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-2xl font-medium text-gray-800">
            It&apos;s not a survey. It&apos;s not a follow-up.
          </p>
          <p className="mt-4 text-xl text-gray-600">
            It&apos;s the conversation the prospect was too polite to have with
            you.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white">
            Ready to stop guessing?
          </h2>
          <p className="mt-4 text-primary-100">
            Join sales teams who get real answers instead of radio silence.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <span className="text-gray-500 text-sm">© Signal</span>
          <Link href="/login" className="text-gray-500 text-sm hover:text-primary">
            Log in
          </Link>
        </div>
      </footer>
    </div>
  );
}
