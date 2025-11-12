import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { MenuIcon } from "lucide-react";

import ThemeToggle from "./ThemeToggle.jsx";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { texts } from "@/texts";

const navItems = texts.nav;

const isActivePath = (pathname, href) => {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
};

function DesktopNav({ pathname }) {
  return (
    <nav className="hidden md:flex flex-1 flex-wrap items-center gap-3">
      {navItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant="ghost"
          size="sm"
          className={`rounded-full px-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground ${
            isActivePath(pathname, item.href) ? "text-primary" : ""
          }`}
        >
          <Link to={item.href}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  );
}

function MobileNav({ pathname }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-6">
        <div className="flex items-center gap-2 px-2 pt-4">
          <img
            src="/favicon.svg"
            alt=""
            role="presentation"
            aria-hidden="true"
            className="h-7 w-7"
          />
          <span className="text-lg font-semibold">{texts.brand.name}</span>
        </div>
        <div className="flex flex-col gap-3 px-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={`justify-start text-base font-semibold ${
                isActivePath(pathname, item.href) ? "text-primary" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Link to={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
        <div className="px-2">
          <Button asChild className="w-full" onClick={() => setIsOpen(false)}>
            <Link to="/challenge">{texts.brand.punchline}</Link>
          </Button>
        </div>
        <div className="px-2 pb-6">
          <ThemeToggle className="w-full justify-center" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Header() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <Card className="sticky top-4 z-40 border-border/70 bg-card/95/90 px-5 py-4 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt=""
              role="presentation"
              aria-hidden="true"
              className="h-10 w-10 md:h-11 md:w-11"
            />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                {texts.brand.name}
              </span>
              <span className="text-xs text-muted-foreground">{texts.brand.tagline}</span>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <DesktopNav pathname={pathname} />
          <ThemeToggle className="hidden md:inline-flex" />
          <Button asChild size="sm" className="hidden md:inline-flex rounded-full px-6">
            <Link to="/challenge">{texts.brand.punchline}</Link>
          </Button>
          <MobileNav pathname={pathname} />
        </div>
      </div>
    </Card>
  );
}
