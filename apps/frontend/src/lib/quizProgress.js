const META_KEY_PREFIX = "quiz_progress_meta";
const QUESTION_KEY_PREFIX = "quiz_progress_questions";

const safeWindow = () => (typeof window === "undefined" ? null : window);

const buildKey = (prefix, slug) => `${prefix}:${slug}`;

const parseStored = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse stored quiz progress", error);
    return null;
  }
};

const serialize = (payload) => JSON.stringify(payload);

export function readQuizQuestions(slug) {
  const win = safeWindow();
  if (!win || !slug) return [];
  const stored = win.localStorage.getItem(buildKey(QUESTION_KEY_PREFIX, slug));
  if (!stored) return [];
  const parsed = parseStored(stored);
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

export function saveQuizQuestions(slug, questions) {
  const win = safeWindow();
  if (!win || !slug || !Array.isArray(questions)) return;
  try {
    win.localStorage.setItem(buildKey(QUESTION_KEY_PREFIX, slug), serialize(questions));
  } catch (error) {
    console.warn("Failed to save quiz questions", error);
  }
}

export function readQuizProgress(slug) {
  const win = safeWindow();
  if (!win || !slug) return null;
  const stored = win.localStorage.getItem(buildKey(META_KEY_PREFIX, slug));
  if (!stored) return null;
  const parsed = parseStored(stored);
  if (!parsed || typeof parsed !== "object") return null;
  const current = typeof parsed.current === "number" ? parsed.current : undefined;
  const score = typeof parsed.score === "number" ? parsed.score : undefined;
  const timeLeft = typeof parsed.timeLeft === "number" ? parsed.timeLeft : undefined;
  const startTime = typeof parsed.startTime === "number" ? parsed.startTime : undefined;
  const revealed = typeof parsed.revealed === "boolean" ? parsed.revealed : undefined;
  const selected = typeof parsed.selected === "string" ? parsed.selected : undefined;
  return { current, score, timeLeft, startTime, revealed, selected };
}

export function saveQuizProgress(slug, { current, score, timeLeft, startTime, revealed, selected }) {
  const win = safeWindow();
  if (!win || !slug) return;
  const payload = {};
  if (typeof current === "number" && Number.isFinite(current) && current >= 0) {
    payload.current = Math.floor(current);
  }
  if (typeof score === "number" && Number.isFinite(score) && score >= 0) {
    payload.score = Math.floor(score);
  }
  if (typeof timeLeft === "number" && Number.isFinite(timeLeft) && timeLeft >= 0) {
    payload.timeLeft = timeLeft;
  }
  if (typeof startTime === "number" && Number.isFinite(startTime) && startTime >= 0) {
    payload.startTime = startTime;
  }
  if (typeof revealed === "boolean") {
    payload.revealed = revealed;
  }
  if (typeof selected === "string") {
    const normalized = selected.trim();
    if (normalized.length) {
      payload.selected = normalized;
    }
  }
  if (!Object.keys(payload).length) return;
  payload.updatedAt = Date.now();

  try {
    win.localStorage.setItem(buildKey(META_KEY_PREFIX, slug), serialize(payload));
  } catch (error) {
    console.warn("Failed to persist quiz progress", error);
  }
}

export function clearQuizProgress(slug) {
  if (!slug) return;
  const win = safeWindow();
  if (!win) return;

  win.localStorage.removeItem(buildKey(META_KEY_PREFIX, slug));
  win.localStorage.removeItem(buildKey(QUESTION_KEY_PREFIX, slug));
}
