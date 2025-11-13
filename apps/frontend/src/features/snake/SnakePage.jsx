import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchSnakeLeaderboard, submitSnakeScore } from "@/client";
import { readLocalPlayerName, saveLocalPlayerName } from "@/lib/playedChallenges";
import { cn } from "@/lib/utils";

import SnakeBoard from "./SnakeBoard.jsx";

const BOARD_WIDTH = 18;
const BOARD_HEIGHT = 16;
const LEADERBOARD_PAGE_SIZE = 12;
const INITIAL_TICK_DELAY = 220;
const MIN_TICK_DELAY = 90;
const SPEED_STEP = 8;

const KEY_TO_DIRECTION = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

const createInitialSnake = () => {
  const originX = Math.floor(BOARD_WIDTH / 2);
  const originY = Math.floor(BOARD_HEIGHT / 2);
  return [
    { x: originX, y: originY },
    { x: originX - 1, y: originY },
    { x: originX - 2, y: originY },
  ];
};

const getRandomFoodPosition = (snake) => {
  const occupied = new Set(snake.map((segment) => `${segment.x}:${segment.y}`));
  const candidates = [];
  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const coordinate = `${x}:${y}`;
      if (!occupied.has(coordinate)) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
};

const formatTime = (seconds) => `${seconds}s`;

