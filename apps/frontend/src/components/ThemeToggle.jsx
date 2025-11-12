import { useEffect, useMemo, useState } from "react";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { notifyThemeChange } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "play-theme";
const DEFAULT_THEME = "dark";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return DEFAULT_THEME;
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
    notifyThemeChange(theme);
  }, [theme]);

  const label = useMemo(() => {
    return theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  }, [theme]);

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={cn("rounded-full px-3", className)}
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      aria-label={label}
    >
      {theme === "dark" ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
