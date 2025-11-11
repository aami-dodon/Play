import React, { forwardRef } from "react";
import { clsx } from "clsx";

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={clsx("ui-input", className)} {...props} />;
});