export default function SnakePage() {
  const [snake, setSnake] = useState(() => createInitialSnake());
  const [food, setFood] = useState(() => getRandomFoodPosition(createInitialSnake()));
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [tickDelay, setTickDelay] = useState(INITIAL_TICK_DELAY);
  const [status, setStatus] = useState("idle");
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [alias, setAlias] = useState(() => readLocalPlayerName() || "");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalStats, setFinalStats] = useState(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");

  const scoreRef = useRef(score);
  const elapsedRef = useRef(elapsed);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  const startRun = useCallback(() => {
    const originatingSnake = createInitialSnake();
    setSnake(originatingSnake);
    setDirection({ x: 1, y: 0 });
    setFood(getRandomFoodPosition(originatingSnake));
    setScore(0);
    setElapsed(0);
    setTickDelay(INITIAL_TICK_DELAY);
    setStatus("running");
    setFinalStats(null);
    setScoreSubmitted(false);
    setLeaderboardError("");
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      const entries = await fetchSnakeLeaderboard(LEADERBOARD_PAGE_SIZE);
      setLeaderboardEntries(Array.isArray(entries) ? entries : []);
    } catch (error) {
      console.error("Failed to load snake leaderboard:", error);
      setLeaderboardError("Leaderboard is taking a moment. Try refreshing.");
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  const handleSubmitScore = useCallback(async () => {
    if (!finalStats || !alias.trim()) return;
    setSubmitting(true);
    try {
      await submitSnakeScore({
        username: alias.trim(),
        score: finalStats.score,
        completion_time_seconds: finalStats.time,
      });
      saveLocalPlayerName(alias.trim());
      setScoreSubmitted(true);
      toast.success("Score posted to the leaderboard.");
      loadLeaderboard();
    } catch (error) {
      console.error("Snake leaderboard submission failed:", error);
      toast.error("Leaderboard update failed - give it another shot.");
    } finally {
      setSubmitting(false);
    }
  }, [alias, finalStats, loadLeaderboard]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (status !== "running") return undefined;
    const heartbeat = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(heartbeat);
  }, [status]);

  useEffect(() => {
    if (status !== "running") return undefined;
    const timer = window.setTimeout(() => {
      const head = snake[0];
      if (!head) return;
      const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
      const hitsWall =
        nextHead.x < 0 ||
        nextHead.x >= BOARD_WIDTH ||
        nextHead.y < 0 ||
        nextHead.y >= BOARD_HEIGHT;
      const willEat = Boolean(food && nextHead.x === food.x && nextHead.y === food.y);
      const collisionBody = willEat ? snake : snake.slice(0, -1);
      const hitsSelf = collisionBody.some(
        (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
      );

      if (hitsWall || hitsSelf) {
        setStatus("over");
        setFinalStats({
          score: scoreRef.current,
          time: elapsedRef.current,
        });
        setFood(null);
        return;
      }

      const nextSnake = [nextHead, ...snake];
      if (!willEat) {
        nextSnake.pop();
      }
      setSnake(nextSnake);

      if (willEat) {
        const nextScore = scoreRef.current + 1;
        setScore(nextScore);
        setTickDelay((prev) => Math.max(MIN_TICK_DELAY, prev - SPEED_STEP));
        const nextFood = getRandomFoodPosition(nextSnake);
        if (nextFood) {
          setFood(nextFood);
        } else {
          setFood(null);
          setStatus("over");
          setFinalStats({
            score: nextScore,
            time: elapsedRef.current,
          });
        }
      }
    }, tickDelay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [direction, food, snake, status, tickDelay]);

  const handleKeyDown = useCallback(
    (event) => {
      const key = event.key;
      const requestedDirection = KEY_TO_DIRECTION[key] || KEY_TO_DIRECTION[key.toLowerCase()];
      if (!requestedDirection) return;
      event.preventDefault();
      setDirection((current) => {
        if (current.x + requestedDirection.x === 0 && current.y + requestedDirection.y === 0) {
          return current;
        }
        return requestedDirection;
      });
      if (status !== "running") {
        startRun();
      }
    },
    [startRun, status],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const occupancyPercent = useMemo(() => {
    const maxCells = BOARD_WIDTH * BOARD_HEIGHT;
    return Math.min(100, Math.round((snake.length / maxCells) * 100));
  }, [snake.length]);

  const lastRunLabel =
    finalStats && status === "over"
      ? `Last run · ${finalStats.score} pts · ${formatTime(finalStats.time)}`
      : "Get a run going to post your name.";

  const statusLabel =
    status === "running" ? "Live" : status === "over" ? "Game over" : "Anticipating";

  const statusVariant = status === "running" ? "secondary" : "outline";

  const highlightName = alias.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl">Snake Arcade Sprint</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Fast-paced snake action with a leaderboard that remembers every crash.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Use the arrow keys or WASD to steer. Eat the neon fruit to grow and speed up.</p>
          <p>
            Every collision with a wall or tail ends the run – type your alias once you top your
            high score.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
        <div className="space-y-4">
          <Card className="border-border/70 bg-card/95">
            <CardHeader className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>Current run</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {lastRunLabel}
                </CardDescription>
              </div>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mx-auto w-full max-w-[420px]">
                <div className="aspect-square w-full rounded-2xl border border-white/10 bg-slate-950/40 p-2 transition">
                  <SnakeBoard width={BOARD_WIDTH} height={BOARD_HEIGHT} snake={snake} food={food} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs uppercase tracking-[0.4em] text-muted-foreground">
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-foreground">{score}</p>
                  <p>Score</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-foreground">{formatTime(elapsed)}</p>
                  <p>Time</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-foreground">{snake.length}</p>
                  <p>Length</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Board tension</span>
                  <span>{snake.length}/{BOARD_WIDTH * BOARD_HEIGHT}</span>
                </div>
                <Progress value={occupancyPercent} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="rounded-full px-8" onClick={startRun}>
                  {status === "running" ? "Restart run" : "Start run"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-6"
                  onClick={() => setDirection({ x: 1, y: 0 })}
                >
                  Re-center controls
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Controls locked during runs - be ready before you ignite the tail.
              </p>
            </CardContent>
          </Card>

          {status === "over" && finalStats && (
            <Card className="border-border/60 bg-popover/80">
              <CardHeader>
                <CardTitle>Share the brag</CardTitle>
                <CardDescription>
                  Score: {finalStats.score} · Time: {formatTime(finalStats.time)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={alias}
                  onChange={(event) => setAlias(event.target.value)}
                  placeholder="Alias for the leaderboard"
                  className="text-sm"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="rounded-full px-8"
                    onClick={handleSubmitScore}
                    disabled={
                      submitting || !alias.trim() || scoreSubmitted || !finalStats
                    }
                  >
                    {scoreSubmitted ? "Score posted" : submitting ? "Posting..." : "Post score"}
                  </Button>
                  {scoreSubmitted && <Badge variant="outline">Logged</Badge>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/95">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Snake leaderboard</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Top {LEADERBOARD_PAGE_SIZE} runs
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={loadLeaderboard} disabled={leaderboardLoading}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboardError && (
                <p className="text-xs text-destructive">{leaderboardError}</p>
              )}
              {leaderboardLoading ? (
                <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
              ) : leaderboardEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No runs recorded yet. Be the first to feed the snake.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboardEntries.map((entry, index) => {
                      const rank = entry.rank ?? index + 1;
                      const isSelf =
                        highlightName &&
                        entry.username?.toLowerCase() === highlightName;
                      return (
                        <TableRow
                          key={`${entry.username ?? "player"}-${rank}`}
                          className={cn(isSelf && "bg-primary/10")}
                        >
                          <TableCell>{rank}</TableCell>
                          <TableCell>{entry.username || "Anonymous"}</TableCell>
                          <TableCell>{entry.score ?? 0}</TableCell>
                          <TableCell>
                            {entry.completion_time_seconds != null
                              ? `${entry.completion_time_seconds}s`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-popover/80">
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Avoid quick direction flips - your tail can catch up faster than you think.</p>
              <p>Speed increases after every fruit, so plan a safe loop.</p>
              <p>Only named runs make the leaderboard, so drop an alias after each crash.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
