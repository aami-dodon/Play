import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { fetchQuizzes, fetchGlobalLeaderboard } from "@/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatLeaderboardRows } from "@/lib/leaderboard";
import { texts } from "@/texts";

import HomeHero from "@/components/home/HomeHero";
import HomeLiveQueue from "@/components/home/HomeLiveQueue";
import HomeFeatured from "@/components/home/HomeFeatured";
import HomeLeaderboardPreview from "@/components/home/HomeLeaderboardPreview";

function decorateChallenges(quizzes) {
  if (!quizzes?.length) {
    return {
      items: [],
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
      players: quiz.players_label || quiz.players,
      streak: quiz.streak_label || quiz.streak,
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
  const location = useLocation();
  const notice = location.state?.notice;
  const [dialogOpen, setDialogOpen] = useState(Boolean(notice));
  const sections = {
    hero: true,
    liveQueue: true,
    featured: true,
    leaderboard: true,
  };

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
  const leaderboardRows = useMemo(
    () => formatLeaderboardRows(overallLeaderboard),
    [overallLeaderboard]
  );

  const liveQueueItems = useMemo(() => {
    const source = challenges;
    const sample = [...source];
    for (let i = sample.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [sample[i], sample[j]] = [sample[j], sample[i]];
    }
    return sample.slice(0, Math.min(3, sample.length));
  }, [challenges]);

  return (
    <div className="space-y-8 w-full max-w-full">
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

      {sections.hero && (
        <Card className="w-full max-w-full grid gap-8 border-border/70 bg-card/95 p-6 lg:grid-cols-[1.2fr_minmax(0,0.9fr)] lg:items-start">
          <HomeHero />
          {sections.liveQueue && <HomeLiveQueue liveQueueItems={liveQueueItems} />}
        </Card>
      )}

      {sections.featured && (
        <HomeFeatured
          challenges={challenges}
          loading={loadingFeatured}
          featuredFallback={featuredFallback}
        />
      )}

      {sections.leaderboard && (
        <HomeLeaderboardPreview
          loadingLeaderboard={loadingLeaderboard}
          leaderboardRows={leaderboardRows}
        />
      )}
    </div>
  );
}
