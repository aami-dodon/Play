import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { fetchLeaderboard, submitScore } from "@/client";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { texts, resultShareText } from "@/texts";
import { hasPlayedChallenge, saveLocalPlayerName } from "@/lib/playedChallenges";

export default function Results() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const score = Number(params.get("score")) || 0;
  const time = Number(params.get("time")) || 0;
  const total = Number(params.get("total")) || 1;
  const accuracy = Math.round((score / total) * 100);

  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [aliasDialogOpen, setAliasDialogOpen] = useState(true);
  const friendlyChallengeName = useMemo(() => {
    if (!slug) return "Arcade Challenge";
    return slug
      .split("-")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }, [slug]);

  const feedbackLine = useMemo(() => {
    const ratio = total ? score / total : 0;
    const match = texts.results.feedback.find((entry) => ratio >= entry.threshold);
    return match?.line || texts.results.copy;
  }, [score, total]);

  const stats = useMemo(
    () => [
      { label: "Score", value: score, helper: "Big brain energy" },
      { label: "Time", value: `${time}s`, helper: "Speedrun-ish" },
      { label: "Accuracy", value: `${accuracy}%`, helper: "Could be worse" },
    ],
    [score, time, accuracy]
  );

  const leaderboardData = leaderboard.map((entry, index) => ({
    player: entry.username,
    score: entry.score,
    category: slug || "Arcade",
    time: `${entry.completion_time_seconds || "?"}s`,
    rank: entry.rank || index + 1,
    challengeName: friendlyChallengeName,
  }));

  useEffect(() => {
    setAlreadyPlayed(hasPlayedChallenge(slug));
  }, [slug]);

  const handleSubmit = async () => {
    if (!username) return;
    setSubmitting(true);
    try {
      await submitScore(slug, {
        username,
        score,
        completion_time_seconds: time,
      });
      const data = await fetchLeaderboard(slug);
      setLeaderboard(data);
      setSubmitted(true);
      setAliasDialogOpen(false);
      saveLocalPlayerName(username);
      toast.success(texts.toasts.achievement);
    } catch (error) {
      console.error("Failed to submit leaderboard entry:", error);
      toast.error("Leaderboard had a meltdown. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareText = resultShareText(score);
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied your brag to clipboard.");
      } else {
        throw new Error("Share unavailable");
      }
    } catch (error) {
      console.error("Share failed:", error);
      toast.error("Share feature took a nap. Manual bragging only.");
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
            {texts.results.heading}
          </p>
          <CardTitle className="text-4xl font-semibold">{texts.results.copy}</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {feedbackLine}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StatTiles stats={stats} />

          <div className="flex flex-col gap-3 sm:flex-row">
            {!alreadyPlayed && (
              <Button size="lg" className="rounded-full px-8" onClick={() => navigate(`/challenge/${slug || "demo"}`)}>
                {texts.results.buttons.replay}
              </Button>
            )}
            <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
              <Link to="/">{texts.results.buttons.tryAnother}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8"
              type="button"
              onClick={handleShare}
            >
              <Share2 className="size-4" /> {texts.results.buttons.share}
            </Button>
          </div>
          {alreadyPlayed && (
            <p className="text-sm text-muted-foreground">
              You already completed this challenge, so no repeat runs here. Explore another one instead.
            </p>
          )}

          {!submitted ? (
            <div className="space-y-3 rounded-2xl border border-border/60 bg-popover/80 p-4">
              <p className="text-sm font-semibold text-foreground">
                Drop your name to cement the brag.
              </p>
              <Dialog open={aliasDialogOpen} onOpenChange={setAliasDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full rounded-full px-8" type="button">
                    Alias for the legend board
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Drop your name to cement the brag.</DialogTitle>
                    <DialogDescription>
                      Alias for the legend board and a chance to Post score with swagger.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Alias for the legend board"
                    />
                  </div>
                  <DialogFooter className="gap-3">
                    <Button size="lg" disabled={!username || submitting} onClick={handleSubmit}>
                      {submitting ? "Uploading ego..." : "Post score"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <LeaderboardTable
              title="Leaderboard"
              subtitle="Flex responsibly."
              players={leaderboardData}
              highlightPlayer={username}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
