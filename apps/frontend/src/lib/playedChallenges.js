const PLAYED_CHALLENGES_KEY = "played_challenges";

function safeGetWindow() {
  return typeof window === "undefined" ? null : window;
}

export function readPlayedChallenges() {
  const win = safeGetWindow();
  if (!win) return new Set();
  try {
    const stored = win.localStorage.getItem(PLAYED_CHALLENGES_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((entry) => typeof entry === "string" && entry.length > 0));
    }
    return new Set();
  } catch (error) {
    console.warn("Failed to parse played challenges list", error);
    return new Set();
  }
}

export function markChallengePlayed(slug) {
  const win = safeGetWindow();
  if (!win || !slug) return;
  const played = readPlayedChallenges();
  played.add(slug);
  win.localStorage.setItem(PLAYED_CHALLENGES_KEY, JSON.stringify([...played]));
}

export function hasPlayedChallenge(slug) {
  if (!slug) return false;
  const played = readPlayedChallenges();
  return played.has(slug);
}
