import { Outlet } from "react-router-dom";

import Header from "./Header.jsx";
import { Toaster } from "./ui/sonner";

const backgroundClasses =
  "relative min-h-screen w-full bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,_var(--primary)_35%,_transparent)_0%,_transparent_45%),radial-gradient(circle_at_80%_20%,_color-mix(in_oklab,_var(--secondary)_25%,_transparent)_0%,_transparent_40%),var(--background)] text-foreground";

export default function Layout() {
  return (
    <div className={backgroundClasses}>
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <Header />
        <main className="flex-1 py-4">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-center" richColors closeButton duration={2200} />
    </div>
  );
}
