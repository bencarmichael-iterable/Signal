"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type Question = {
  question_text: string;
  options: string[];
  multi_select?: boolean;
};

type Props = {
  signalId: string;
  slug?: string;
  prospectName: string;
  prospectCompany: string;
  prospectWebsiteUrl: string | null;
  prospectLogoUrl: string | null;
  signalType?: string;
  introParagraph: string;
  dealSummary: string;
  landingH1?: string | null;
  valuePropBullets?: string[] | null;
  initialQuestions: Question[];
  openFieldPrompt: string;
  repName: string;
  repCompany: string;
  repPhotoUrl: string | null;
  repCompanyLogoUrl: string | null;
  repEmail: string | null;
  repLinkedinUrl?: string | null;
  dynamic?: boolean;
};

export default function SignalForm({
  signalId,
  slug,
  prospectName,
  prospectCompany,
  prospectWebsiteUrl,
  prospectLogoUrl,
  signalType = "deal_stalled",
  introParagraph,
  dealSummary,
  landingH1 = null,
  valuePropBullets = null,
  initialQuestions,
  openFieldPrompt,
  repName,
  repCompany,
  repPhotoUrl,
  repCompanyLogoUrl,
  repEmail,
  repLinkedinUrl = null,
  dynamic = false,
}: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [multiSelectSelections, setMultiSelectSelections] = useState<Record<number, Set<string>>>({});
  const [openText, setOpenText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingNext, setFetchingNext] = useState(false);
  const [showOpenField, setShowOpenField] = useState(false);
  const [finalOpenFieldPrompt, setFinalOpenFieldPrompt] = useState<string | null>(null);
  const [otherText, setOtherText] = useState<Record<number, string>>({});
  const [otherSelectedForStep, setOtherSelectedForStep] = useState<number | null>(null);
  const [showFinalNote, setShowFinalNote] = useState(false);
  const [finalNoteText, setFinalNoteText] = useState("");
  const hasLandingContent = landingH1 || (valuePropBullets && valuePropBullets.length > 0) || dealSummary;
  const [showQuestions, setShowQuestions] = useState(!hasLandingContent);
  const questionsRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[step];
  const isLastQuestion = step === questions.length - 1;
  // When dynamic, we don't know total questions - use step-based progress (no "X of Y")
  const progress = dynamic
    ? Math.min(85, (step + 1) * 25)
    : ((step + 1) / Math.max(questions.length, 1)) * 100;

  const interpolateName = (text: string) => {
    if (!text) return text;
    const hasPlaceholder = /\{\{firstName\}\}/i.test(text);
    const withName = text.replace(/\{\{firstName\}\}/gi, prospectName);
    // Fallback for older content without {{firstName}}: prepend name
    if (prospectName && !hasPlaceholder && !withName.toLowerCase().startsWith(prospectName.toLowerCase())) {
      return `${prospectName}, ${withName}`;
    }
    return withName;
  };

  useEffect(() => {
    fetch("/api/signals/track-open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalId }),
    }).catch(() => {});
  }, [signalId]);

  function handleMultiSelectContinue() {
    const selected = multiSelectSelections[step];
    if (!selected?.size) return;
    let parts = [...selected];
    if (parts.includes("Other") && otherText[step]?.trim()) {
      parts = parts.filter((p) => p !== "Other");
      parts.push(`Other: ${otherText[step].trim()}`);
    }
    const answer = parts.join(", ");
    const newAnswers = { ...answers, [step]: answer };
    setAnswers(newAnswers);
    void advanceAfterAnswer(newAnswers, answer);
  }

  function handleOptionSelect(option: string) {
    const isMulti = currentQuestion?.multi_select;
    if (option === "Other") {
      setOtherSelectedForStep(step);
      return;
    }
    if (isMulti) {
      const prev = multiSelectSelections[step] ?? new Set<string>();
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      setMultiSelectSelections({ ...multiSelectSelections, [step]: next });
      return;
    }

    const newAnswers = { ...answers, [step]: option };
    setAnswers(newAnswers);
    void advanceAfterAnswer(newAnswers, option);
  }

  function handleOtherSubmit() {
    const text = otherText[step]?.trim() || "";
    const answer = text ? `Other: ${text}` : "Other";
    const newAnswers = { ...answers, [step]: answer };
    setAnswers(newAnswers);
    setOtherSelectedForStep(null);
    setOtherText((prev) => ({ ...prev, [step]: "" }));
    void advanceAfterAnswer(newAnswers, answer);
  }

  async function advanceAfterAnswer(newAnswers: Record<number, string>, answer: string) {
    if (dynamic && slug) {
      setFetchingNext(true);
      const answersArray = questions.slice(0, step + 1).map((q, i) => ({
        question: q.question_text,
        answer: i === step ? answer : (newAnswers[i] ?? ""),
      }));

      try {
        const res = await fetch("/api/signals/next-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, answers: answersArray }),
        });
        const data = await res.json();

        if (data.next_question && !data.is_complete) {
          setQuestions((prev) => [...prev, data.next_question]);
          setStep(step + 1);
        } else {
          if (data.open_field_prompt) setFinalOpenFieldPrompt(data.open_field_prompt);
          setShowOpenField(true);
        }
      } catch {
        setShowOpenField(true);
      } finally {
        setFetchingNext(false);
      }
    } else if (isLastQuestion) {
      setShowOpenField(true);
    } else {
      setStep(step + 1);
    }
  }

  async function handleSubmit() {
    setLoading(true);

    const allAnswers = questions.map((q, i) => ({
      question: q.question_text,
      answer: answers[i] ?? "",
    }));
    if (openText.trim()) {
      allAnswers.push({
        question: finalOpenFieldPrompt ?? openFieldPrompt,
        answer: openText.trim(),
      });
    }

    const res = await fetch("/api/signals/submit-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signalId,
        answers: allAnswers,
        answersObj: { ...answers, open: openText },
      }),
    });

    if (res.ok) {
      setSubmitted(true);
    }
    setLoading(false);
  }

  if (submitted) {
    const repFirstName = repName.split(" ")[0] ?? repName;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="max-w-md w-full text-center">
          <Link href="/" className="inline-block mb-10">
            <Image src="/signal-v2-logo-teal-accent.svg" alt="Signal" width={200} height={50} className="h-12 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Thanks {prospectName}
          </h1>
          <p className="text-gray-600 mb-8">
            {repName}
            {repCompany && ` from ${repCompany}`} will appreciate the honesty.
            We won&apos;t follow up unless there&apos;s a real reason to do so.
          </p>
          {!showFinalNote && (repEmail || repLinkedinUrl) && (
            <div className="space-y-3">
              {repEmail && (
                <button
                  type="button"
                  onClick={() => setShowFinalNote(true)}
                  className="block w-full py-4 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Leave a final note for {repFirstName}
                </button>
              )}
              {repLinkedinUrl && (
                <a
                  href={repLinkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 px-6 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors"
                >
                  Connect on LinkedIn
                </a>
              )}
            </div>
          )}
          {showFinalNote && repEmail && (
            <div className="text-left space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Leave a personal note for {repFirstName}
              </label>
              <textarea
                value={finalNoteText}
                onChange={(e) => setFinalNoteText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="Type your note here..."
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const subject = encodeURIComponent("Re: Signal");
                    const body = encodeURIComponent(finalNoteText.trim() || " ");
                    window.location.href = `mailto:${repEmail}?subject=${subject}&body=${body}`;
                  }}
                  className="flex-1 py-4 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Email note to {repFirstName}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFinalNote(false)}
                  className="py-4 px-4 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
              {repLinkedinUrl && (
                <a
                  href={repLinkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 text-center text-accent font-medium hover:underline"
                >
                  Connect on LinkedIn
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header - AE + prospect (logo OR name, not both) */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            {repPhotoUrl ? (
              <img
                src={repPhotoUrl}
                alt={repName}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <span className="text-accent font-semibold text-lg">
                  {repName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{repName}</p>
              {repLinkedinUrl && (
                <a
                  href={repLinkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Meet {repName.split(" ")[0]} on LinkedIn
                </a>
              )}
              {repCompany && (
                <div className="mt-1">
                  {repCompanyLogoUrl ? (
                    <img
                      src={repCompanyLogoUrl}
                      alt={repCompany}
                      className="h-5 w-auto max-w-[100px] object-contain object-left"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">{repCompany}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {(prospectLogoUrl || prospectCompany || prospectName) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                For {prospectName && prospectCompany ? `${prospectName} at ${prospectCompany}` : prospectName || prospectCompany}
              </p>
              {(prospectLogoUrl || prospectCompany) && (prospectWebsiteUrl ? (
                <a
                  href={prospectWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  {prospectLogoUrl ? (
                    <img
                      src={prospectLogoUrl}
                      alt={prospectCompany}
                      className="h-6 w-auto max-w-[120px] object-contain"
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{prospectCompany}</span>
                  )}
                </a>
              ) : (
                <span className="font-medium text-gray-900">{prospectCompany}</span>
              ))}
            </div>
          )}
        </div>

        {/* Landing: single greeting line + body + bullets + CTA (Option A) */}
        {(landingH1 || valuePropBullets?.length || dealSummary) && !showQuestions && (
          <div className="mb-10">
            {landingH1 && (
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 leading-tight">
                {prospectName
                  ? `Hi ${prospectName}, ${(landingH1 || "").replace(/\{\{firstName\}\}\s*,?\s*/gi, "").trim() || landingH1}`
                  : interpolateName(landingH1)}
              </h1>
            )}
            {dealSummary && (
              <p className="text-gray-700 mb-6 leading-relaxed">{dealSummary}</p>
            )}
            {valuePropBullets && valuePropBullets.length > 0 && (
              <ul className="space-y-3 mb-8">
                {valuePropBullets.map((bullet, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-accent shrink-0 mt-0.5">•</span>
                    <span className="text-gray-700">{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => {
                setShowQuestions(true);
                setTimeout(() => questionsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
              }}
              className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Answer a few quick questions
            </button>
          </div>
        )}

        {/* Progress + Questions section */}
        {showQuestions && (
        <>
        <div className="mb-6" ref={questionsRef}>
          <div className="h-2 bg-gray-200 rounded-full mb-2">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {!dynamic && (
            <p className="text-sm text-gray-500">
              Question {step + 1} of {questions.length}
              {questions.length <= 4 && " · ~30 seconds"}
            </p>
          )}
          {dynamic && (
            <p className="text-sm text-gray-500">~30 seconds</p>
          )}
        </div>

        {/* Intro (first step only) */}
        {step === 0 && (
          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            {interpolateName(introParagraph)}
          </p>
        )}

        {/* Current question */}
        {currentQuestion && !showOpenField && (
          <div className="mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-6">
              {currentQuestion.question_text}
            </h2>
            <div className="space-y-3">
              {[...currentQuestion.options, ...(currentQuestion.options.includes("Other") ? [] : ["Other"])].map((option) => {
                const isMulti = currentQuestion.multi_select;
                const isSelected = isMulti
                  ? (multiSelectSelections[step]?.has(option) ?? false)
                  : option === "Other"
                    ? otherSelectedForStep === step
                    : answers[step] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    disabled={fetchingNext}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all min-h-[56px] sm:min-h-[52px] font-medium disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation ${
                      isSelected
                        ? "border-accent bg-accent/10 text-gray-900"
                        : "border-gray-200 hover:border-accent hover:bg-accent/5 text-gray-800"
                    }`}
                  >
                    {isMulti && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded border-2 mr-3 align-middle shrink-0">
                        {isSelected ? (
                          <span className="text-xs font-bold">✓</span>
                        ) : null}
                      </span>
                    )}
                    {option}
                  </button>
                );
              })}
            </div>
            {/* Other option: open-text when selected (single-select) */}
            {otherSelectedForStep === step && !currentQuestion.multi_select && (
              <div className="mt-4 space-y-3">
                <label className="block text-sm text-gray-600">Please elaborate (optional)</label>
                <textarea
                  value={otherText[step] ?? ""}
                  onChange={(e) => setOtherText((prev) => ({ ...prev, [step]: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="Add any details you'd like to share..."
                />
                <button
                  type="button"
                  onClick={handleOtherSubmit}
                  disabled={fetchingNext}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}
            {/* Other option: open-text when selected (multi-select) */}
            {currentQuestion.multi_select && multiSelectSelections[step]?.has("Other") && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm text-gray-600">Please elaborate on &quot;Other&quot; (optional)</label>
                <textarea
                  value={otherText[step] ?? ""}
                  onChange={(e) => setOtherText((prev) => ({ ...prev, [step]: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
                  placeholder="Add any details..."
                />
              </div>
            )}
            {currentQuestion.multi_select && (
              <button
                type="button"
                onClick={handleMultiSelectContinue}
                disabled={
                  fetchingNext ||
                  !(multiSelectSelections[step]?.size ?? 0)
                }
                className="mt-4 w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}
            {fetchingNext && (
              <p className="mt-4 text-sm text-gray-500">Thinking...</p>
            )}
          </div>
        )}

        {/* Open text (only at the very end - never show during fetch in dynamic mode) */}
        {(showOpenField || (isLastQuestion && answers[step] !== undefined && !dynamic)) && (
          <div className="mb-8">
            {showOpenField && (
              <p className="text-gray-600 mb-4">Thanks for your answers.</p>
            )}
            <label className="block text-gray-700 font-medium mb-2">
              {finalOpenFieldPrompt ?? openFieldPrompt}
            </label>
            <textarea
              value={openText}
              onChange={(e) => setOpenText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Optional..."
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-4 w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send feedback"}
            </button>
          </div>
        )}

        {/* Back button (not on first) */}
        {step > 0 && !isLastQuestion && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Previous
          </button>
        )}

        </>
        )}

        {/* Low-friction exit */}
        {showQuestions && !submitted && (
          <p className="mt-8 text-center">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch("/api/signals/submit-response", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      signalId,
                      answers: [{ question: "Opted out", answer: "Not interested right now" }],
                      answersObj: { opted_out: true },
                    }),
                  });
                  if (!res.ok) throw new Error();
                  setSubmitted(true);
                } catch {
                  setLoading(false);
                }
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Not interested right now?
            </button>
          </p>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <Link href="/" className="inline-block">
            <Image src="/signal-v2-logo-teal-accent.svg" alt="Signal" width={80} height={20} className="h-4 w-auto opacity-70 mx-auto" />
          </Link>
          <p className="text-xs text-gray-400 mt-2">Powered by Signal</p>
        </div>
      </div>
    </div>
  );
}
