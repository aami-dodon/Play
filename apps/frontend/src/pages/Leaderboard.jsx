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
import { fetchGlobalLeaderboard } from "@/client";
import { formatLeaderboardRows } from "@/lib/leaderboard";
import { readLocalPlayerName } from "@/lib/playedChallenges";
import { texts } from "@/texts";
import { Button } from "@/components/ui/button";

const LEADERBOARD_FILTERS = texts.leaderboard.filters;
const LEADERBOARD_FILTER_PERIOD = LEADERBOARD_FILTERS.reduce((map, filter) => {
  const normalized = filter.toLowerCase();
  if (normalized.includes("today")) {
    map[filter] = "today";
  } else if (normalized.includes("week")) {
    map[filter] = "week";
  } else {
    map[filter] = undefined;
  }
  return map;
}, {});
const LEADERBOARD_PAGE_SIZE = 15;
const HIGHLIGHT_PLAYER_NAME = "GlitchQueen";

const createFilterState = () => ({
  entries: [],
  challengeLookup: {},
  meta: { loading: false, hasMore: true, error: "" },
});

export default function Leaderboard() {
  const [leaderboardsByFilter, setLeaderboardsByFilter] = useState(() =>
    LEADERBOARD_FILTERS.reduce((acc, filter) => {
      acc[filter] = createFilterState();
      return acc;
    }, {})
  );
  const [activeFilter, setActiveFilter] = useState(LEADERBOARD_FILTERS[0]);
  const [localPlayerName, setLocalPlayerName] = useState(null);
  const paginationRefs = useRef(
    LEADERBOARD_FILTERS.reduce((acc, filter) => {
      acc[filter] = { offset: 0, hasMore: true, loading: false };
      return acc;
    }, {})
  );
  const loadMoreRef = useRef(null);
  const isMountedRef = useRef(true);

  const safeSetState = useCallback((setter, value) => {
    if (!isMountedRef.current) return;
    setter(value);
  }, []);

  const fetchLeaderboardPage = useCallback(
    async (filter, { reset = false } = {}) => {
      if (!filter || !LEADERBOARD_FILTERS.includes(filter)) return;

      const pagination = paginationRefs.current[filter];
      if (!pagination) return;
      if (!reset && !pagination.hasMore) return;
      if (pagination.loading) return;

      const offset = reset ? 0 : pagination.offset;
      const periodParam = LEADERBOARD_FILTER_PERIOD[filter];

      pagination.loading = true;
      safeSetState(setLeaderboardsByFilter, (prev) => {
        const prevFilterState = prev[filter] ?? createFilterState();
        return {
          ...prev,
          [filter]: {
            ...prevFilterState,
            meta: {
              ...prevFilterState.meta,
              loading: true,
              error: reset ? "" : prevFilterState.meta.error,
            },
          },
        };
      });

      try {
        const payload = await fetchGlobalLeaderboard({
          limit: LEADERBOARD_PAGE_SIZE,
          offset,
          ...(periodParam ? { period: periodParam } : {}),
        });
        const items = Array.isArray(payload?.entries) ? payload.entries : [];
        const hasMore =
          typeof payload?.hasMore === "boolean"
            ? payload?.hasMore
            : items.length === LEADERBOARD_PAGE_SIZE;
        const nextOffset =
          typeof payload?.nextOffset === "number" ? payload.nextOffset : offset + items.length;

        pagination.hasMore = hasMore;
        pagination.offset = nextOffset;

        safeSetState(setLeaderboardsByFilter, (prev) => {
          const prevFilterState = prev[filter] ?? createFilterState();
          return {
            ...prev,
            [filter]: {
              entries: reset ? items : [...prevFilterState.entries, ...items],
              challengeLookup: payload?.challengeLookup ?? prevFilterState.challengeLookup,
              meta: {
                loading: false,
                hasMore,
                error: "",
              },
            },
          };
        });
      } catch (err) {
        console.error(`Failed to load ${filter} leaderboard:`, err);
        pagination.hasMore = false;
        safeSetState(setLeaderboardsByFilter, (prev) => {
          const prevFilterState = prev[filter] ?? createFilterState();
          return {
            ...prev,
            [filter]: {
              ...prevFilterState,
              meta: {
                ...prevFilterState.meta,
                loading: false,
                error: texts.leaderboard.fallbackCaption,
              },
            },
          };
        });
      } finally {
        pagination.loading = false;
      }
    },
    [safeSetState]
  );

  useEffect(() => {
    const currentFilter = leaderboardsByFilter[activeFilter];
    if (!currentFilter) return;
    if (
      currentFilter.entries.length === 0 &&
      !currentFilter.meta.loading &&
      currentFilter.meta.hasMore
    ) {
      fetchLeaderboardPage(activeFilter, { reset: true });
    }
  }, [activeFilter, leaderboardsByFilter, fetchLeaderboardPage]);

  useEffect(() => {
    setLocalPlayerName(readLocalPlayerName());
  }, [readLocalPlayerName]);

  const loadMoreElement = loadMoreRef.current;
  useEffect(() => {
    if (!loadMoreElement) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const pagination = paginationRefs.current[activeFilter];
        if (entry.isIntersecting && pagination && pagination.hasMore && !pagination.loading) {
          fetchLeaderboardPage(activeFilter);
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [activeFilter, fetchLeaderboardPage, loadMoreElement]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const entriesByFilter = useMemo(() => {
    return LEADERBOARD_FILTERS.reduce((acc, filter) => {
      const formatted = formatLeaderboardRows(leaderboardsByFilter[filter]?.entries ?? [], {
        fallbackCategory: "Arcade",
      });
      acc[filter] = formatted;
      return acc;
    }, {});
  }, [leaderboardsByFilter]);

  const allTimeFilter = LEADERBOARD_FILTERS[0];
  const baseRows = entriesByFilter[allTimeFilter] ?? [];
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

  const activeFilterState = leaderboardsByFilter[activeFilter] ?? createFilterState();

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

      <Tabs
        value={activeFilter}
        onValueChange={(value) => {
          if (LEADERBOARD_FILTERS.includes(value)) {
            setActiveFilter(value);
          }
        }}
        className="space-y-4"
      >
        <TabsList>
          {LEADERBOARD_FILTERS.map((filter) => (
            <TabsTrigger key={filter} value={filter}>
              {filter}
            </TabsTrigger>
          ))}
        </TabsList>
        {LEADERBOARD_FILTERS.map((filter) => {
          const filterState = leaderboardsByFilter[filter] ?? createFilterState();
          const players = entriesByFilter[filter] ?? [];
          const isLoading = filterState.meta.loading;
          const isAllTime = filter === allTimeFilter;
          const caption = isAllTime && filterState.meta.error ? filterState.meta.error : undefined;

          return (
            <TabsContent key={filter} value={filter}>
              {isLoading ? (
                <Card className="border-border/70 bg-card/95 p-6 text-sm text-muted-foreground">
                  Loading {filter.toLowerCase()} leaderboard...
                </Card>
              ) : (
                <LeaderboardTable
                  title={`${filter} leaderboard`}
                  subtitle={isAllTime ? "Legends only." : "Still counts."}
                  players={players}
                  highlightPlayer={leaderboardSummary.highlightPlayer}
                  caption={caption}
                  challengeLookup={filterState.challengeLookup}
                />
              )}
            </TabsContent>
          );
        })}
      </Tabs>
      <div className="space-y-3">
        {activeFilterState.meta.hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => fetchLeaderboardPage(activeFilter)}
              disabled={activeFilterState.meta.loading}
            >
              {activeFilterState.meta.loading ? "Loading more leaderboard..." : "Load more leaderboard"}
            </Button>
          </div>
        )}
        <div ref={loadMoreRef} aria-hidden="true" className="h-2" />
      </div>
    </div>
  );
}
