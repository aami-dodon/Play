import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { fetchLeaderboard, submitScore } from "../api.js";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

export default function Result() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const score = parseInt(params.get("score")) || 0;
  const time = parseInt(params.get("time")) || 0;

  const [username, setUsername] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const payload = { username, score, completion_time_seconds: time };
    await submitScore(slug, payload);
    const data = await fetchLeaderboard(slug);
    setLeaderboard(data);
    setSubmitted(true);
  };

  const shellClasses =
    "min-h-screen px-4 py-12 text-foreground [background:radial-gradient(circle_at_top,_color-mix(in_oklab,_var(--primary)_35%,_transparent),_transparent_45%),radial-gradient(circle_at_20%_20%,_color-mix(in_oklab,_var(--accent)_25%,_transparent),_transparent_35%),var(--background)]";

  return (
    <div className={shellClasses}>
      <Card className="mx-auto w-full max-w-2xl gap-6 border-border/70 bg-card/95 px-6 py-8 text-center shadow-[0_35px_120px_rgba(2,6,23,0.55)] backdrop-blur-xl">
        <div className="prose prose-base mx-auto max-w-md text-center dark:prose-invert">
          <h2 className="mb-2 text-3xl font-semibold">🎉 Quiz complete!</h2>
          <p className="mt-0 text-muted-foreground">
            You wrapped this round in style. Drop your name to lock in the score and see how you stack up.
          </p>
        </div>

        <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 sm:text-base">
          <div className="rounded-2xl border border-border/70 bg-popover/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--secondary)]">Score</dt>
            <dd className="mt-2 text-3xl font-bold text-foreground">{score}</dd>
          </div>
          <div className="rounded-2xl border border-border/70 bg-popover/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--secondary)]">
              Time (s)
            </dt>
            <dd className="mt-2 text-3xl font-bold text-foreground">{time}</dd>
          </div>
        </dl>

        {!submitted ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="sm:flex-1"
            />
            <Button onClick={handleSubmit} disabled={!username} className="sm:w-auto">
              Submit score
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-popover/80 p-5 text-left">
            <div className="prose prose-sm mb-4 dark:prose-invert">
              <h3 className="mb-1 text-xl font-semibold">🏆 Leaderboard</h3>
              <p className="mt-0 text-muted-foreground">
                Thanks for playing! Here&apos;s how everyone is performing.
              </p>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scores yet.</p>
            ) : (
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                {leaderboard.map((entry, i) => (
                  <li key={`${entry.username}-${i}`} className="font-medium text-foreground">
                    <span className="text-muted-foreground">{entry.username}</span>{" "}
                    <span className="text-foreground">{entry.score} pts</span>{" "}
                    <span className="text-muted-foreground">({entry.completion_time_seconds}s)</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
  
