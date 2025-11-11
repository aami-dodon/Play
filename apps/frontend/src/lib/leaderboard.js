const asNumberMap = (raw = {}) => {
  if (!raw || typeof raw !== "object") return {};
  return Object.entries(raw).reduce((acc, [key, value]) => {
    const normalizedKey = (key && typeof key === "string" ? key.trim() : "") || "Uncategorized";
    const num = Number(value ?? 0);
    if (!Number.isFinite(num)) return acc;
    acc[normalizedKey] = num;
    return acc;
  }, {});
};

export function formatLeaderboardRows(entries = [], { fallbackCategory = "Arcade" } = {}) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  return entries.map((entry, index) => {
    const username = entry?.username || entry?.player || `Player ${index + 1}`;
    const score = Number(entry?.total_score ?? entry?.score ?? 0);
    const category = entry?.top_category || entry?.category || fallbackCategory;
    const bestTime = entry?.best_time_seconds ?? entry?.completion_time_seconds;
    const timeLabel =
      entry?.time ||
      (typeof bestTime === "number" && Number.isFinite(bestTime) ? `${bestTime}s` : "—");
    const challengeSlug = entry?.top_challenge_slug || entry?.challenge_slug || entry?.slug || null;
    const rawChallengeName =
      entry?.challenge_name ||
      entry?.challengeName ||
      entry?.top_challenge ||
      entry?.quiz_title ||
      entry?.challenge ||
      null;
    const fallbackChallengeName =
      typeof challengeSlug === "string"
        ? challengeSlug
            .split("-")
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : null;
    const challengeName = rawChallengeName || fallbackChallengeName || "Mystery challenge";
    const categoryScores = asNumberMap(entry?.category_scores || entry?.categoryScores || null);
    const challengeScores = asNumberMap(entry?.challenge_scores || entry?.challengeScores || null);

    return {
      player: username,
      score,
      category,
      time: timeLabel,
      rank: entry?.rank ?? index + 1,
      challengeName,
      challengeSlug,
      categoryScores,
      challengeScores,
    };
  });
}
