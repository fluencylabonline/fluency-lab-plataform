"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Monta os filhos só quando perto da viewport (mockups pesados não custam nada até aparecerem). */
export function LazyMount({
  children,
  className,
  rootMargin = "400px",
  placeholder,
}: {
  children: ReactNode;
  className?: string;
  rootMargin?: string;
  placeholder?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || on) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [on, rootMargin]);
  return (
    <div ref={ref} className={className}>
      {on ? children : placeholder}
    </div>
  );
}

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}

interface FrameProps {
  children: ReactNode;
  className?: string;
  label?: string;
}

/** Área da tela: mantém a proporção do design e escala o conteúdo para a largura do aparelho. */
function Screen({ designW, designH, children, className }: { designW: number; designH: number; children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-background", className)} style={{ aspectRatio: `${designW} / ${designH}` }}>
      <Scaled designW={designW} designH={designH}>
        {children}
      </Scaled>
    </div>
  );
}

export const PHONE = { w: 430, h: 900 };
export const TABLET = { w: 960, h: 1093 };
export const SCREEN = { w: 1280, h: 800 };

export function Phone({ children, className, label }: FrameProps) {
  return (
    <div className={cn("relative mx-auto w-full", className)} role="group" aria-label={label}>
      {/* botões laterais: ação + volume à esquerda, power à direita */}
      <span aria-hidden className="absolute -left-[3px] top-[13%] h-[3.5%] w-[3px] rounded-l bg-zinc-400 dark:bg-zinc-500" />
      <span aria-hidden className="absolute -left-[3px] top-[19%] h-[7%] w-[3px] rounded-l bg-zinc-400 dark:bg-zinc-500" />
      <span aria-hidden className="absolute -left-[3px] top-[28%] h-[7%] w-[3px] rounded-l bg-zinc-400 dark:bg-zinc-500" />
      <span aria-hidden className="absolute -right-[3px] top-[24%] h-[11%] w-[3px] rounded-r bg-zinc-400 dark:bg-zinc-500" />
      {/* borda metálica + moldura escura */}
      <div className="rounded-[2.4rem] bg-gradient-to-b from-zinc-300 to-zinc-500 p-[2px] shadow-2xl shadow-black/30 dark:from-zinc-400 dark:to-zinc-600">
        <div className="relative rounded-[2.3rem] bg-zinc-950 p-[9px]">
          {/* Dynamic Island */}
          <span aria-hidden className="absolute left-1/2 top-[17px] z-50 aspect-[3.4/1] w-[25%] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/5" />
          <Screen designW={PHONE.w} designH={PHONE.h} className="rounded-[1.8rem] ring-1 ring-white/10">
            {children}
          </Screen>
        </div>
      </div>
    </div>
  );
}

export function Tablet({ children, className, label }: FrameProps) {
  return (
    <div className={cn("relative mx-auto w-full", className)} role="group" aria-label={label}>
      {/* botões laterais */}
      <span aria-hidden className="absolute -right-[3px] top-24 h-14 w-[3px] rounded-r bg-zinc-400 dark:bg-zinc-500" />
      <span aria-hidden className="absolute -right-[3px] top-44 h-9 w-[3px] rounded-r bg-zinc-400 dark:bg-zinc-500" />
      {/* borda metálica + moldura escura, como num tablet de verdade */}
      <div className="rounded-[2rem] bg-gradient-to-b from-zinc-300 to-zinc-500 p-[2px] shadow-2xl shadow-black/30 dark:from-zinc-400 dark:to-zinc-600">
        <div className="relative rounded-[1.9rem] bg-zinc-950 p-[15px]">
          <span aria-hidden className="absolute left-1/2 top-[5px] size-[7px] -translate-x-1/2 rounded-full bg-zinc-700 ring-1 ring-zinc-800" />
          <Screen designW={TABLET.w} designH={TABLET.h} className="rounded-[1rem] ring-1 ring-white/10">
            {children}
          </Screen>
        </div>
      </div>
    </div>
  );
}

