import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api"; // backend URL, fallback to relative path for production

export async function fetchQuizzes(params = {}) {
  const res = await axios.get(`${API_BASE}/quizzes`, { params });
  return res.data;
}

export async function fetchQuestions(slug) {
  const res = await axios.get(`${API_BASE}/quizzes/${slug}/questions`);
  return res.data;
}

export async function submitScore(slug, payload) {
  const res = await axios.post(`${API_BASE}/quizzes/${slug}/leaderboard`, payload);
  return res.data;
}

export async function fetchLeaderboard(slug) {
  const res = await axios.get(`${API_BASE}/quizzes/${slug}/leaderboard`);
  return res.data;
}

export async function fetchGlobalLeaderboard(limit) {
  const res = await axios.get(`${API_BASE}/leaderboard`, {
    params: typeof limit === "number" ? { limit } : undefined,
  });
  return res.data;
}
