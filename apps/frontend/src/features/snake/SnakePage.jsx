import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Timer } from "lucide-react";
import { toast } from "sonner";

import GameplayLayout from "@/components/GameplayLayout";
import GameplaySidebarCard from "@/components/GameplaySidebarCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { submitSnakeScore } from "@/client";
import { readLocalPlayerName, saveLocalPlayerName } from "@/lib/playedChallenges";
import { texts } from "@/texts";

import SnakeBoard from "./SnakeBoard.jsx";

const BOARD_WIDTH = 18;
const BOARD_HEIGHT = 16;
const TOTAL_CELLS = BOARD_WIDTH * BOARD_HEIGHT;
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

const formatTime = (rawSeconds) => {
  const safeSeconds = Number.isFinite(rawSeconds) ? Math.max(0, Math.floor(rawSeconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function SnakePage() {
  const navigate = useNavigate();
  const [snake, setSnake] = useState(() => createInitialSnake());
  const [food, setFood] = useState(() => getRandomFoodPosition(createInitialSnake()));
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [status, setStatus] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [alias, setAlias] = useState(() => readLocalPlayerName() || "");
  const [submitting, setSubmitting] = useState(false);
  const [finalStats, setFinalStats] = useState(null);
  const [foodDelay, setFoodDelay] = useState(FOOD_INITIAL_DELAY);
  const [growthCycle, setGrowthCycle] = useState(0);
  const [gameOverDialogOpen, setGameOverDialogOpen] = useState(false);
  const [isTouchMobile, setIsTouchMobile] = useState(false);
  const maxLengthRef = useRef(createInitialSnake().length);

  const elapsedRef = useRef(elapsed);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const mediaQuery = window.matchMedia("(pointer: coarse) and (max-width: 768px)");
    const updateIsTouchMobile = () => setIsTouchMobile(mediaQuery.matches);
    updateIsTouchMobile();
    const addListener = mediaQuery.addEventListener ? "addEventListener" : "addListener";
    const removeListener = mediaQuery.removeEventListener ? "removeEventListener" : "removeListener";
    if (addListener === "addEventListener") {
      mediaQuery.addEventListener("change", updateIsTouchMobile);
    } else {
      mediaQuery.addListener(updateIsTouchMobile);
    }
    return () => {
      if (removeListener === "removeEventListener") {
        mediaQuery.removeEventListener("change", updateIsTouchMobile);
      } else {
        mediaQuery.removeListener(updateIsTouchMobile);
      }
    };
  }, []);

  const endRun = useCallback(() => {
    setStatus("over");
    setFinalStats({ score: maxLengthRef.current, time: elapsedRef.current });
    setFood(null);
  }, []);

  const recordMaxLength = useCallback((length) => {
    maxLengthRef.current = Math.max(maxLengthRef.current, length);
  }, []);

  const startRun = useCallback(() => {
    const initialSnake = createInitialSnake();
    setSnake(initialSnake);
    setDirection({ x: 1, y: 0 });
    setFood(getRandomFoodPosition(initialSnake));
    setElapsed(0);
    setStatus("running");
    setFinalStats(null);
    setFoodDelay(FOOD_INITIAL_DELAY);
    setGrowthCycle(0);
    setGameOverDialogOpen(false);
    maxLengthRef.current = initialSnake.length;
  }, []);

  const handleSubmitScore = useCallback(async () => {
    if (!finalStats) return;
    const trimmedAlias = alias.trim();
    if (!trimmedAlias) return;
    setSubmitting(true);
    try {
      await submitSnakeScore({
        username: trimmedAlias,
        score: finalStats.score,
        completion_time_seconds: finalStats.time,
      });
      saveLocalPlayerName(trimmedAlias);
      toast.success("Score posted to the leaderboard.");
      setGameOverDialogOpen(false);
      navigate(
        `/results/snake-arcade?score=${finalStats.score}&time=${finalStats.time}&total=${TOTAL_CELLS}`
      );
    } catch (error) {
      console.error("Snake leaderboard submission failed:", error);
      toast.error("Leaderboard update failed - give it another shot.");
    } finally {
      setSubmitting(false);
    }
  }, [alias, finalStats, navigate]);

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
          endRun();
          return currentSnake;
        }

        const collisionBody = currentSnake.slice(0, -1);
        const hitsSelf = collisionBody.some(
          (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
        );
        if (hitsSelf) {
          endRun();
          return currentSnake;
        }

        const nextSnake = [nextHead, ...currentSnake];
        nextSnake.pop();
        recordMaxLength(nextSnake.length);

        if (food && nextHead.x === food.x && nextHead.y === food.y) {
          const trimmed = nextSnake.slice(0, Math.max(0, nextSnake.length - 2));
          if (trimmed.length === 0) {
            endRun();
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
  }, [direction, food, status, endRun, recordMaxLength]);

  useEffect(() => {
    if (status !== "running") return undefined;
    const growthTimer = window.setTimeout(() => {
      setSnake((currentSnake) => {
        if (!currentSnake.length) return currentSnake;
        const tail = currentSnake[currentSnake.length - 1];
        if (!tail) return currentSnake;
        const grown = [...currentSnake, { ...tail }];
        recordMaxLength(grown.length);
        return grown;
      });
      setGrowthCycle((value) => value + 1);
    }, GROWTH_INTERVAL_MS);
    return () => window.clearTimeout(growthTimer);
  }, [status, growthCycle, recordMaxLength]);

  useEffect(() => {
    if (status !== "running" || !food || snake.length === 0) return undefined;
    const tracker = window.setTimeout(() => {
      const head = snake[0];
      const nextFood = moveFoodTowardsSnake(food, head);
      const caught = snake.some(
        (segment) => segment.x === nextFood.x && segment.y === nextFood.y,
      );

      if (caught) {
        toast.error(
          isTouchMobile
            ? "The hunter food devoured you—lose two segments and keep evading."
            : "Hunter food caught you—lose two segments and keep dodging.",
        );
        const trimmed = snake.slice(0, Math.max(0, snake.length - 2));
        if (trimmed.length === 0) {
          setSnake(trimmed);
          endRun();
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
  }, [status, food, snake, foodDelay, endRun, isTouchMobile]);

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
  const lastRunLabel =
    finalStats && status === "over"
      ? `${isTouchMobile ? "Longest chase" : "Last chase"} · ${finalStats.score} lengths · ${formatTime(
          finalStats.time,
        )}`
      : isTouchMobile
        ? "Keep evading the hungry food to stretch your tail."
        : "Keep dodging to grow your tail.";

  const statusLabel = status === "running" ? "Live chase" : status === "over" ? "Humbled" : "Waiting";
  const statusVariant = status === "running" ? "secondary" : "outline";
  const fillPercentage = Math.min(100, Math.round((currentScore / TOTAL_CELLS) * 100));
  const timerSeconds = status === "over" && finalStats ? finalStats.time : elapsed;
  const timerDisplay = formatTime(timerSeconds);
  const timerLabel = status === "over" ? "Final time" : "Time alive";
  const timerHelper =
    status === "running" ? "Live chase" : status === "over" ? "Last run logged" : "Ready to launch";
  const footerCopy = isTouchMobile
    ? "Master the grid. The hungry food keeps closing in, and the arena still has that familiar swagger."
    : "Master the grid. The hunter keeps closing. Same arena, same swagger as every challenge.";

  const sidebar = (
    <>
      <GameplaySidebarCard label={texts.challenge.scoreLabel}>
        <p className="text-4xl font-semibold text-foreground">{currentScore}</p>
        <p className="text-sm text-muted-foreground">Out of {TOTAL_CELLS} cells</p>
      </GameplaySidebarCard>

      <GameplaySidebarCard
        label={
          <>
            <span>{timerLabel}</span>
            <Timer className="size-4" />
          </>
        }
        labelClassName="flex items-center justify-between text-muted-foreground"
      >
        <p className="font-mono text-4xl">{timerDisplay}</p>
        <p className="text-xs text-muted-foreground">{timerHelper}</p>
      </GameplaySidebarCard>

      <GameplaySidebarCard
        label={
          <>
            <span>{texts.challenge.progressLabel}</span>
            <span>
              {currentScore}/{TOTAL_CELLS}
            </span>
          </>
        }
        labelClassName="flex items-center justify-between text-muted-foreground"
      >
        <Progress value={fillPercentage} />
        <p className="text-sm font-semibold text-muted-foreground">
          {fillPercentage}% grid control
        </p>
      </GameplaySidebarCard>
    </>
  );

  const playButtonLabel = status === "over" ? "Play again" : "Play run";
  const showPlayOverlay = status !== "running";

  return (
    <GameplayLayout sidebar={sidebar} sidebarWrapperClassName="sm:grid-cols-1">
      <Card className="flex flex-1 flex-col border-border/70 bg-card/95 lg:overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.45em] text-muted-foreground">
            <span className="rounded-full border border-border/40 bg-muted/10 px-3 py-1 text-[9px]">
              Games
            </span>
            <span className="rounded-full border border-border/40 bg-muted/10 px-3 py-1 text-[9px]">
              Snake
            </span>
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
            <div className="relative aspect-square w-full rounded-2xl border border-white/10 bg-slate-950/40 p-2 transition">
              <SnakeBoard width={BOARD_WIDTH} height={BOARD_HEIGHT} snake={snake} food={food} />
              {showPlayOverlay && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.1rem] bg-background/80 backdrop-blur-sm dark:bg-background/60">
                  <Button size="lg" className="rounded-full px-8" onClick={startRun}>
                    {playButtonLabel}
                  </Button>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                    Tap play or use WASD/arrow keys
                  </p>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{footerCopy}</p>
        </CardContent>
      </Card>
      <Dialog open={gameOverDialogOpen} onOpenChange={setGameOverDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Game over</DialogTitle>
            <DialogDescription>
              Drop an alias to log this run and see the full recap page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Ego: <span className="font-semibold text-foreground">{finalStats?.score ?? snake.length}</span>
            </p>
            <p>
              Time:{" "}
              <span className="font-semibold text-foreground">
                {formatTime(finalStats?.time ?? elapsed)}
              </span>
            </p>
            <Input
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              placeholder="Alias for the leaderboard"
              autoFocus
            />
            <p className="text-xs">
              Once logged, we’ll send you to the detailed results screen to flex properly.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGameOverDialogOpen(false)}
            >
              Maybe later
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full px-6"
              onClick={handleSubmitScore}
              disabled={submitting || !alias.trim() || !finalStats}
            >
              {submitting ? "Logging..." : "Log survival"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GameplayLayout>
  );
}
