"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

export type OtpStatus = "idle" | "success" | "error";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Disparado assim que o último dígito é digitado ou colado. */
  onComplete?: (value: string) => void;
  length?: number;
  status?: OtpStatus;
  disabled?: boolean;
  className?: string;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

/**
 * Código numérico em caixas individuais.
 *
 * Não usa <input>: assim o teclado nativo do aparelho nunca abre (e não
 * esconde nem desloca a UI no mobile/PWA). Em telas de toque mostra um
 * teclado numérico próprio; no desktop captura o teclado físico e o colar.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  status = "idle",
  disabled = false,
  className,
}: OtpInputProps) {
  const boxesRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Bloqueado enquanto verifica ou depois de acertar. No erro continua
  // liberado para apagar.
  const locked = disabled || status === "success";

  const apply = useCallback(
    (next: string) => {
      const clean = next.replace(/\D/g, "").slice(0, length);
      if (clean === valueRef.current) return;
      valueRef.current = clean;
      onChange(clean);
      if (clean.length === length) onComplete?.(clean);
    },
    [length, onChange, onComplete],
  );

  const press = useCallback(
    (key: string) => {
      if (locked) return;
      const current = valueRef.current;
      if (key === "del") apply(current.slice(0, -1));
      else if (current.length < length && status !== "error") apply(current + key);
    },
    [apply, length, locked, status],
  );

  useEffect(() => {
    if (locked) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        press("del");
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      const digits = (e.clipboardData?.getData("text") ?? "").replace(/\D/g, "");
      if (!digits) return;
      e.preventDefault();
      // Colar sobre um código com erro substitui; senão, completa o que falta.
      const base = status === "error" ? "" : valueRef.current;
      apply((base + digits).slice(0, length));
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("paste", onPaste);
    };
  }, [locked, press, apply, length, status]);

  // Tremida quando o código está errado.
  useEffect(() => {
    if (status !== "error") return;
    boxesRef.current?.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(6px)" },
        { transform: "translateX(-3px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 450, easing: "ease-in-out" },
    );
  }, [status]);

  const cursor = status === "idle" && !locked ? Math.min(value.length, length - 1) : -1;

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div
        ref={boxesRef}
        className="flex justify-center gap-2"
        role="group"
        aria-label="Código de verificação"
      >
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex h-14 w-11 items-center justify-center rounded-md border font-mono text-2xl font-bold transition-colors",
              "border-border bg-muted/30 text-foreground",
              i === cursor && "border-primary ring-2 ring-primary/30",
              status === "success" && "border-green-500 bg-green-500/10 text-green-500",
              status === "error" && "border-red-500 bg-red-500/10 text-red-500",
              disabled && status === "idle" && "opacity-60",
            )}
          >
            {value[i] ?? ""}
          </div>
        ))}
      </div>

      {/* Teclado próprio — só em telas de toque. */}
      <div className="hidden w-full max-w-[260px] grid-cols-3 gap-2 [@media(pointer:coarse)]:grid">
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={locked}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => press(key)}
              aria-label={key === "del" ? "Apagar" : key}
              className="flex h-12 items-center justify-center rounded-md border border-border bg-muted/30 text-xl font-semibold transition-colors active:bg-muted disabled:opacity-50"
            >
              {key === "del" ? <Delete className="size-5" /> : key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
