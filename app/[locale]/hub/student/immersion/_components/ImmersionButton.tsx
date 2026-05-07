"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImmersionButtonTone = "primary" | "secondary";

type ImmersionButtonProps = Omit<ButtonProps, "size"> & {
  tone?: ImmersionButtonTone;
  size?: ButtonProps["size"];
};

export const ImmersionButton = forwardRef<
  HTMLButtonElement,
  ImmersionButtonProps
>(({ className, tone = "secondary", variant, size = "lg", ...props }, ref) => {
  const resolvedVariant =
    variant ??
    (tone === "secondary" ? ("secondary" as const) : ("default" as const));

  return (
    <Button
      ref={ref}
      size={size}
      variant={resolvedVariant}
      className={cn(
        "rounded-2xl font-bold transition-all active:scale-[0.97] disabled:active:scale-100",
        tone === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-muted/50 text-foreground hover:bg-muted border border-border/50",
        className
      )}
      {...props}
    />
  );
});

ImmersionButton.displayName = "ImmersionButton";
