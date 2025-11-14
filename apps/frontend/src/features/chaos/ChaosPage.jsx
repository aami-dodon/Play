import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Gamepad2, Timer } from "lucide-react";
import { toast } from "sonner";

import GameplayLayout from "@/components/GameplayLayout";
import GameplaySidebarCard from "@/components/GameplaySidebarCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { submitChaosScore } from "@/client";
import { readLocalPlayerName, saveLocalPlayerName } from "@/lib/playedChallenges";

import ChaosBoard from "./ChaosBoard.jsx";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 18;
const CHAOS_SLUG = "chaos-drop";
const DROP_DELAY = 700;
const SOFT_DROP_DELAY = 70;

const PIECES = [
  {
    name: "I",
    rotations: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ],
      [
        { x: 2, y: -1 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ],
    ],
  },
  {
    name: "J",
    rotations: [
      [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 1, y: -1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
      ],
      [
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
    ],
  },
  {
    name: "L",
    rotations: [
      [
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 1, y: -1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 1 },
      ],
      [
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
    ],
  },
  {
    name: "O",
    rotations: [
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
    ],
  },
  {
    name: "S",
    rotations: [
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
      [
        { x: 1, y: -1 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
      ],
    ],
  },
  {
    name: "T",
    rotations: [
      [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 1, y: -1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: -1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
    ],
  },
  {
    name: "Z",
    rotations: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: 2, y: -1 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
      ],
    ],
  },
];

const createEmptyBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));

const randomPiece = () => {
  const definition = PIECES[Math.floor(Math.random() * PIECES.length)];
  const rotationIndex = Math.floor(Math.random() * definition.rotations.length);
  const shape = definition.rotations[rotationIndex];
  const minY = Math.min(...shape.map((block) => block.y));
  const minX = Math.min(...shape.map((block) => block.x));
  const normalizedShape = shape.map((block) => ({ x: block.x - minX, y: block.y - minY }));
  const width = Math.max(...normalizedShape.map((block) => block.x)) + 1;
  const spawnX = Math.floor((BOARD_WIDTH - width) / 2);
  const spawnY = Math.min(0, -minY);
  return {
    id: `${definition.name}-${Date.now()}-${Math.random()}`,
    name: definition.name,
    definition,
    rotationIndex,
    shape: normalizedShape,
    x: spawnX,
    y: spawnY,
  };
};

const cloneBoard = (board) => board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

const canPlacePiece = (board, piece, offsetX = 0, offsetY = 0) => {
  if (!piece) return false;
  return piece.shape.every((block) => {
    const x = piece.x + block.x + offsetX;
    const y = piece.y + block.y + offsetY;
    if (x < 0 || x >= BOARD_WIDTH) return false;
    if (y >= BOARD_HEIGHT) return false;
    if (y < 0) return true;
    return !board[y][x];
  });
};

const mergePiece = (board, piece) => {
  const next = cloneBoard(board);
  piece.shape.forEach((block) => {
    const x = piece.x + block.x;
    const y = piece.y + block.y;
    if (y < 0 || y >= BOARD_HEIGHT || x < 0 || x >= BOARD_WIDTH) return;
    next[y][x] = { name: piece.name };
  });
  return next;
};

const clearFullRows = (board) => {
  const remaining = [];
  let cleared = 0;
  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    const row = board[y];
    if (row.every((cell) => cell)) {
      cleared += 1;
    } else {
      remaining.push(row);
    }
  }
  while (remaining.length < BOARD_HEIGHT) {
    remaining.unshift(Array(BOARD_WIDTH).fill(null));
  }
  return { board: remaining, clearedRows: cleared };
};

const countHoles = (board) => {
  let holes = 0;
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    let seenBlock = false;
    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      if (board[y][x]) {
        seenBlock = true;
      } else if (seenBlock) {
        holes += 1;
      }
    }
  }
  return holes;
};

const columnHeights = (board) => {
  const heights = Array(BOARD_WIDTH).fill(0);
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      if (board[y][x]) {
        heights[x] = BOARD_HEIGHT - y;
        break;
      }
    }
  }
  return heights;
};

