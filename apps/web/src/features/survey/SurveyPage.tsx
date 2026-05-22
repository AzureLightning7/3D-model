import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, ApiError } from "@/shared/api";
import type { SurveyAnswer } from "@/shared/types";
import { styles } from "@/shared/ui";

import { useProfileStore } from "./store";

// A small bag of gradient swatches used to give each option a visual identity.
const SWATCHES: Record<string, string> = {
  cozy: "linear-gradient(135deg, #fde68a, #fb7185)",
  minimal: "linear-gradient(135deg, #e5e7eb, #9ca3af)",
  social: "linear-gradient(135deg, #c4b5fd, #ec4899)",
  study: "linear-gradient(135deg, #93c5fd, #6366f1)",
  rest: "linear-gradient(135deg, #fbcfe8, #c4b5fd)",
  hangout: "linear-gradient(135deg, #fcd34d, #f97316)",
  warm: "linear-gradient(135deg, #fb923c, #c2410c)",
  cool: "linear-gradient(135deg, #5eead4, #1e3a8a)",
  neutral: "linear-gradient(135deg, #f3f4f6, #4b5563)",
  full: "linear-gradient(135deg, #a78bfa, #6d28d9)",
  sparse: "linear-gradient(135deg, #d1d5db, #6b7280)",
  bright: "linear-gradient(135deg, #fef3c7, #fde047)",
  ambient: "linear-gradient(135deg, #7c3aed, #312e81)",
};

export function SurveyPage() {
  const nav = useNavigate();
  const setProfileId = useProfileStore((s) => s.setProfileId);

  const { data, isLoading } = useQuery({
    queryKey: ["survey"],
    queryFn: () => api.styleProfiles.getSurvey(),
  });

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = data?.questions ?? [];
  const current = questions[step];
  const total = questions.length;
  const isLast = step === total - 1;
  const picked = current ? answers[current.id] : undefined;

  useEffect(() => {
    setError(null);
  }, [step]);

  function pick(optionId: string) {
    if (!current) return;
    setAnswers((a) => ({ ...a, [current.id]: optionId }));
  }

  async function submit() {
    if (Object.keys(answers).length < total) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: SurveyAnswer[] = questions.map((q) => ({
        questionId: q.id,
        optionId: answers[q.id]!,
      }));
      const profile = await api.styleProfiles.create(payload);
      setProfileId(profile.id);
      nav("/projects", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? String(e.detail) : (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || !current) {
    return <div style={styles.page}>Loading survey…</div>;
  }

  return (
    <div style={{ ...styles.page, maxWidth: 720 }}>
      <header style={{ marginBottom: 16 }}>
        <p style={{ ...styles.muted, fontSize: 12, margin: 0 }}>
          Step {step + 1} of {total}
        </p>
        <h1 style={{ margin: "4px 0 0" }}>{current.title}</h1>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(current.options.length, 3)}, 1fr)`,
          gap: 12,
        }}
      >
        {current.options.map((opt) => {
          const selected = picked === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => pick(opt.id)}
              style={{
                ...styles.card,
                padding: 0,
                overflow: "hidden",
                cursor: "pointer",
                textAlign: "left",
                background: "rgba(255,255,255,0.06)",
                border: selected
                  ? "2px solid #c4b5fd"
                  : "1px solid rgba(255,255,255,0.12)",
                color: "#f3f0ff",
                transition: "transform 80ms ease",
                transform: selected ? "translateY(-2px)" : "none",
              }}
            >
              <div
                style={{
                  height: 140,
                  background: SWATCHES[opt.id] ?? "#3d2766",
                }}
              />
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontWeight: 600 }}>{opt.label}</div>
                <div style={{ ...styles.muted, fontSize: 12, marginTop: 2 }}>
                  {opt.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p style={styles.err}>{error}</p>}

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          style={styles.buttonGhost}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting}
        >
          ← Back
        </button>
        {isLast ? (
          <button
            style={styles.button}
            onClick={submit}
            disabled={!picked || submitting || Object.keys(answers).length < total}
          >
            {submitting ? "Saving…" : "Finish & save"}
          </button>
        ) : (
          <button
            style={styles.button}
            onClick={() => setStep((s) => s + 1)}
            disabled={!picked}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
