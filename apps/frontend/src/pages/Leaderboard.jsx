import { useEffect, useMemo, useState } from "react";

import LeaderboardTable from "@/components/LeaderboardTable";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchGlobalLeaderboard } from "@/api";
import { formatLeaderboardRows } from "@/lib/leaderboard";
import { texts } from "@/texts";

export default function Leaderboard() {
  const [overall, setOverall] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadLeaderboard() {
      try {
        const data = await fetchGlobalLeaderboard(15);
        if (!ignore) {
          setOverall(data);
        }
      } catch (err) {
        console.error("Failed to load global leaderboard:", err);
        if (!ignore) {
          setError("Live leaderboard snoozed. Showing demo data.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadLeaderboard();

    return () => {
      ignore = true;
    };
  }, []);

  const baseRows = useMemo(() => {
    const formatted = formatLeaderboardRows(overall, { fallbackCategory: "Arcade" });
    if (formatted.length) {
      return formatted;
    }
    return texts.leaderboard.mockPlayers;
  }, [overall]);

  const leaderboardByFilter = useMemo(() => {
    const weekly = baseRows.map((player, index) => ({
      ...player,
      score: Math.max(player.score - index * 120, 0),
    }));
    const today = baseRows.slice(0, 5).map((player, index) => ({
      ...player,
      score: Math.max(player.score - 300 - index * 50, 0),
    }));

    return {
      "All Time": baseRows,
      "This Week": weekly,
      Today: today,
    };
  }, [baseRows]);

  return (
    <div className="space-y-8">
      <Card className="border-border/70 bg-card/95">
        <CardHeader className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
            {texts.leaderboard.title}
          </p>
          <CardTitle className="text-3xl font-semibold">{texts.leaderboard.subtitle}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            These legends answered faster than you can Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="rounded-full px-4">
            Current rank · #42
          </Badge>
          <Badge variant="outline" className="rounded-full px-4">
            Congrats, you beat 3 people! Out of 4.
          </Badge>
          <span className="text-sm font-medium text-muted-foreground">Flex responsibly</span>
        </CardContent>
      </Card>

      <Tabs defaultValue="All Time" className="space-y-4">
        <TabsList>
          {texts.leaderboard.filters.map((filter) => (
            <TabsTrigger key={filter} value={filter}>
              {filter}
            </TabsTrigger>
          ))}
        </TabsList>
        {texts.leaderboard.filters.map((filter) => (
          <TabsContent key={filter} value={filter}>
            {loading && filter !== "All Time" ? (
              <Card className="border-border/60 bg-popover/80 p-6 text-sm text-muted-foreground">
                Loading {filter.toLowerCase()} leaderboard...
              </Card>
            ) : (
              <LeaderboardTable
                title={`${filter} leaderboard`}
                subtitle={filter === "All Time" ? "Legends only." : "Still counts."}
                players={leaderboardByFilter[filter] || []}
                highlightPlayer="GlitchQueen"
                caption={filter === "All Time" && error ? error : undefined}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