const evaluateChaos = (board) => {
  const heights = columnHeights(board);
  const totalHeight = heights.reduce((sum, value) => sum + value, 0);
  const bumpiness = heights.reduce((sum, value, index) => {
    if (index === 0) return sum;
    return sum + Math.abs(value - heights[index - 1]);
  }, 0);
  const holes = countHoles(board);
  const surfaceChaos = totalHeight + bumpiness;
  return {
    holes,
    bumpiness,
    totalHeight,
    surfaceChaos,
    chaosScore: Math.max(1, Math.round(surfaceChaos / 2 + holes * 3)),
  };
};

const formatTime = (seconds) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function ChaosPage() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(() => createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(() => null);
  const [nextPiece, setNextPiece] = useState(() => randomPiece());
  const [status, setStatus] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [alias, setAlias] = useState(() => readLocalPlayerName() || "");
  const [submitting, setSubmitting] = useState(false);
  const [finalStats, setFinalStats] = useState(null);
  const [aiLinesCleared, setAiLinesCleared] = useState(0);
  const [chaosScore, setChaosScore] = useState(0);
  const [placements, setPlacements] = useState(0);
  const [gameOverDialogOpen, setGameOverDialogOpen] = useState(false);
  const [softDropping, setSoftDropping] = useState(false);
  const [isTouchMobile, setIsTouchMobile] = useState(false);

  const boardRef = useRef(board);
  const pieceRef = useRef(currentPiece);
  const statusRef = useRef(status);
  const elapsedRef = useRef(elapsed);
  const nextPieceRef = useRef(nextPiece);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    pieceRef.current = currentPiece;
  }, [currentPiece]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    nextPieceRef.current = nextPiece;
  }, [nextPiece]);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  }, []);

  const spawnPiece = useCallback(
    (boardState) => {
      const next = nextPieceRef.current || randomPiece();
      const candidate = { ...next, shape: next.shape.map((block) => ({ ...block })) };
      if (!canPlacePiece(boardState, candidate)) {
        setCurrentPiece(null);
        setSoftDropping(false);
        setStatus("over");
        const analysis = evaluateChaos(boardState);
        setFinalStats({
          score: chaosScore,
          time: elapsedRef.current,
          placements,
          holes: analysis.holes,
          linesCleared: aiLinesCleared,
        });
        setGameOverDialogOpen(true);
        return;
      }
      setCurrentPiece(candidate);
      const upcoming = randomPiece();
      nextPieceRef.current = upcoming;
      setNextPiece(upcoming);
    },
    [aiLinesCleared, chaosScore, placements]
  );

  const lockPiece = useCallback(
    (piece) => {
      if (!piece) return;
      const merged = mergePiece(boardRef.current, piece);
      const { board: clearedBoard, clearedRows } = clearFullRows(merged);
      const analysis = evaluateChaos(clearedBoard);
      setBoard(clearedBoard);
      setCurrentPiece(null);
      setAiLinesCleared((value) => value + clearedRows);
      setChaosScore((value) => Math.max(0, value + analysis.chaosScore - clearedRows * 2));
      setPlacements((value) => value + 1);
      spawnPiece(clearedBoard);
    },
    [spawnPiece]
  );

  const hardDrop = useCallback(() => {
    const activePiece = pieceRef.current;
    if (!activePiece) return;
    let dropDistance = 0;
    while (canPlacePiece(boardRef.current, activePiece, 0, dropDistance + 1)) {
      dropDistance += 1;
    }
    if (dropDistance === 0) {
      lockPiece(activePiece);
      return;
    }
    const landedPiece = {
      ...activePiece,
      y: activePiece.y + dropDistance,
    };
    setCurrentPiece(landedPiece);
    setTimeout(() => {
      lockPiece(landedPiece);
    }, 0);
  }, [lockPiece]);

  const movePiece = useCallback(
    (deltaX, deltaY) => {
      setCurrentPiece((current) => {
        if (!current) return current;
        if (canPlacePiece(boardRef.current, current, deltaX, deltaY)) {
          return { ...current, x: current.x + deltaX, y: current.y + deltaY };
        }
        if (deltaY > 0) {
          lockPiece(current);
        }
        return current;
      });
    },
    [lockPiece]
  );

  const rotatePiece = useCallback(
    (direction = 1) => {
      setCurrentPiece((current) => {
        if (!current) return current;
        const totalRotations = current.definition.rotations.length;
        const nextIndex = (current.rotationIndex + direction + totalRotations) % totalRotations;
        const nextShape = current.definition.rotations[nextIndex];
        const minX = Math.min(...nextShape.map((block) => block.x));
        const minY = Math.min(...nextShape.map((block) => block.y));
        const normalized = nextShape.map((block) => ({ x: block.x - minX, y: block.y - minY }));
        let candidate = {
          ...current,
          rotationIndex: nextIndex,
          shape: normalized,
        };
        const width = Math.max(...normalized.map((block) => block.x)) + 1;
        if (candidate.x + width > BOARD_WIDTH) {
          candidate = { ...candidate, x: BOARD_WIDTH - width };
        }
        if (candidate.x < 0) {
          candidate = { ...candidate, x: 0 };
        }
        if (canPlacePiece(boardRef.current, candidate)) {
          return candidate;
        }
        return current;
      });
    },
    []
  );

  const startRun = useCallback(() => {
    const initialBoard = createEmptyBoard();
    const firstPiece = randomPiece();
    if (!canPlacePiece(initialBoard, firstPiece)) {
      toast.error("The sabotage pile is already maxed out.");
      return;
    }
    setBoard(initialBoard);
    setChaosScore(0);
    setAiLinesCleared(0);
    setPlacements(0);
    setElapsed(0);
    setStatus("running");
    setCurrentPiece(firstPiece);
    const upcoming = randomPiece();
    nextPieceRef.current = upcoming;
    setNextPiece(upcoming);
    setFinalStats(null);
    setGameOverDialogOpen(false);
    setSoftDropping(false);
  }, []);

  useEffect(() => {
    if (status !== "running") return undefined;
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "running") return undefined;
    const delay = softDropping ? SOFT_DROP_DELAY : DROP_DELAY;
    const tick = window.setInterval(() => {
      const active = pieceRef.current;
      if (!active) return;
      if (canPlacePiece(boardRef.current, active, 0, 1)) {
        setCurrentPiece((current) => (current ? { ...current, y: current.y + 1 } : current));
      } else {
        lockPiece(active);
      }
    }, delay);
    return () => window.clearInterval(tick);
  }, [status, softDropping, lockPiece]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return;
      if (statusRef.current === "over") return;
      switch (event.key) {
        case "ArrowLeft":
        case "a":
          event.preventDefault();
          if (statusRef.current !== "running") startRun();
          movePiece(-1, 0);
          break;
        case "ArrowRight":
        case "d":
          event.preventDefault();
          if (statusRef.current !== "running") startRun();
          movePiece(1, 0);
          break;
        case "ArrowDown":
        case "s":
          event.preventDefault();
          if (statusRef.current !== "running") startRun();
          setSoftDropping(true);
          break;
        case "ArrowUp":
        case "w":
          event.preventDefault();
          if (statusRef.current !== "running") startRun();
          rotatePiece(1);
          break;
        case " ":
        case "Spacebar":
          event.preventDefault();
          if (statusRef.current !== "running") startRun();
          hardDrop();
          break;
        case "q":
          event.preventDefault();
          if (statusRef.current !== "running") startRun();
          rotatePiece(-1);
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "ArrowDown" || event.key === "s") {
        setSoftDropping(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [hardDrop, movePiece, rotatePiece, startRun]);

  useEffect(() => {
    if (status === "over" && finalStats) {
      setGameOverDialogOpen(true);
    }
  }, [status, finalStats]);

  const ghostPiece = useMemo(() => {
    const active = currentPiece;
    if (!active) return null;
    let drop = 0;
    while (canPlacePiece(board, active, 0, drop + 1)) {
      drop += 1;
    }
    return { ...active, y: active.y + drop };
  }, [board, currentPiece]);

  const upcomingPreview = useMemo(() => {
    const piece = nextPiece;
    if (!piece) return [];
    const maxY = Math.max(...piece.shape.map((block) => block.y));
    const maxX = Math.max(...piece.shape.map((block) => block.x));
    const height = maxY + 1;
    const width = maxX + 1;
    const grid = Array.from({ length: height }, () => Array(width).fill(false));
    piece.shape.forEach((block) => {
      if (grid[block.y]) {
        grid[block.y][block.x] = true;
      }
    });
    return grid;
  }, [nextPiece]);

  const handleSubmitScore = useCallback(async () => {
    if (!finalStats) return;
    const trimmedAlias = alias.trim();
    if (!trimmedAlias) return;
    setSubmitting(true);
    try {
      await submitChaosScore({
        username: trimmedAlias,
        score: Math.max(0, Math.round(finalStats.score)),
        completion_time_seconds: Math.max(0, Math.floor(finalStats.time)),
      });
      saveLocalPlayerName(trimmedAlias);
      toast.success("Chaos logged on the leaderboard.");
      setGameOverDialogOpen(false);
      navigate(
        `/results/${CHAOS_SLUG}?score=${Math.max(0, Math.round(finalStats.score))}&time=${Math.max(
          0,
          Math.floor(finalStats.time)
        )}&pieces=${finalStats.placements}&holes=${finalStats.holes}&cleared=${finalStats.linesCleared}`
      );
    } catch (error) {
      console.error("Chaos leaderboard submission failed:", error);
      toast.error("Leaderboard didn't survive that drop. Try again.");
    } finally {
      setSubmitting(false);
    }
  }, [alias, finalStats, navigate]);

  const chaosLevel = useMemo(
    () => Math.max(0, Math.min(100, Math.round((chaosScore / 400) * 100))),
    [chaosScore]
  );

  const statusLabel = status === "running" ? "Sowing chaos" : status === "over" ? "Finalized" : "Idle";
  const statusVariant = status === "running" ? "default" : status === "over" ? "destructive" : "secondary";
  const playButtonLabel = status === "over" ? "Run it back" : "Start chaos";
  const showPlayOverlay = status !== "running";

  return (
    <GameplayLayout sidebarWrapperClassName="sm:grid-cols-1"
      sidebar={
        <>
          <GameplaySidebarCard label="Chaos stats">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold uppercase tracking-[0.25em] text-muted-foreground">Chaos</span>
                <span className="font-semibold text-foreground">{chaosScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-[0.25em] text-muted-foreground">Placements</span>
                <span className="font-semibold text-foreground">{placements}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-[0.25em] text-muted-foreground">AI clears</span>
                <span className="font-semibold text-foreground">{aiLinesCleared}</span>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  Run time
                </p>
                <p className="text-lg font-semibold">{formatTime(elapsed)}</p>
              </div>
              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  <Gamepad2 className="h-4 w-4" />
                  Chaos meter
                </p>
                <Progress value={chaosLevel} className="h-2" />
              </div>
            </div>
          </GameplaySidebarCard>
          <GameplaySidebarCard label="Sabotage briefing" contentClassName="space-y-3 text-sm">
            <p>
              Drop pieces to create impossible junk for the clean-up AI. Complete rows vanish — everything
              else stays to haunt it.
            </p>
            <p>Points stack from jagged skylines, hidden holes, and total tower height.</p>
            <p className="text-xs text-muted-foreground">Hard drop with space. Rotate with W / Up / Q for reverse.</p>
          </GameplaySidebarCard>
          <GameplaySidebarCard label="AI counterplay" contentClassName="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bot className="h-4 w-4" />
              <span>The cleaner deletes full rows immediately after your sabotage.</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your goal is to leave it with lumpy walls and buried pockets it can&apos;t reach.
            </p>
          </GameplaySidebarCard>
        </>
      }
    >
      <Card className="flex flex-1 flex-col border-border/70 bg-card/95 lg:overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.45em] text-muted-foreground">
            <span className="rounded-full border border-border/40 bg-muted/10 px-3 py-1 text-[9px]">Games</span>
            <span className="rounded-full border border-border/40 bg-muted/10 px-3 py-1 text-[9px]">Chaos Drop</span>
            <span className="rounded-full border border-border/40 bg-muted/10 px-3 py-1 text-[9px]">Sabotage 01</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Disorder sprint</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Make the AI regret enabling gravity.
              </CardDescription>
            </div>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mx-auto w-full max-w-[440px]">
            <div className="relative aspect-[10/18] w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-3 transition">
              <ChaosBoard
                width={BOARD_WIDTH}
                height={BOARD_HEIGHT}
                board={board}
                currentPiece={currentPiece}
                ghostPiece={ghostPiece}
              />
              {showPlayOverlay && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.1rem] bg-background/80 backdrop-blur-sm dark:bg-background/60">
                  <Button size="lg" className="rounded-full px-8" onClick={startRun}>
                    {playButtonLabel}
                  </Button>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                    Drop chaos with arrows / WASD
                  </p>
                </div>
              )}
            </div>
          </div>
          {isTouchMobile && (
            <div className="mx-auto grid w-full max-w-[260px] gap-2">
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-sm font-semibold uppercase tracking-[0.3em] text-foreground shadow-md transition hover:border-primary/60 hover:text-primary"
                  onClick={() => rotatePiece(1)}
                  aria-label="Rotate"
                >
                  ↻
                </button>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-sm font-semibold uppercase tracking-[0.3em] text-foreground shadow-md transition hover:border-primary/60 hover:text-primary"
                  onClick={hardDrop}
                  aria-label="Hard drop"
                >
                  ⇩
                </button>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-sm font-semibold uppercase tracking-[0.3em] text-foreground shadow-md transition hover:border-primary/60 hover:text-primary"
                  onClick={() => movePiece(-1, 0)}
                  aria-label="Move left"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-sm font-semibold uppercase tracking-[0.3em] text-foreground shadow-md transition hover:border-primary/60 hover:text-primary"
                  onClick={() => movePiece(1, 0)}
                  aria-label="Move right"
                >
                  →
                </button>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-sm font-semibold uppercase tracking-[0.3em] text-foreground shadow-md transition hover:border-primary/60 hover:text-primary"
                  onClick={() => {
                    setSoftDropping(true);
                    movePiece(0, 1);
                  }}
                  onMouseUp={() => setSoftDropping(false)}
                  onTouchEnd={() => setSoftDropping(false)}
                  aria-label="Soft drop"
                >
                  ↓
                </button>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Next sabotage</p>
            <div className="mt-2 inline-flex rounded-xl border border-white/10 bg-slate-950/30 p-3">
              {upcomingPreview.length ? (
                <div className="grid auto-rows-[16px] grid-cols-4 gap-[3px]">
                  {upcomingPreview.flatMap((row, rowIndex) =>
                    row.map((filled, colIndex) => (
                      <div
                        key={`preview-${rowIndex}-${colIndex}`}
                        className={filled ? "h-4 w-4 rounded-[3px] bg-white/70" : "h-4 w-4"}
                      />
                    ))
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">All chaos deployed.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={gameOverDialogOpen} onOpenChange={setGameOverDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sabotage summary</DialogTitle>
            <DialogDescription>
              Drop an alias to log the mess you just made and unlock the recap page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Chaos score: <span className="font-semibold text-foreground">{finalStats?.score ?? chaosScore}</span>
            </p>
            <p>
              Placements: <span className="font-semibold text-foreground">{finalStats?.placements ?? placements}</span>
            </p>
            <p>
              Time: <span className="font-semibold text-foreground">{formatTime(finalStats?.time ?? elapsed)}</span>
            </p>
            <Input
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              placeholder="Alias for the leaderboard"
              autoFocus
            />
            <p className="text-xs">
              Once logged, we’ll route you to the detailed recap to flex your sabotage.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setGameOverDialogOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={handleSubmitScore} disabled={submitting || !alias.trim()}>
              {submitting ? "Posting…" : "Submit score"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GameplayLayout>
  );
}
