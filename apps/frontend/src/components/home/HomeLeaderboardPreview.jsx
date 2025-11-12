import { Link } from "react-router-dom";

import LeaderboardTable from "@/components/LeaderboardTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { texts } from "@/texts";

export default function HomeLeaderboardPreview({ loadingLeaderboard, leaderboardRows = [] }) {
  return (
    <section className="space-y-4">
      <div className="flex w-full flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          {texts.home.leaderboardPreview.title}
        </p>
        <p className="text-2xl font-semibold text-foreground hero-subtitle-animate">
          {texts.home.leaderboardPreview.subtitle}
        </p>
      </div>
      {loadingLeaderboard ? (
        <Card className="w-full max-w-full border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
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
  );
}
