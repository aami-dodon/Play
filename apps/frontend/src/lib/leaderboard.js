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

    return {
      player: username,
      score,
      category,
      time: timeLabel,
      rank: entry?.rank ?? index + 1,
    };
  });
}
