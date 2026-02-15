import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/signal-v2-logo-teal-accent.svg"
                alt="Signal"
                className="h-12 w-auto"
              />
            </Link>
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
                Start free
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
            When a deal goes silent, Signal gives you a way to find out what
            really happened. Your prospect gets a personalised link, shares
            honest feedback in 45 seconds, and you get a clear read on whether to
            re-engage, pivot, or move on.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-accent rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/25"
            >
              Start free
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary border-2 border-primary rounded-xl hover:bg-primary/5 transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-14 h-14 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://cdn-icons-png.flaticon.com/512/8635/8635046.png"
                  alt=""
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                For reps
              </h3>
              <p className="text-gray-600">
                Closure, intel, and occasionally a deal back from the dead.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://static.thenounproject.com/png/5136636-200.png"
                  alt=""
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                For leaders
              </h3>
              <p className="text-gray-600">
                See why your team&apos;s deals are really dying.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://static.thenounproject.com/png/1609047-200.png"
                  alt=""
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                For prospects
              </h3>
              <p className="text-gray-600">
                A zero-pressure way to finally tell you the truth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <div className="text-4xl font-bold text-accent mb-4 text-center">1</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Tell us about the deal
              </h3>
              <p className="text-gray-600">
                You share the context — who the prospect is, what you pitched,
                where things went quiet. Takes 2 minutes.
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-4 text-center">2</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                We generate your Signal
              </h3>
              <p className="text-gray-600">
                AI creates a personalised page for your prospect with tailored
                questions and a ready-to-send email. You review, tweak if
                needed, and send the link.
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-4 text-center">3</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Get honest answers
              </h3>
              <p className="text-gray-600">
                Your prospect shares feedback in 45 seconds. You get an instant
                summary: re-engage, pivot, or move on — with a recommended next
                step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof placeholder */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <blockquote className="text-xl text-gray-700 italic">
            &ldquo;I sent 12 Signals last quarter. 8 prospects responded. 2
            deals came back to life.&rdquo;
          </blockquote>
          <p className="mt-4 text-gray-500 text-sm">
            — Early beta user, Enterprise AE
          </p>
        </div>
      </section>

      {/* Differentiator */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-3xl sm:text-4xl font-semibold text-gray-900 leading-tight">
            It&apos;s not a survey. It&apos;s not a follow-up.
          </p>
          <p className="mt-6 text-2xl text-gray-700 font-medium">
            It&apos;s the conversation your prospect was too polite to have
            with you.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white">
            Ready to hear the truth?
          </h2>
          <p className="mt-4 text-white">
            Join sales teams who get real answers instead of radio silence.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Start free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/signal-v2-logo-teal-accent.svg" alt="Signal" className="h-6 w-auto opacity-90" />
            <span className="text-gray-500 text-sm">© Signal 2025</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-gray-500 text-sm hover:text-primary">
              Log in
            </Link>
            <Link href="/privacy" className="text-gray-500 text-sm hover:text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
