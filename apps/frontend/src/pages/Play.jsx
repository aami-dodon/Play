import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { fetchQuestions } from "../api.js";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

export default function Play() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!slug) return;
    const key = `played_${slug}`;
    const alreadyPlayed = typeof window !== "undefined" && localStorage.getItem(key);

    if (alreadyPlayed) {
      navigate("/", {
        state: { notice: "You’ve already played this quiz. Try another one!" },
        replace: true,
      });
      return;
    }

    localStorage.setItem(key, Date.now().toString());
  }, [slug, navigate]);

  useEffect(() => {
    fetchQuestions(slug).then(setQuestions);
  }, [slug]);

  if (questions.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl justify-center">
        <Card className="mx-auto w-full max-w-2xl border-border/70 bg-card/90 px-6 py-8 text-center shadow-[0_35px_120px_rgba(2,6,23,0.65)] backdrop-blur-xl">
          <p className="text-base font-medium text-muted-foreground">Loading questions...</p>
        </Card>
      </div>
    );
  }

  const q = questions[current];
  const correctAnswer =
    q.correct_option || q.answer || q.correctAnswer || q.correct || "";
  const explanation =
    q.explanation || q.reason || q.details || q.note || "";

  const handleAnswer = (option) => {
    if (selected) return; // prevent double clicks
    setSelected(option);

    const isCorrect = option === correctAnswer;
    if (isCorrect) setScore((prev) => prev + 1);
  };

  const next = () => {
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setSelected(null);
    } else {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      navigate(`/result/${slug}?score=${score}&time=${timeTaken}`);
    }
  };

  const isLastQuestion = current + 1 === questions.length;

  return (
    <>
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 rounded-3xl border border-border/70 bg-card/90 px-6 py-5 text-center text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground shadow-[0_25px_80px_rgba(2,6,23,0.35)]">
          <p className="text-xs text-[var(--secondary-foreground)]">Play</p>
          <p className="text-sm text-foreground">
            Question {current + 1} / {questions.length}
          </p>
        </div>
      </div>
      <Card className="mx-auto w-full max-w-2xl gap-6 border-border/70 bg-card/90 px-6 py-8 shadow-[0_35px_120px_rgba(2,6,23,0.65)] backdrop-blur-xl">
        <header className="space-y-2">
          <div className="prose prose-base dark:prose-invert">
            <p className="mb-0 text-lg font-semibold text-foreground">
              {q.question_text}
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-3">
          {q.options.map((option, i) => {
            const isCorrect = option === correctAnswer;
            const isSelected = selected === option;

            return (
              <Button
                key={i}
                type="button"
                variant="ghost"
                disabled={!!selected}
                className={cn(
                  "w-full justify-start rounded-2xl border border-border/70 bg-popover/80 px-4 py-3 text-left text-base font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-accent/30 disabled:opacity-60",
                  {
                    "border-chart-1 bg-chart-1 text-card-foreground shadow-lg shadow-chart-1/30":
                      selected && isCorrect,
                    "border-destructive bg-destructive/90 text-primary-foreground shadow-lg shadow-destructive/30":
                      selected && isSelected && !isCorrect,
                  }
                )}
                onClick={() => handleAnswer(option)}
              >
                {option}
              </Button>
            );
          })}
        </div>

        {selected && (
          <div className="rounded-2xl border border-border/70 bg-popover/80 p-4 text-sm text-muted-foreground shadow-inner">
            {explanation && (
              <div className="prose prose-sm dark:prose-invert">
                <p className="mb-0">
                  <span role="img" aria-hidden="true">
                    💡
                  </span>{" "}
                  <strong className="text-foreground">Explanation:</strong> {explanation}
                </p>
              </div>
            )}
            <Button className="mt-4 w-full sm:w-auto" onClick={next}>
              {isLastQuestion ? "See results" : "Next question"}
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
