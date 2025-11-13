import { useMemo } from "react";

import { cn } from "@/lib/utils";

export default function SnakeBoard({ width, height, snake, food }) {
  const occupied = useMemo(() => {
    const set = new Set();
    snake.forEach((segment) => {
      if (typeof segment?.x === "number" && typeof segment?.y === "number") {
        set.add(`${segment.x}:${segment.y}`);
      }
    });
    return set;
  }, [snake]);

  const head = snake[0];

  return (
    <div
      role="presentation"
      className="grid h-full w-full gap-1"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: width * height }, (_item, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        const key = `${x}-${y}`;
        const isFood = food?.x === x && food?.y === y;
        const isHead = head?.x === x && head?.y === y;
        const isBody = occupied.has(`${x}:${y}`);

        return (
          <div
            key={key}
            className={cn(
              "rounded-[3px] border border-white/5 transition-colors duration-200",
              isHead
                ? "bg-lime-400 shadow-[0_0_12px_rgba(132,204,22,0.65)]"
                : isBody
                ? "bg-lime-600/80"
                : "bg-white/5",
              isFood && "bg-rose-500/90 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
            )}
          />
        );
      })}
    </div>
  );
}
