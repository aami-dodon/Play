export const THEME_EVENT = "brainbrawl:theme-change";

export function getDocumentTheme() {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function notifyThemeChange(theme) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}
