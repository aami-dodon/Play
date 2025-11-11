import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchLeaderboard, submitScore } from "../api.js";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import "./Result.css";

export default function Result() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const score = parseInt(params.get("score")) || 0;
  const time = parseInt(params.get("time")) || 0;

  const [username, setUsername] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const payload = { username, score, completion_time_seconds: time };
    await submitScore(slug, payload);
    const data = await fetchLeaderboard(slug);
    setLeaderboard(data);
    setSubmitted(true);
  };

  return (
    <div className="result-page">
      <Card className="result-card">
        <h2>🎉 Quiz Complete!</h2>
        <p>
          Your score: <strong>{score}</strong>
        </p>
        <p>
          Time taken: <strong>{time}</strong> seconds
        </p>

        {!submitted ? (
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button onClick={handleSubmit} disabled={!username}>
              Submit Score
            </Button>
          </div>
        ) : (
          <div className="leaderboard-list">
            <h3>🏆 Leaderboard</h3>
            {leaderboard.length === 0 ? (
              <p>No scores yet.</p>
            ) : (
              <ol>
                {leaderboard.map((entry, i) => (
                  <li key={i}>
                    {entry.username} — {entry.score} pts (
                    {entry.completion_time_seconds}s)
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
  
