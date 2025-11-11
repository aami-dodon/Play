import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing.jsx";
import Play from "./pages/Play.jsx";
import Result from "./pages/Result.jsx";
import Layout from "./components/Layout.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/play/:slug" element={<Play />} />
        <Route path="/result/:slug" element={<Result />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
