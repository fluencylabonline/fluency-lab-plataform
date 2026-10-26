"use client";

import type { ElementType } from "react";
import { cn } from "@/lib/utils";

interface RoundButtonProps {
  label: string;
  onClick: () => void;
  icon: ElementType;
  /** `off` pinta de vermelho (mic/câmera desligados); `danger` é o botão de sair. */
  tone?: "default" | "off" | "danger";
  disabled?: boolean;
}

/** Botão redondo de 48px (≥44px de alvo de toque) usado no lobby e na sala. */
export function RoundButton({ label, onClick, icon: Icon, tone = "default", disabled }: RoundButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-full text-white backdrop-blur transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40",
        tone === "default" && "bg-white/20 hover:bg-white/30",
        tone === "off" && "bg-red-500 hover:bg-red-600",
        tone === "danger" && "bg-red-600 hover:bg-red-700"
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
