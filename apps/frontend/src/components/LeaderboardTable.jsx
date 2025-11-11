import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import ChallengeCombobox from "./ChallengeCombobox";

const FALLBACK_CATEGORY_LABEL = "Uncategorized";
const FALLBACK_CHALLENGE_LABEL = "Mystery challenge";
const ALL_CATEGORIES_OPTION = "all";

export default function LeaderboardTable({
  title,
  subtitle,
  players = [],
  highlightPlayer,
  caption,
  compact,
  challengeLookup = {},
}) {
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES_OPTION);
  const [challengeFilter, setChallengeFilter] = useState("");

  const hasCategoryScoreSupport = useMemo(
    () => players.some((entry) => Object.keys(entry.categoryScores || {}).length > 0),
    [players]
  );
  const hasChallengeScoreSupport = useMemo(
    () => players.some((entry) => Object.keys(entry.challengeScores || {}).length > 0),
    [players]
  );

  const showFilters = hasCategoryScoreSupport || hasChallengeScoreSupport;

  const categoryOptions = useMemo(() => {
    if (!hasCategoryScoreSupport) return [];
    const unique = new Set();
    players.forEach((player) => {
      const scores = player.categoryScores;
      if (!scores) return;
      Object.keys(scores).forEach((category) => {
        unique.add(category);
      });
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [players, hasCategoryScoreSupport]);

  const challengeOptions = useMemo(() => {
    if (!hasChallengeScoreSupport) return [];
    const unique = new Set();
    players.forEach((player) => {
      const scores = player.challengeScores;
      if (!scores) return;
      Object.keys(scores).forEach((slug) => {
        unique.add(slug);
      });
    });
    return Array.from(unique)
      .map((slug) => ({
        value: slug,
        label: challengeLookup[slug] || slug || FALLBACK_CHALLENGE_LABEL,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [players, challengeLookup, hasChallengeScoreSupport]);

  useEffect(() => {
    if (!hasCategoryScoreSupport || categoryFilter === ALL_CATEGORIES_OPTION) return;
    if (!categoryOptions.includes(categoryFilter)) {
      setCategoryFilter(ALL_CATEGORIES_OPTION);
    }
  }, [categoryFilter, categoryOptions, hasCategoryScoreSupport]);

  useEffect(() => {
    if (!hasChallengeScoreSupport || !challengeFilter) return;
    if (!challengeOptions.some((option) => option.value === challengeFilter)) {
      setChallengeFilter("");
    }
  }, [challengeFilter, challengeOptions, hasChallengeScoreSupport]);

  const getCategoryScore = (entry, categoryKey) =>
    (entry.categoryScores?.[categoryKey ?? ""] ?? 0);

  const getChallengeScore = (entry, slug) => entry.challengeScores?.[slug ?? ""] ?? 0;

  const filteredPlayers = useMemo(() => {
    if (!showFilters) {
      return players.map((entry) => ({
        ...entry,
        displayScore: entry.score ?? 0,
      }));
    }

    const computed = players
      .map((entry) => {
        const categoryScore =
          categoryFilter === ALL_CATEGORIES_OPTION
            ? null
            : getCategoryScore(entry, categoryFilter);
        const challengeScore = challengeFilter ? getChallengeScore(entry, challengeFilter) : null;
        const displayScore =
          challengeFilter
            ? challengeScore
            : categoryFilter === ALL_CATEGORIES_OPTION
              ? entry.score ?? 0
              : categoryScore;

        return {
          entry,
          displayScore: typeof displayScore === "number" ? displayScore : 0,
        };
      })
      .filter(({ displayScore }) => {
        if (challengeFilter) return displayScore > 0;
        if (categoryFilter !== ALL_CATEGORIES_OPTION) return displayScore > 0;
        return true;
      })
      .sort((a, b) => {
        if (b.displayScore !== a.displayScore) return b.displayScore - a.displayScore;
        return (a.entry.player || "").localeCompare(b.entry.player || "");
      })
      .map(({ entry, displayScore }, index) => ({
        ...entry,
        displayScore,
        sortRank: index + 1,
      }));

    return computed;
  }, [players, showFilters, categoryFilter, challengeFilter]);

  const hasPlayers = players.length > 0;
  const hasFilteredPlayers = filteredPlayers.length > 0;
  const filtersActive =
    showFilters && (categoryFilter !== ALL_CATEGORIES_OPTION || Boolean(challengeFilter));

  const resetFilters = () => {
    setCategoryFilter(ALL_CATEGORIES_OPTION);
    setChallengeFilter("");
  };

  return (
    <Card className="border-border/70 bg-card/95">
      {(title || subtitle) && (
        <CardHeader>
          {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={compact ? "px-4" : undefined}>
        {hasPlayers && showFilters && (categoryOptions.length > 0 || challengeOptions.length > 0) && (
          <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {categoryOptions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between rounded-full lg:w-48"
                    >
                      {categoryFilter === ALL_CATEGORIES_OPTION ? "All categories" : categoryFilter}
                      <ChevronDown className="ml-2 size-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <DropdownMenuRadioItem value={ALL_CATEGORIES_OPTION}>
                        All categories
                      </DropdownMenuRadioItem>
                      {categoryOptions.map((option) => (
                        <DropdownMenuRadioItem key={option} value={option}>
                          {option}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {challengeOptions.length > 0 && (
                <ChallengeCombobox
                  value={challengeFilter}
                  onValueChange={setChallengeFilter}
                  options={challengeOptions}
                  triggerClassName="w-full justify-between rounded-full lg:w-64"
                />
              )}
            </div>
            {filtersActive && (
              <Button variant="ghost" size="sm" className="self-start rounded-full" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>
        )}
        {!hasPlayers ? (
          <p className="text-sm text-muted-foreground">No bragging rights yet.</p>
        ) : !hasFilteredPlayers ? (
          <p className="text-sm text-muted-foreground">Nothing matches those filters.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((entry, index) => (
                <TableRow
                  key={`${entry.player}-${index}`}
                  data-state={
                    highlightPlayer && entry.player === highlightPlayer ? "selected" : undefined
                  }
                >
                  <TableCell className="font-semibold text-muted-foreground">
                    {entry.sortRank ?? entry.rank ?? index + 1}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{entry.player}</TableCell>
                  <TableCell className="text-primary font-semibold">
                    {entry.displayScore ?? entry.score ?? 0}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full px-3 text-xs">
                      {entry.category || FALLBACK_CATEGORY_LABEL}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.challengeName || FALLBACK_CHALLENGE_LABEL}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {caption && <TableCaption>{caption}</TableCaption>}
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
