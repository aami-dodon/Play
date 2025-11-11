const PLAYED_CHALLENGES_KEY = "played_challenges";
const PLAYER_ALIAS_KEY = "player_alias";

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

export function readLocalPlayerName() {
  const win = safeGetWindow();
  if (!win) return null;
  const stored = win.localStorage.getItem(PLAYER_ALIAS_KEY);
  if (!stored) return null;
  const trimmed = stored.trim();
  return trimmed.length ? trimmed : null;
}

export function saveLocalPlayerName(name) {
  const win = safeGetWindow();
  if (!win) return;
  if (typeof name !== "string" || !name.trim()) {
    win.localStorage.removeItem(PLAYER_ALIAS_KEY);
    return;
  }
  win.localStorage.setItem(PLAYER_ALIAS_KEY, name.trim());
}
