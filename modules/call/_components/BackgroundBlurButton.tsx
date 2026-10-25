"use client";

import { useEffect, useRef, useState } from "react";
import { useBackgroundFilters } from "@stream-io/video-react-sdk";
import { Aperture } from "lucide-react";
import { ControlButton } from "./ControlButton";
import { cn } from "@/lib/utils";

export const BLUR_STORAGE_KEY = "fluency:call-background-blur";

export type BlurLevel = "low" | "medium" | "high";

const LEVELS: { value: BlurLevel; label: string }[] = [
  { value: "low", label: "Leve" },
  { value: "medium", label: "Médio" },
  { value: "high", label: "Forte" },
];

const DEFAULT_LEVEL: BlurLevel = "medium";

/** Preferência salva: nível do blur, ou null se estava desligado. */
export function readBlurPreference(): BlurLevel | null {
  try {
    const stored = localStorage.getItem(BLUR_STORAGE_KEY);
    return LEVELS.some((l) => l.value === stored) ? (stored as BlurLevel) : null;
  } catch {
    return null;
  }
}

function saveBlurPreference(level: BlurLevel | null) {
  try {
    localStorage.setItem(BLUR_STORAGE_KEY, level ?? "off");
  } catch {
    // storage indisponível — a preferência só não persiste
  }
}

/**
 * Botão de desfoque do fundo da câmera. O clique abre um painel com o
 * controle de nível; some em navegadores sem suporte.
 */
export const BackgroundBlurButton = ({ className }: { className?: string }) => {
  const {
    isSupported,
    isLoading,
    backgroundFilter,
    backgroundBlurLevel,
    applyBackgroundBlurFilter,
    disableBackgroundFilter,
  } = useBackgroundFilters();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!isSupported) return null;

  const isActive = backgroundFilter === "blur";
  const currentLevel: BlurLevel = LEVELS.some((l) => l.value === backgroundBlurLevel)
    ? (backgroundBlurLevel as BlurLevel)
    : DEFAULT_LEVEL;
  const levelIndex = LEVELS.findIndex((l) => l.value === currentLevel);

  const applyLevel = (level: BlurLevel) => {
    applyBackgroundBlurFilter(level);
    saveBlurPreference(level);
  };

  const handleDisable = () => {
    disableBackgroundFilter();
    saveBlurPreference(null);
  };

  return (
    <div ref={containerRef} className="relative">
      <ControlButton
        onClick={() => setOpen((prev) => !prev)}
        isEnabled={true}
        enabledIcon={Aperture}
        disabledIcon={Aperture}
        className={cn(
          isActive &&
            "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-700",
          isLoading && "opacity-60 animate-pulse",
          className,
        )}
      />

      {open && (
        <div className="absolute bottom-full left-1/2 mb-3 w-56 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900 z-50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Desfocar fundo
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              disabled={isLoading}
              onClick={() => (isActive ? handleDisable() : applyLevel(currentLevel))}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors disabled:opacity-60",
                isActive ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  isActive && "translate-x-4",
                )}
              />
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={LEVELS.length - 1}
            step={1}
            value={levelIndex}
            onChange={(e) => applyLevel(LEVELS[Number(e.target.value)].value)}
            aria-label="Intensidade do desfoque"
            className="w-full accent-indigo-600"
          />
          <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {LEVELS.map((l) => (
              <span
                key={l.value}
                className={cn(isActive && l.value === currentLevel && "text-indigo-600 dark:text-indigo-400")}
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
