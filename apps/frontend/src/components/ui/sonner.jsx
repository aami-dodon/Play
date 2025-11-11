import { useEffect, useState } from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner } from "sonner";

import { getDocumentTheme, THEME_EVENT } from "@/lib/theme";

const Toaster = ({ ...props }) => {
  const [theme, setTheme] = useState(() => getDocumentTheme());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event) => {
      setTheme(event.detail || getDocumentTheme());
    };

    window.addEventListener(THEME_EVENT, handler);
    return () => window.removeEventListener(THEME_EVENT, handler);
  }, []);

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      {...props}
    />
  );
};

export { Toaster };
