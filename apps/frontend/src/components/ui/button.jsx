import React, { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { clsx } from "clsx";

const buttonVariants = {
  primary: "primary",
  secondary: "secondary",
  ghost: "ghost",
  destructive: "destructive",
};

export const Button = forwardRef(function Button(
  { variant = "primary", asChild = false, className, ...props },
  ref
) {
  const Comp = asChild ? Slot : "button";
  const variantClass = buttonVariants[variant] ?? buttonVariants.primary;

  return (
    <Comp ref={ref} className={clsx("ui-button", variantClass, className)} {...props} />
  );
});
