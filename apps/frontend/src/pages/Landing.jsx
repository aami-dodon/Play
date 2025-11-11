import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { fetchQuizzes } from "../api.js";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export default function Landing() {
  const [quizzes, setQuizzes] = useState([]);
  const location = useLocation();
  const notice = location.state?.notice;

  useEffect(() => {
    fetchQuizzes().then(setQuizzes);
  }, []);

  const heroQuiz = quizzes[0];
  const heroLink = heroQuiz ? `/play/${heroQuiz.slug}` : "/play";

  const noticeStyles = useMemo(
    () => ({
      borderColor: "color-mix(in_oklab, var(--accent) 50%, var(--border))",
      backgroundColor: "color-mix(in_oklab, var(--accent) 10%, transparent)",
      color: "var(--foreground)",
    }),
    []
  );

  return (
    <>
      {notice && (
        <Card
          className="border px-4 py-4 text-sm font-semibold shadow-none backdrop-blur lg:text-base"
          style={noticeStyles}
        >
          <p className="m-0">
            <strong>Heads up:</strong> {notice}
          </p>
        </Card>
      )}

      <Card className="gap-0 border-border/70 bg-card/95 px-0 py-0 shadow-[0_35px_120px_rgba(2,6,23,0.55)]">
        <div className="grid gap-10 p-8 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] md:items-center">
          <div className="prose prose-lg dark:prose-invert">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.45em] text-[var(--secondary-foreground)]">
              ✨ Quiz Arcade
            </p>
            <h1 className="mb-4 text-4xl font-semibold text-foreground">
              Modern quizzes, playful vibes.
            </h1>
            <p className="text-base text-muted-foreground">
              Enjoy a cozy, mobile-first experience with crisp gradients, joyful micro-interactions,
              and thoughtful pacing. Pick a quiz, tap through the prompts, and let your curiosity spark
              with every answer.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={heroLink}>Start the featured quiz</Link>
              </Button>
              <Button size="lg" type="button" variant="secondary">
                Browse future decks
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-64 rounded-[2rem] border border-border/60 bg-[color-mix(in_oklab,_var(--accent)_15%,_transparent)] p-5 shadow-[0_25px_70px_rgba(2,6,23,0.65)]">
              <div className="rounded-[1.5rem] border border-border/60 bg-popover/95 p-4">
                <div className="mb-4 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="text-[var(--secondary-foreground)]">Live</span>
                  <span>4 / 8</span>
                </div>
                <p className="text-sm font-medium text-card-foreground">
                  Which database type is best for connected social data?
                </p>
                <div className="mt-4 space-y-2">
                  {["Graph DB", "Document DB", "Relational DB"].map((option) => (
                    <div
                      key={option}
                      className="rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-sm font-medium text-foreground"
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section id="quizzes" className="space-y-5 border-t border-border/60 p-8">
          <div className="prose dark:prose-invert">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.45em] text-[var(--secondary-foreground)]">
              Featured decks
            </p>
            <h2 className="mb-0 text-2xl font-semibold text-foreground">
              Tap into a new topic
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {quizzes.length === 0 ? (
              <Card className="border-border/60 bg-popover/90 px-5 py-6 text-sm text-muted-foreground shadow-none">
                Loading quizzes...
              </Card>
            ) : (
              quizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="border-border/60 bg-popover/90 px-5 py-6 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl"
                >
                  <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-wide">
                    🧠 {quiz.category || "General"}
                  </Badge>
                  <div className="prose prose-sm dark:prose-invert">
                    <h3 className="mb-1 text-lg font-semibold text-foreground">{quiz.title}</h3>
                    <p className="mt-0 text-muted-foreground">{quiz.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Collect points</span>
                    <Button asChild size="sm" variant="secondary">
                      <Link to={`/play/${quiz.slug}`}>Play →</Link>
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </Card>
    </>
  );
}
