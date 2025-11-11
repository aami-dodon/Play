import { Outlet } from "react-router-dom";

import Footer from "./Footer.jsx";
import Header from "./Header.jsx";

const layoutClasses =
  "min-h-screen px-4 py-10 text-foreground [background:radial-gradient(circle_at_top,_color-mix(in_oklab,_var(--primary)_30%,_transparent),_transparent_45%),radial-gradient(circle_at_20%_20%,_color-mix(in_oklab,_var(--accent)_25%,_transparent),_transparent_35%),var(--background)]";

export default function Layout() {
  return (
    <div className={layoutClasses}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Header />
        <Outlet />
        <Footer />
      </div>
    </div>
  );
}
