"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ImmersionGameHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function ImmersionGameHeader({ children, className }: ImmersionGameHeaderProps) {
  return (
    <div className={cn("w-full max-w-lg flex justify-end px-2 gap-2 flex-wrap", className)}>
      {children}
    </div>
  );
}

