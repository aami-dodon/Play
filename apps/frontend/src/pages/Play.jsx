import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { fetchQuestions } from "../api.js";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import "./Play.css";

export default function Play() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!slug) return;
    const key = `played_${slug}`;
    const alreadyPlayed = typeof window !== "undefined" && localStorage.getItem(key);

    if (alreadyPlayed) {
      navigate("/", {
        state: { notice: "You’ve already played this quiz. Try another one!" },
        replace: true,
      });
      return;
    }

    localStorage.setItem(key, Date.now().toString());
  }, [slug, navigate]);

  useEffect(() => {
    fetchQuestions(slug).then(setQuestions);
  }, [slug]);

  if (questions.length === 0)
    return (
      <div className="play-page">
        <Card className="play-card">
          <p className="play-question">Loading questions...</p>
        </Card>
      </div>
    );

  const q = questions[current];
  const correctAnswer =
    q.correct_option || q.answer || q.correctAnswer || q.correct || "";
  const explanation =
    q.explanation || q.reason || q.details || q.note || "";

  const handleAnswer = (option) => {
    if (selected) return; // prevent double clicks
    setSelected(option);

    const isCorrect = option === correctAnswer;
    if (isCorrect) setScore((prev) => prev + 1);
  };

  const next = () => {
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setSelected(null);
    } else {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      navigate(`/result/${slug}?score=${score}&time=${timeTaken}`);
    }
  };

  return (
    <div className="play-page">
      <Card className="play-card">
        <p className="play-question">
          Question {current + 1} / {questions.length}
        </p>
        <p style={{ fontSize: "1rem", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          {q.question_text}
        </p>

        <div className="play-options">
          {q.options.map((option, i) => {
            const isCorrect = option === correctAnswer;
            const isSelected = selected === option;

            const optionClass = clsx("play-option", {
              correct: selected && isCorrect,
              incorrect: selected && isSelected && !isCorrect,
            });

            return (
              <Button
                key={i}
                variant="ghost"
                disabled={!!selected}
                className={optionClass}
                onClick={() => handleAnswer(option)}
              >
                {option}
              </Button>
            );
          })}
        </div>

        {selected && (
          <div className="play-prompt">
            {explanation && (
              <p style={{ margin: 0 }}>
                💡 <strong>Explanation:</strong> {explanation}
              </p>
            )}
            <div style={{ marginTop: "1rem" }}>
              <Button variant="primary" onClick={next}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
