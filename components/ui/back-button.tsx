"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href: string;
  ariaLabel?: string;
  className?: string;
}

export function BackButton({ href, ariaLabel, className }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("rounded-full", className)}
      aria-label={ariaLabel}
    >
      <Link href={href}>
        <ChevronLeft className="h-5 w-5" />
      </Link>
    </Button>
  );
}
