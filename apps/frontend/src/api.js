import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api"; // backend URL

export async function fetchQuizzes() {
  const res = await axios.get(`${API_BASE}/quizzes`);
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
