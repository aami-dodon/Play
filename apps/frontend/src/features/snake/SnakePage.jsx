import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
const SNAKE_TICK_DELAY = 180;
const FOOD_INITIAL_DELAY = 520;
const FOOD_MIN_DELAY = 220;
const FOOD_ACCELERATION_STEP = 4;
const GROWTH_INTERVAL_MS = 5000;

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

const getRandomFoodPosition = (snakeSegments) => {
  const occupied = new Set(snakeSegments.map((segment) => `${segment.x}:${segment.y}`));
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

const moveFoodTowardsSnake = (currentFood, head) => {
  if (!currentFood || !head) {
    return currentFood;
  }

  const dx = head.x - currentFood.x;
  const dy = head.y - currentFood.y;
  if (dx === 0 && dy === 0) {
    return currentFood;
  }

  const step =
    Math.abs(dx) >= Math.abs(dy)
      ? { x: Math.sign(dx), y: 0 }
      : { x: 0, y: Math.sign(dy) };
  const nextX = Math.min(Math.max(0, currentFood.x + step.x), BOARD_WIDTH - 1);
  const nextY = Math.min(Math.max(0, currentFood.y + step.y), BOARD_HEIGHT - 1);
  return { x: nextX, y: nextY };
};

const formatTime = (seconds) => `${seconds}s`;

export default function SnakePage() {
  const [snake, setSnake] = useState(() => createInitialSnake());
  const [food, setFood] = useState(() => getRandomFoodPosition(createInitialSnake()));
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [status, setStatus] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [alias, setAlias] = useState(() => readLocalPlayerName() || "");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalStats, setFinalStats] = useState(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [foodDelay, setFoodDelay] = useState(FOOD_INITIAL_DELAY);
  const [growthCycle, setGrowthCycle] = useState(0);
  const [gameOverDialogOpen, setGameOverDialogOpen] = useState(false);

  const elapsedRef = useRef(elapsed);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  const endRun = useCallback(
    (finalLength) => {
      setStatus("over");
      setFinalStats({ score: finalLength, time: elapsedRef.current });
      setFood(null);
    },
    [],
  );

  const startRun = useCallback(() => {
    const initialSnake = createInitialSnake();
    setSnake(initialSnake);
    setDirection({ x: 1, y: 0 });
    setFood(getRandomFoodPosition(initialSnake));
    setElapsed(0);
    setStatus("running");
    setFinalStats(null);
    setScoreSubmitted(false);
    setLeaderboardError("");
    setFoodDelay(FOOD_INITIAL_DELAY);
    setGrowthCycle(0);
    setGameOverDialogOpen(false);
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
    if (status === "over" && finalStats) {
      setGameOverDialogOpen(true);
    }
  }, [status, finalStats]);

  useEffect(() => {
    if (status !== "running") return undefined;
    const timer = window.setTimeout(() => {
      setSnake((currentSnake) => {
        if (!currentSnake.length) {
          return currentSnake;
        }
        const head = currentSnake[0];
        const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
        const hitsWall =
          nextHead.x < 0 ||
          nextHead.x >= BOARD_WIDTH ||
          nextHead.y < 0 ||
          nextHead.y >= BOARD_HEIGHT;
        if (hitsWall) {
          endRun(currentSnake.length);
          return currentSnake;
        }

        const collisionBody = currentSnake.slice(0, -1);
        const hitsSelf = collisionBody.some(
          (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
        );
        if (hitsSelf) {
          endRun(currentSnake.length);
          return currentSnake;
        }

        const nextSnake = [nextHead, ...currentSnake];
        nextSnake.pop();

        if (food && nextHead.x === food.x && nextHead.y === food.y) {
          const trimmed = nextSnake.slice(0, Math.max(0, nextSnake.length - 2));
          if (trimmed.length === 0) {
            endRun(0);
            return trimmed;
          }
          setFood(getRandomFoodPosition(trimmed));
          setFoodDelay(FOOD_INITIAL_DELAY);
          return trimmed;
        }

        return nextSnake;
      });
    }, SNAKE_TICK_DELAY);

    return () => {
      window.clearTimeout(timer);
    };
  }, [direction, food, status, endRun]);

  useEffect(() => {
    if (status !== "running") return undefined;
    const growthTimer = window.setTimeout(() => {
      setSnake((currentSnake) => {
        if (!currentSnake.length) return currentSnake;
        const tail = currentSnake[currentSnake.length - 1];
        if (!tail) return currentSnake;
        return [...currentSnake, { ...tail }];
      });
      setGrowthCycle((value) => value + 1);
    }, GROWTH_INTERVAL_MS);
    return () => window.clearTimeout(growthTimer);
  }, [status, growthCycle]);

  useEffect(() => {
    if (status !== "running" || !food || snake.length === 0) return undefined;
      const tracker = window.setTimeout(() => {
        const head = snake[0];
        const nextFood = moveFoodTowardsSnake(food, head);
        const caught = snake.some(
          (segment) => segment.x === nextFood.x && segment.y === nextFood.y,
        );

        if (caught) {
          toast.error("Hunter food caught you—lose two segments and keep dodging.");
          const trimmed = snake.slice(0, Math.max(0, snake.length - 2));
          if (trimmed.length === 0) {
            setSnake(trimmed);
            endRun(0);
            return;
          }
          setSnake(trimmed);
        setFood(getRandomFoodPosition(trimmed));
        setFoodDelay(FOOD_INITIAL_DELAY);
        return;
      }

      setFood(nextFood);
      setFoodDelay((prev) => Math.max(FOOD_MIN_DELAY, prev - FOOD_ACCELERATION_STEP));
    }, foodDelay);

    return () => window.clearTimeout(tracker);
  }, [status, food, snake, foodDelay, endRun]);

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

  const currentScore = status === "over" && finalStats ? finalStats.score : snake.length;
  const currentTime = status === "over" && finalStats ? finalStats.time : elapsed;
  const lastRunLabel =
    finalStats && status === "over"
      ? `Last chase · ${finalStats.score} lengths · ${formatTime(finalStats.time)}`
      : "Keep dodging to grow your tail.";

  const statusLabel = status === "running" ? "Live chase" : status === "over" ? "Humbled" : "Waiting";
  const statusVariant = status === "running" ? "secondary" : "outline";
  const highlightName = alias.trim().toLowerCase();

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="space-y-4">
          <Card className="border-border/70 bg-card/95">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.45em] text-muted-foreground">
                <span className="rounded-full border border-border/40 bg-muted/10 px-3 py-1 text-[9px]">Games</span>
                <span className="rounded-full border border-border/40 bg-muted/10 px-3 py-1 text-[9px]">Snake</span>
                <span className="rounded-full border border-border/40 bg-muted/10 px-3 py-1 text-[9px]">
                  Evasion 01
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">Live chase</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{lastRunLabel}</CardDescription>
                </div>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mx-auto w-full max-w-[440px]">
                <div className="aspect-square w-full rounded-2xl border border-white/10 bg-slate-950/40 p-2 transition">
                  <SnakeBoard width={BOARD_WIDTH} height={BOARD_HEIGHT} snake={snake} food={food} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="rounded-full px-8" onClick={startRun}>
                  {status === "running" ? "Restart run" : "Start evasion run"}
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
              <p className="text-xs text-muted-foreground">Master the grid. The hunter keeps closing.</p>
            </CardContent>
          </Card>

          {status === "over" && finalStats && (
            <Card className="border-border/60 bg-popover/80">
              <CardHeader>
                <CardTitle>Log your survival</CardTitle>
                <CardDescription>
                  Ego {finalStats.score} · Time {formatTime(finalStats.time)}
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
                    {scoreSubmitted ? "Score logged" : submitting ? "Posting..." : "Post score"}
                  </Button>
                  {scoreSubmitted && <Badge variant="outline">Logged</Badge>}
                </div>
              </CardContent>
            </Card>
          )}
          <Dialog open={gameOverDialogOpen} onOpenChange={setGameOverDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Game over</DialogTitle>
                <DialogDescription>
                  The hunter finally caught you. Log your survival while the pain is fresh.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Ego: {finalStats?.score ?? snake.length}</p>
                <p>Time: {formatTime(finalStats?.time ?? elapsed)}</p>
              </div>
              <DialogFooter className="justify-end">
                <Button size="sm" onClick={() => setGameOverDialogOpen(false)}>
                  Log survival
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/95">
            <CardHeader className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Score</p>
              <CardTitle className="text-3xl font-semibold">{currentScore}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Ego is length—survive longer to grow fiercer.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardHeader className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Time</p>
              <CardTitle className="text-3xl font-semibold">{formatTime(currentTime)}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Seconds since you last dodged the hunter.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Progress</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={Math.min(100, Math.round((snake.length / (BOARD_WIDTH * BOARD_HEIGHT)) * 100))} />
              <p className="text-xs text-muted-foreground">
                {snake.length}/{BOARD_WIDTH * BOARD_HEIGHT} segments filled.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
