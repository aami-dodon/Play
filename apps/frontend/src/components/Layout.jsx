import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Header from "./Header.jsx";
import { Toaster } from "./ui/sonner";

const backgroundClasses =
  "relative min-h-screen w-full bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,_var(--primary)_35%,_transparent)_0%,_transparent_45%),radial-gradient(circle_at_80%_20%,_color-mix(in_oklab,_var(--secondary)_25%,_transparent)_0%,_transparent_40%),var(--background)] text-foreground";

export default function Layout() {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = window.setTimeout(() => setIsAnimating(false), 320);
    return () => {
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  return (
    <>
      <div className={`${backgroundClasses} h-screen w-full`}>
        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <Header />
          <main className="flex-1 py-4">
            <div
              className={`transition-all duration-300 ease-out will-change-[opacity,transform] ${
                isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <Toaster position="top-center" richColors duration={3600} />
    </>
  );
}
