import { useEffect, useMemo, useState } from "react";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "play-theme";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle({ className }) {
  const [theme, setTheme] = useState(() => getInitialTheme());

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.setProperty("color-scheme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const label = useMemo(() => {
    return theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  }, [theme]);

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={cn("gap-2 rounded-full px-3", className)}
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      aria-label={label}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em]">
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </Button>
  );
}
