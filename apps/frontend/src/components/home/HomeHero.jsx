import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatTiles from "@/components/StatTiles";
import { texts } from "@/texts";

const heroToggleOptions = [
  { value: "challenge", label: "Challenged" },
  { value: "home", label: "Home" },
];

export default function HomeHero() {
  const [heroMode, setHeroMode] = useState("home");

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        <Badge variant="secondary" className="rounded-full px-4 text-[0.6rem] tracking-[0.35em]">
          Live queue
        </Badge>
        <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1">
          {heroToggleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setHeroMode(option.value)}
              className={`rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.35em] transition ${
                heroMode === option.value
                  ? "bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(2,6,23,0.35)]"
                  : "text-muted-foreground"
              }`}
              aria-pressed={heroMode === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="hero-eyebrow-animate text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          {texts.home.hero.eyebrow}
        </p>
        <h1 className="hero-title-animate text-4xl font-semibold leading-tight text-foreground">
          {texts.home.hero.title}
        </h1>
        <p className="hero-description-animate text-base text-muted-foreground">
          {texts.home.hero.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-3 w-full max-w-full">
        <Button asChild size="lg" className="rounded-full px-8">
          <Link to="/challenge">{texts.home.hero.primaryCta}</Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
          <Link to="/challenge">{texts.home.hero.secondaryCta}</Link>
        </Button>
      </div>
      <StatTiles stats={texts.home.hero.stats} dense className="hero-stats-animate w-full" />
    </div>
  );
}
