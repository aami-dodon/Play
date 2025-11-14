import { useMemo } from "react";

import { cn } from "@/lib/utils";

const CELL_COLORS = {
  I: "bg-sky-400/90",
  J: "bg-indigo-500/90",
  L: "bg-amber-500/90",
  O: "bg-yellow-400/90",
  S: "bg-emerald-500/90",
  T: "bg-fuchsia-500/90",
  Z: "bg-rose-500/90",
};

export default function ChaosBoard({ board, currentPiece, ghostPiece, width, height }) {
  const occupied = useMemo(() => {
    const cells = new Map();
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          cells.set(`${x}:${y}`, cell);
        }
      });
    });
    return cells;
  }, [board]);

  const activeCells = useMemo(() => {
    if (!currentPiece) return new Set();
    const set = new Set();
    currentPiece.shape.forEach((block) => {
      const absoluteX = currentPiece.x + block.x;
      const absoluteY = currentPiece.y + block.y;
      if (absoluteX < 0 || absoluteX >= width) return;
      if (absoluteY < 0 || absoluteY >= height) return;
      set.add(`${absoluteX}:${absoluteY}`);
    });
    return set;
  }, [currentPiece, width, height]);

  const ghostCells = useMemo(() => {
    if (!ghostPiece) return new Set();
    const set = new Set();
    ghostPiece.shape.forEach((block) => {
      const absoluteX = ghostPiece.x + block.x;
      const absoluteY = ghostPiece.y + block.y;
      if (absoluteX < 0 || absoluteX >= width) return;
      if (absoluteY < 0 || absoluteY >= height) return;
      set.add(`${absoluteX}:${absoluteY}`);
    });
    return set;
  }, [ghostPiece, width, height]);

  return (
    <div
      role="presentation"
      className="grid h-full w-full gap-[3px]"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: width * height }, (_, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        const key = `${x}:${y}`;
        const locked = occupied.get(key);
        const isActive = activeCells.has(key);
        const isGhost = ghostCells.has(key) && !isActive;
        const cell = isActive ? currentPiece?.name : locked;
        const pieceKey = typeof cell === "string" ? cell : locked?.name;
        const colorClass = CELL_COLORS[pieceKey] || "bg-white/10";

        return (
          <div
            key={key}
            className={cn(
              "relative rounded-[4px] border border-white/5 transition-colors",
              locked && "shadow-[0_0_10px_rgba(255,255,255,0.08)]",
              isGhost && "bg-white/10",
              isActive && `${colorClass} shadow-[0_0_12px_rgba(255,255,255,0.18)]`,
              !locked && !isActive && !isGhost && "bg-slate-900/40"
            )}
          >
            {locked ? (
              <div
                className={cn(
                  "absolute inset-[1px] rounded-[3px] border border-white/10",
                  CELL_COLORS[locked.name] || "bg-white/10",
                  CELL_COLORS[locked.name] ? "backdrop-blur-[1px]" : null
                )}
              />
            ) : null}
            {isGhost ? (
              <div className="absolute inset-[1px] rounded-[3px] border border-dashed border-white/20" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
