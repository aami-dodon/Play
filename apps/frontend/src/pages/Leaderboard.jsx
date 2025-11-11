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
import { readLocalPlayerName } from "@/lib/playedChallenges";
import { texts } from "@/texts";
import { Button } from "@/components/ui/button";

const LEADERBOARD_PAGE_SIZE = 15;
const HIGHLIGHT_PLAYER_NAME = "GlitchQueen";

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [localPlayerName, setLocalPlayerName] = useState(null);
  const [meta, setMeta] = useState({ loading: true, hasMore: true, error: "" });
  const [challengeLookup, setChallengeLookup] = useState({});
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
        const lookupEntries = normalized.challengeLookup ?? {};
        if (reset) {
          safeSetState(setEntries, () => items);
        } else {
          safeSetState(setEntries, (prev) => [...prev, ...items]);
        }
        safeSetState(setChallengeLookup, () => lookupEntries);

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
    safeSetState(setChallengeLookup, () => ({}));
    fetchLeaderboardPage({ reset: true });
  }, [fetchLeaderboardPage, safeSetState]);

  useEffect(() => {
    setLocalPlayerName(readLocalPlayerName());
  }, [readLocalPlayerName]);

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

  const highlightPlayerName = localPlayerName || HIGHLIGHT_PLAYER_NAME;

  const leaderboardSummary = useMemo(() => {
    const totalPlayers = baseRows.length;
    if (totalPlayers === 0) {
      return {
        highlightPlayer: highlightPlayerName,
        currentRank: null,
        beatCount: null,
        totalPlayers: 0,
      };
    }

    const highlightIsFallback = highlightPlayerName === HIGHLIGHT_PLAYER_NAME;
    const preferredRow =
      baseRows.find((player) => player.player === highlightPlayerName) ||
      (highlightIsFallback ? baseRows[0] : null);

    if (!preferredRow) {
      return {
        highlightPlayer: highlightPlayerName,
        currentRank: null,
        beatCount: null,
        totalPlayers,
      };
    }
    const derivedRank =
      typeof preferredRow?.rank === "number" && Number.isFinite(preferredRow.rank) && preferredRow.rank > 0
        ? preferredRow.rank
        : baseRows.indexOf(preferredRow) + 1;
    const beatCount =
      typeof derivedRank === "number" ? Math.max(totalPlayers - derivedRank, 0) : null;

    return {
      highlightPlayer: preferredRow.player,
      currentRank: derivedRank,
      beatCount,
      totalPlayers,
    };
  }, [baseRows, highlightPlayerName]);

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
            Current rank · {leaderboardSummary.currentRank ? `#${leaderboardSummary.currentRank}` : "—"}
          </Badge>
          <Badge variant="outline" className="rounded-full px-4">
            {leaderboardSummary.beatCount != null
              ? `Congrats, you beat ${leaderboardSummary.beatCount} people! Out of ${
                  leaderboardSummary.totalPlayers > 0 ? leaderboardSummary.totalPlayers : "—"
                }.`
              : "Crunching leaderboard stats to flex your rank."}
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
              <Card className="border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
                Loading {filter.toLowerCase()} leaderboard...
              </Card>
            ) : (
              <LeaderboardTable
                title={`${filter} leaderboard`}
                subtitle={filter === "All Time" ? "Legends only." : "Still counts."}
                players={leaderboardByFilter[filter] || []}
                highlightPlayer={leaderboardSummary.highlightPlayer}
                caption={filter === "All Time" && meta.error ? meta.error : undefined}
                challengeLookup={challengeLookup}
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
