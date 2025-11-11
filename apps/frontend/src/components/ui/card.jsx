import React from "react";
import { clsx } from "clsx";

export function Card({ as: Component = "section", className, children, ...props }) {
  return (
    <Component className={clsx("ui-card", className)} {...props}>
      {children}
    </Component>
  );
}
