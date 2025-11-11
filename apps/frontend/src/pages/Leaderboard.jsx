import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { Button } from "@/components/ui/button";

const LEADERBOARD_PAGE_SIZE = 15;

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [meta, setMeta] = useState({ loading: true, hasMore: true, error: "" });
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const loadMoreRef = useRef(null);
  const isMountedRef = useRef(true);
  const safeSetState = useCallback((setter, value) => {
    if (!isMountedRef.current) return;
    setter(value);
  }, []);

  const fetchLeaderboardPage = useCallback(
    async ({ reset = false } = {}) => {
      if (!reset && !hasMoreRef.current) return;
      if (loadingRef.current) return;

      loadingRef.current = true;
      safeSetState(setMeta, (prev) => ({ ...prev, loading: true, error: reset ? "" : prev.error }));

      const offset = reset ? 0 : offsetRef.current;

      try {
        const payload = await fetchGlobalLeaderboard({ limit: LEADERBOARD_PAGE_SIZE, offset });
        const normalized = Array.isArray(payload) ? { entries: payload } : payload || {};
        const items = Array.isArray(normalized.entries) ? normalized.entries : [];
        if (reset) {
          safeSetState(setEntries, () => items);
        } else {
          safeSetState(setEntries, (prev) => [...prev, ...items]);
        }

        const hasMore =
          typeof normalized.hasMore === "boolean"
            ? normalized.hasMore
            : items.length === LEADERBOARD_PAGE_SIZE;
        hasMoreRef.current = hasMore;
        safeSetState(setMeta, (prev) => ({ ...prev, hasMore, error: "" }));

        const nextOffset = normalized.nextOffset ?? (offset + items.length);
        offsetRef.current = nextOffset;
      } catch (err) {
        console.error("Failed to load global leaderboard:", err);
        safeSetState(setMeta, (prev) => ({
          ...prev,
          error: texts.leaderboard.fallbackCaption,
        }));
      } finally {
        loadingRef.current = false;
        safeSetState(setMeta, (prev) => ({ ...prev, loading: false }));
      }
    },
    [safeSetState]
  );

  useEffect(() => {
    offsetRef.current = 0;
    hasMoreRef.current = true;
    safeSetState(setEntries, () => []);
    safeSetState(setMeta, () => ({ loading: true, hasMore: true, error: "" }));
    fetchLeaderboardPage({ reset: true });
  }, [fetchLeaderboardPage, safeSetState]);

  const loadMoreElement = loadMoreRef.current;
  useEffect(() => {
    if (!loadMoreElement) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchLeaderboardPage();
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [loadMoreElement, fetchLeaderboardPage]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const baseRows = useMemo(() => {
    const formatted = formatLeaderboardRows(entries, { fallbackCategory: "Arcade" });
    if (formatted.length) {
      return formatted;
    }
    return texts.leaderboard.mockPlayers;
  }, [entries]);

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
            {meta.loading && filter !== "All Time" ? (
              <Card className="border-border/60 bg-popover/80 p-6 text-sm text-muted-foreground">
                Loading {filter.toLowerCase()} leaderboard...
              </Card>
            ) : (
              <LeaderboardTable
                title={`${filter} leaderboard`}
                subtitle={filter === "All Time" ? "Legends only." : "Still counts."}
                players={leaderboardByFilter[filter] || []}
                highlightPlayer="GlitchQueen"
                caption={filter === "All Time" && meta.error ? meta.error : undefined}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
      <div className="space-y-3">
        {meta.hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => fetchLeaderboardPage()}
              disabled={meta.loading}
            >
              {meta.loading ? "Loading more leaderboard..." : "Load more leaderboard"}
            </Button>
          </div>
        )}
        <div ref={loadMoreRef} aria-hidden="true" className="h-2" />
      </div>
    </div>
  );
}
