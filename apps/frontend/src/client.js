import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api"; // backend URL, fallback to relative path for production

export async function fetchQuizzes(params = {}) {
  const res = await axios.get(`${API_BASE}/quizzes`, { params });
  return res.data;
}

export async function fetchCategories() {
  const res = await axios.get(`${API_BASE}/quizzes/categories`);
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

export async function fetchGlobalLeaderboard(limitOrOptions = {}) {
  const params =
    typeof limitOrOptions === "number"
      ? { limit: limitOrOptions }
      : limitOrOptions || {};
  const res = await axios.get(`${API_BASE}/leaderboard`, { params });
  return res.data;
}

export async function fetchSnakeLeaderboard(limit = 12) {
  const res = await axios.get(`${API_BASE}/games/snake/leaderboard`, {
    params: { limit },
  });
  return res.data?.entries ?? [];
}

export async function submitSnakeScore(payload) {
  const res = await axios.post(`${API_BASE}/games/snake/score`, payload);
  return res.data;
}

export async function verifyAdminPassword(password) {
  const res = await axios.post(
    `${API_BASE}/admin/verify`,
    {},
    {
      headers: { "x-admin-password": password },
    },
  );
  return res.data;
}

export async function downloadQuizTemplate(password) {
  const res = await axios.get(`${API_BASE}/admin/quiz-template`, {
    responseType: "blob",
    headers: { "x-admin-password": password },
  });
  return res.data;
}

export async function uploadQuizFile(file, password, options = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (options.force) {
    formData.append("force", "true");
  }

  const res = await axios.post(`${API_BASE}/admin/quizzes/upload`, formData, {
    headers: {
      "x-admin-password": password,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}
