import React from "react";
import { clsx } from "clsx";

export function Badge({ className, children, ...props }) {
  return (
    <span className={clsx("ui-badge", className)} {...props}>
      {children}
    </span>
  );
}
