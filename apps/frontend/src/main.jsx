import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Challenge from "./pages/Challenge.jsx";
import Results from "./pages/Results.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Admin from "./pages/Admin.jsx";
import SnakePage from "./features/snake/SnakePage.jsx";
import Arcade from "./pages/Arcade.jsx";
import Layout from "./components/Layout.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/challenge" element={<Challenge />} />
        <Route path="/challenge/:slug" element={<Challenge />} />
        <Route path="/play/:slug" element={<Challenge />} />
        <Route path="/arcade" element={<Arcade />} />
        <Route path="/snake" element={<SnakePage />} />
        <Route path="/results/:slug" element={<Results />} />
        <Route path="/result/:slug" element={<Results />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
