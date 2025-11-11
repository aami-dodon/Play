import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchQuizzes } from "../api.js";

export default function Landing() {
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    fetchQuizzes().then(setQuizzes);
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🎮 Play — Choose a Quiz</h1>

      {quizzes.length === 0 ? (
        <p>Loading quizzes...</p>
      ) : (
        quizzes.map((quiz) => (
          <div key={quiz.id} style={{ marginTop: "1rem" }}>
            <h3>{quiz.title}</h3>
            <p>{quiz.description}</p>
            <Link to={`/play/${quiz.slug}`}>
              <button>Start Quiz</button>
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
