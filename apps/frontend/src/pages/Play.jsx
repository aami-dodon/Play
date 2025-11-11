import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchQuestions } from "../api.js";

export default function Play() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    fetchQuestions(slug).then(setQuestions);
  }, [slug]);

  if (questions.length === 0)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f6f8",
          color: "#333",
        }}
      >
        <p>Loading questions...</p>
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
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          padding: "2rem",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <h2 style={{ color: "#222", marginBottom: "1rem" }}>
          Question {current + 1} / {questions.length}
        </h2>

        <p style={{ fontSize: "1.25rem", color: "#333", lineHeight: "1.5" }}>
          {q.question_text}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
          {q.options.map((option, i) => {
            const isCorrect = option === correctAnswer;
            const isSelected = selected === option;

            let bg = "#fff";
            if (selected) {
              if (isCorrect) bg = "#d1f7d6"; // green for correct
              if (isSelected && !isCorrect) bg = "#ffd7d7"; // red for wrong
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                disabled={!!selected}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: bg,
                  color: "#222",
                  textAlign: "left",
                  cursor: selected ? "default" : "pointer",
                  transition: "background 0.3s",
                }}
              >
                {option}
              </button>
            );
          })}
        </div>

        {selected && (
          <div style={{ marginTop: "1.5rem" }}>
            {explanation && (
              <div
                style={{
                  background: "#eef4ff",
                  borderLeft: "4px solid #007bff",
                  padding: "1rem",
                  borderRadius: "8px",
                  color: "#333",
                  marginBottom: "1rem",
                }}
              >
                💡 <strong>Explanation:</strong> {explanation}
              </div>
            )}
            <button
              onClick={next}
              style={{
                padding: "0.6rem 1.2rem",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
