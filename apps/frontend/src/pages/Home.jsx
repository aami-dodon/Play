import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Timer } from "lucide-react";

import { fetchQuizzes, fetchGlobalLeaderboard } from "@/api";
import ChallengeCard from "@/components/ChallengeCard";
import LeaderboardTable from "@/components/LeaderboardTable";
import StatTiles from "@/components/StatTiles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatLeaderboardRows } from "@/lib/leaderboard";
import { leaderboardPreviewPlayers, texts } from "@/texts";

const fallbackPlayers = ["2.1k online", "987 online", "1.4k online", "612 online"];
const fallbackStreaks = ["13 wins", "8 wins", "22 wins", "5 wins"];

const heroToggleOptions = [
  { value: "challenge", label: "Challenged" },
  { value: "home", label: "Home" },
];

function decorateChallenges(quizzes) {
  if (!quizzes?.length) {
    return {
      items: texts.home.featured.placeholderChallenges,
      usedFallback: true,
    };
  }

  return {
    items: quizzes.slice(0, 4).map((quiz, index) => ({
      slug: quiz.slug,
      title: quiz.title,
      description: quiz.description || "You know you want to tap in.",
      category: quiz.category || "General",
      difficulty: quiz.difficulty || quiz.level || (index % 2 === 0 ? "Spicy" : "Chaotic"),
      players:
        quiz.players_label ||
        quiz.players ||
        fallbackPlayers[index % fallbackPlayers.length],
      streak:
        quiz.streak_label || quiz.streak || fallbackStreaks[index % fallbackStreaks.length],
    })),
    usedFallback: false,
  };
}

function extractQuizItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

function extractLeaderboardEntries(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.entries)) return payload.entries;
  return [];
}

export default function Home() {
  const [quizzes, setQuizzes] = useState([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [heroMode, setHeroMode] = useState("home");
  const location = useLocation();
  const notice = location.state?.notice;
  const [dialogOpen, setDialogOpen] = useState(Boolean(notice));

  useEffect(() => {
    let mounted = true;
    async function loadHomeData() {
      const [featuredRes, leaderboardRes] = await Promise.allSettled([
        fetchQuizzes({ featured: true }),
        fetchGlobalLeaderboard(6),
      ]);

      if (!mounted) return;

      if (featuredRes.status === "fulfilled") {
        setQuizzes(extractQuizItems(featuredRes.value));
      } else {
        console.error("Failed to load featured challenges:", featuredRes.reason);
        setQuizzes([]);
      }

      if (leaderboardRes.status === "fulfilled") {
        setOverallLeaderboard(extractLeaderboardEntries(leaderboardRes.value));
      } else {
        console.error("Failed to load leaderboard:", leaderboardRes.reason);
        setOverallLeaderboard([]);
      }

      setLoadingFeatured(false);
      setLoadingLeaderboard(false);
    }

    loadHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setDialogOpen(Boolean(notice));
  }, [notice, location.key]);

  const { items: challenges, usedFallback: featuredFallback } = useMemo(
    () => decorateChallenges(quizzes),
    [quizzes]
  );
  const leaderboardRows = useMemo(() => {
    const formatted = formatLeaderboardRows(overallLeaderboard, { fallbackCategory: "Arcade" });
    return formatted.length ? formatted : leaderboardPreviewPlayers;
  }, [overallLeaderboard]);

  const liveQueueItems = useMemo(() => {
    const source = challenges.length
      ? challenges
      : texts.home.featured.placeholderChallenges;
    const sample = [...source];
    for (let i = sample.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [sample[i], sample[j]] = [sample[j], sample[i]];
    }
    return sample.slice(0, Math.min(3, sample.length));
  }, [challenges]);

  return (
    <div className="space-y-8">
      {notice && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center text-base leading-relaxed">
                {notice}
              </DialogTitle>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link to="/challenge">Play a new one</Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Card className="grid gap-8 border-border/70 bg-card/95 p-6 lg:grid-cols-[1.2fr_minmax(0,0.9fr)] lg:items-center">
        <div className="space-y-6">
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
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/challenge">{texts.home.hero.primaryCta}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
              <Link to="/challenge">{texts.home.hero.secondaryCta}</Link>
            </Button>
          </div>
          <StatTiles stats={texts.home.hero.stats} dense className="hero-stats-animate" />
        </div>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Live queue</CardTitle>
              <CardDescription className="text-sm">
                Fast-matching challenges with instant ego tracking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  <span>Ego Meter</span>
                  <span>5/10 💅</span>
                </div>
                <Progress value={50} className="mt-3 h-3 bg-primary/20" />
              </div>
              <div className="space-y-3">
                {liveQueueItems.map((item) => (
                  <div
                    key={`${item.slug || item.title}-${item.players}`}
                    className="flex items-center justify-between rounded-2xl border border-border/60 bg-popover/80 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.category || "Arcade"} · {item.players || "Live seats open"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3">
                      Live
                    </Badge>
                  </div>
                ))}
              </div>
              <Button asChild className="w-full rounded-2xl py-6 text-base font-semibold">
                <Link to="/challenge">Queue me before I cool off</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Status
                </p>
                <p className="text-base font-semibold text-foreground">Queue time · 00:12</p>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Timer className="size-4" />
                <span className="text-sm font-semibold">Fast lane engaged</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>

      <section id="featured" className="space-y-5">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
            {texts.home.featured.title}
          </p>
          <h2 className="text-2xl font-semibold text-foreground hero-subtitle-animate">
            {texts.home.featured.subtitle}
          </h2>
        </div>
        {loadingFeatured ? (
          <Card className="border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
            Loading challenges...
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.slug || challenge.title} challenge={challenge} />
              ))}
            </div>
            {featuredFallback && (
              <Card className="border-dashed border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
                No challenges found in the database yet. Add a quiz through the backend to see it on
                the home page.
              </Card>
            )}
            <div className="flex justify-end">
              <Button asChild variant="link">
                <Link to="/challenge">View all challenges →</Link>
              </Button>
            </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
            {texts.home.leaderboardPreview.title}
          </p>
          <p className="text-2xl font-semibold text-foreground hero-subtitle-animate">
            {texts.home.leaderboardPreview.subtitle}
          </p>
        </div>
        {loadingLeaderboard ? (
          <Card className="border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
            Loading leaderboard...
          </Card>
        ) : (
          <>
            <LeaderboardTable
              title="Sneak peek"
              subtitle="Overall standings across every challenge."
              players={leaderboardRows.slice(0, 5)}
              compact
            />
            <div className="flex justify-end">
              <Button asChild variant="link">
                <Link to="/leaderboard">View full leaderboard →</Link>
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
