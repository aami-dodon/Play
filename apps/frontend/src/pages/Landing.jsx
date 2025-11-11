import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchQuizzes } from "../api.js";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import "./Landing.css";

export default function Landing() {
  const [quizzes, setQuizzes] = useState([]);
  const location = useLocation();
  const notice = location.state?.notice;

  useEffect(() => {
    fetchQuizzes().then(setQuizzes);
  }, []);

  const heroQuiz = quizzes[0];
  const heroLink = heroQuiz ? `/play/${heroQuiz.slug}` : "/play";

  return (
    <div className="landing-page">
      <div className="landing-body">
        <header className="landing-header">
          <div className="brand-mark">
            Play<span style={{ color: "var(--secondary)" }}>•</span>
          </div>
          <div className="nav-links">
            <Button asChild variant="ghost">
              <Link to="#quizzes">Pick a quiz</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="#quizzes">See leaderboard</Link>
            </Button>
            <Button asChild variant="ghost">
              <a href="https://www.shadcn/ui" target="_blank" rel="noreferrer">
                Theme inspiration
              </a>
            </Button>
          </div>
        </header>

        {notice && (
          <div className="notice-card">
            <strong>Heads up:</strong> {notice}
          </div>
        )}

        <Card className="landing-main">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">✨ Quiz Arcade</p>
              <h1>Modern quizzes, playful vibes.</h1>
              <p>
                Enjoy a cozy, mobile-first experience with crisp gradients, happy micro interactions,
                and thoughtful pacing. Pick a quiz, tap through the prompts, and let your curiosity spark
                with every answer.
              </p>
              <div className="hero-actions">
                <Button asChild variant="primary">
                  <Link to={heroLink}>Start the Database Quiz</Link>
                </Button>
                <Button variant="secondary" type="button">
                  Browse future decks
                </Button>
              </div>
            </div>
            <div className="mock-device">
              <div className="device-shell">
                <div className="screen">
                  <div className="device-screen-header">
                    <span>Live</span>
                    <span>4/8</span>
                  </div>
                  <p className="device-question">
                    Which database type is best for connected social data?
                  </p>
                  <div className="device-option">Graph DB</div>
                  <div className="device-option">Document DB</div>
                  <div className="device-option">Relational DB</div>
                </div>
              </div>
            </div>
          </div>

          <section id="quizzes" className="quiz-grid">
            {quizzes.length === 0 ? (
              <div className="quiz-card">
                <p>Loading quizzes...</p>
              </div>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="quiz-card">
                  <Badge className="quiz-badge">🧠 {quiz.category || "General"}</Badge>
                  <h3>{quiz.title}</h3>
                  <p>{quiz.description}</p>
                  <div className="quiz-footer">
                    <span>Collect points</span>
                    <Button asChild variant="secondary" className="play-button">
                      <Link to={`/play/${quiz.slug}`}>Play →</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>
        </Card>
      </div>
    </div>
  );
}
