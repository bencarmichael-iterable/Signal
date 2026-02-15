"use client";

import { useState, useEffect } from "react";

type Props = {
  signalId: string;
  prospectName: string;
  introParagraph: string;
  questions: { question_text: string; options: string[] }[];
  openFieldPrompt: string;
  repName: string;
  repCompany: string;
};

export default function SignalForm({
  signalId,
  prospectName,
  introParagraph,
  questions,
  openFieldPrompt,
  repName,
  repCompany,
}: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [openText, setOpenText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentQuestion = questions[step];
  const isLastQuestion = step === questions.length - 1;
  const progress = ((step + 1) / questions.length) * 100;

  useEffect(() => {
    fetch("/api/signals/track-open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalId }),
    }).catch(() => {});
  }, [signalId]);

  async function handleOptionSelect(option: string) {
    const newAnswers = { ...answers, [step]: option };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      return;
    }
    setStep(step + 1);
  }

  async function handleSubmit() {
    setLoading(true);

    const allAnswers = questions.map((q, i) => ({
      question: q.question_text,
      answer: answers[i] || "",
    }));
    if (openText.trim()) {
      allAnswers.push({
        question: openFieldPrompt,
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Thanks {prospectName}
          </h1>
          <p className="text-gray-600">
            {repName} will appreciate the honesty. No follow-up unless you want
            one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-gray-500">
            {repName}
            {repCompany && ` · ${repCompany}`}
          </p>
        </div>

        {/* Progress */}
        <div className="h-1 bg-gray-200 rounded-full mb-8">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Intro (first step only) */}
        {step === 0 && (
          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            {introParagraph}
          </p>
        )}

        {/* Current question */}
        <div className="mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-6">
            {currentQuestion.question_text}
          </h2>
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleOptionSelect(option)}
                className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-accent hover:bg-accent/5 transition-all min-h-[48px] font-medium text-gray-800"
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Open text (after last question) */}
        {isLastQuestion && answers[step] !== undefined && (
          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">
              {openFieldPrompt}
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

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">Powered by Signal</p>
        </div>
      </div>
    </div>
  );
}
