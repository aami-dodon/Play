import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Flame, Trophy } from "lucide-react";
import { texts } from "@/texts";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

const difficultyColors = {
  Chill: "bg-[color:var(--secondary)]/20 text-[color:var(--primary-foreground)]",
  Spicy: "bg-[color:var(--secondary)]/30 text-[color:var(--primary-foreground)]",
  Chaotic: "bg-[color:var(--secondary)]/40 text-[color:var(--primary-foreground)]",
};

export default function ChallengeCard({ challenge, ctaLabel = "Play", compact }) {
  const {
    slug,
    title,
    description,
    category = "General",
    difficulty = "Spicy",
    players = "1.2k",
    streak = "12",
  } = challenge;

  const difficultyClass = difficultyColors[difficulty] || difficultyColors.Spicy;
  const promptText = useMemo(() => {
    const prompts = texts.challenge.prompts || [];
    if (!prompts.length) {
      return texts.challenge.prompt;
    }
    const index = Math.floor(Math.random() * prompts.length);
    return prompts[index];
  }, []);

  return (
    <Card className="border-border/70 bg-card/95 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          <Badge variant="secondary" className="rounded-full px-3 text-[0.6rem] tracking-[0.3em]">
            🧠 {category}
          </Badge>
          <Badge className={`rounded-full px-3 text-[0.6rem] tracking-[0.3em] ${difficultyClass}`}>
            {difficulty}
          </Badge>
        </div>
        <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {!compact && (
        <CardContent className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-popover/80 px-3 py-2">
            <Trophy className="size-4 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Players</p>
              <p className="text-base font-semibold text-foreground">{players}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-popover/80 px-3 py-2">
            <Flame className="size-4 text-orange-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Streak</p>
              <p className="text-base font-semibold text-foreground">{streak}</p>
            </div>
          </div>
        </CardContent>
      )}
      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {promptText}
        </p>
        <Button asChild size="sm" className="rounded-full px-4">
          <Link to={slug ? `/challenge/${slug}` : "/challenge"}>{ctaLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