/** Notebook: tampa com moldura escura e câmera + base (deck) mais larga com o recorte do trackpad. */
export function Laptop({ children, className, label }: FrameProps) {
  return (
    <div className={cn("relative mx-auto w-full", className)} role="group" aria-label={label}>
      <div className="rounded-t-[1.1rem] bg-gradient-to-b from-zinc-300 to-zinc-500 p-[2px] shadow-2xl shadow-black/25 dark:from-zinc-400 dark:to-zinc-600">
        <div className="relative rounded-t-[1rem] bg-zinc-950 px-[2.2%] pb-[1.4%] pt-[2.6%]">
          <span aria-hidden className="absolute left-1/2 top-[0.9%] size-[5px] -translate-x-1/2 rounded-full bg-zinc-700" />
          <Screen designW={SCREEN.w} designH={SCREEN.h} className="rounded-[4px]">
            {children}
          </Screen>
        </div>
      </div>
      {/* base */}
      <div className="relative -mx-[4.5%] h-[14px] rounded-b-[1.2rem] bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-500 shadow-xl shadow-black/30 dark:from-zinc-500 dark:via-zinc-600 dark:to-zinc-700 md:h-[18px]">
        <span aria-hidden className="absolute left-1/2 top-0 h-[6px] w-[16%] -translate-x-1/2 rounded-b-lg bg-zinc-500/70 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

/** Monitor: painel fino com queixo e pedestal. */
export function Monitor({ children, className, label }: FrameProps) {
  return (
    <div className={cn("relative mx-auto w-full", className)} role="group" aria-label={label}>
      <div className="rounded-[0.9rem] bg-gradient-to-b from-zinc-300 to-zinc-500 p-[2px] shadow-2xl shadow-black/25 dark:from-zinc-400 dark:to-zinc-600">
        <div className="rounded-[0.8rem] bg-zinc-950 p-[1.1%] pb-[0.4%]">
          <Screen designW={SCREEN.w} designH={SCREEN.h} className="rounded-[4px]">
            {children}
          </Screen>
          <div className="flex h-[2.6%] min-h-[14px] items-center justify-center">
            <span aria-hidden className="size-[5px] rounded-full bg-zinc-700" />
          </div>
        </div>
      </div>
      {/* pedestal */}
      <div aria-hidden className="mx-auto h-[7%] min-h-[20px] w-[9%] bg-gradient-to-r from-zinc-400 via-zinc-300 to-zinc-400 dark:from-zinc-600 dark:via-zinc-500 dark:to-zinc-600" style={{ aspectRatio: "auto" }} />
      <div aria-hidden className="mx-auto h-[8px] w-[24%] rounded-full bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-lg shadow-black/30 dark:from-zinc-500 dark:to-zinc-700" />
    </div>
  );
}

interface ScaledProps {
  /** Tamanho "de design" da tela, em px. A tela é desenhada nele e reduzida/ampliada para caber no aparelho. */
  designW: number;
  designH: number;
  children: ReactNode;
  className?: string;
}

/**
 * Desenha o conteúdo num tamanho fixo e o escala (transform) para a largura do
 * pai. Assim as telas mantêm as proporções reais mesmo enquanto o aparelho
 * muda de tamanho durante a animação, sem re-renderizar o React.
 */
export function Scaled({ designW, designH, children, className }: ScaledProps) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const w = o.clientWidth;
      if (w > 0) i.style.transform = `scale(${w / designW})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    return () => ro.disconnect();
  }, [designW]);

  return (
    <div ref={outer} className={cn("absolute inset-0 overflow-hidden", className)}>
      <div
        ref={inner}
        className="relative origin-top-left"
        style={{ width: designW, height: designH }}
      >
        {children}
      </div>
    </div>
  );
}

/** Barra de status do celular (hora + bateria), igual à do PhoneMockup. */
export function PhoneStatusBar() {
  return (
    <div className="absolute top-0 inset-x-0 h-6 z-40 flex justify-between items-center px-6 mt-4 pointer-events-none">
      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">9:41</span>
      <div className="w-6 h-2.5 bg-green-500 rounded-md" />
    </div>
  );
}
