import { Link } from "react-router-dom";

import ThemeToggle from "./ThemeToggle.jsx";

const headerClasses =
  "rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[0_25px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl";

export default function Header({ children, className = "" }) {
  return (
    <header className={`${headerClasses} ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/" className="text-lg font-semibold uppercase tracking-[0.45em]">
          Play<span className="text-[var(--secondary)]">•</span>
        </Link>
        <ThemeToggle />
      </div>
      {children}
    </header>
  );
}
