"use client";

import { useEffect, useRef, useState } from "react";
import { useBackgroundFilters } from "@stream-io/video-react-sdk";
import { Aperture } from "lucide-react";
import { ControlButton } from "./ControlButton";
import { cn } from "@/lib/utils";

export const BLUR_STORAGE_KEY = "fluency:call-background-blur";

/**
 * Intensidade do desfoque. O Stream aceita um número: o raio satura em 10 e o
 * sigma em ~13, então acima de `MAX_BLUR` não muda mais nada. Os níveis nomeados
 * do SDK (low/medium/high = 3/5/7) ficavam muito aquém desse teto.
 */
export const MIN_BLUR = 1;
export const MAX_BLUR = 14;
const DEFAULT_BLUR = 8;

const clampBlur = (value: number) =>
  Math.min(MAX_BLUR, Math.max(MIN_BLUR, Math.round(value)));

/** Preferência salva: intensidade do blur, ou null se estava desligado. */
export function readBlurPreference(): number | null {
  try {
    const stored = localStorage.getItem(BLUR_STORAGE_KEY);
    if (stored === null || stored === "off") return null;
    // Valores antigos eram nomeados (low/medium/high)
    const legacy: Record<string, number> = { low: 3, medium: 5, high: 7 };
    const value = stored in legacy ? legacy[stored] : Number(stored);
    return Number.isFinite(value) ? clampBlur(value) : null;
  } catch {
    return null;
  }
}

function saveBlurPreference(level: number | null) {
  try {
    localStorage.setItem(BLUR_STORAGE_KEY, level === null ? "off" : String(level));
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
  // Valor enquanto o slider é arrastado. Cada mudança real de nível recria o
  // filtro e reinicia a câmera no SDK, então só aplicamos ao soltar.
  const [draft, setDraft] = useState<number | null>(null);
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
  const currentLevel =
    typeof backgroundBlurLevel === "number"
      ? clampBlur(backgroundBlurLevel)
      : DEFAULT_BLUR;

  const applyLevel = (level: number) => {
    applyBackgroundBlurFilter(level);
    saveBlurPreference(level);
  };

  const commitDraft = () => {
    if (draft === null) return;
    if (draft !== currentLevel || !isActive) applyLevel(draft);
    setDraft(null);
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
            min={MIN_BLUR}
            max={MAX_BLUR}
            step={1}
            value={draft ?? currentLevel}
            onChange={(e) => setDraft(Number(e.target.value))}
            onPointerUp={commitDraft}
            onKeyUp={commitDraft}
            onBlur={commitDraft}
            aria-label="Intensidade do desfoque"
            className="w-full accent-indigo-600"
          />
          <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span>Leve</span>
            <span>Muito desfocado</span>
          </div>
        </div>
      )}
    </div>
  );
};
