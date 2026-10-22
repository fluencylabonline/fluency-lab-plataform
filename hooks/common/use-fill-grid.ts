"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

/** [largura mínima da janela em px, colunas], da maior para a menor (mesmos breakpoints do Tailwind). */
export type GridBreakpoints = ReadonlyArray<readonly [number, number]>;

/** Abaixo disso o layout não tem altura fixa (a página rola normalmente). */
const DESKTOP_MIN_WIDTH = 1024;

interface UseFillGridOptions {
  breakpoints: GridBreakpoints;
  /** Altura mínima de um card: define quantas linhas cabem na área medida. */
  minCardHeight: number;
  gap?: number;
  maxRows?: number;
  /** Linhas por página quando a altura não é fixa (celular e tablet). */
  mobileRows?: number;
}

/**
 * Grade que ocupa toda a área disponível sem rolagem: mede a altura do contêiner (ref), calcula
 * quantas linhas cabem e estica os cards para preencher. O tamanho da página (colunas × linhas)
 * alimenta a paginação.
 */
export function useFillGrid({ breakpoints, minCardHeight, gap = 16, maxRows = 6, mobileRows = 3 }: UseFillGridOptions) {
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Ref de callback: liga o ResizeObserver quando o contêiner aparece (mesmo que mude de elemento).
  const ref = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;
    setHeight(node.clientHeight);
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // Sem largura conhecida (servidor / primeiro render) assume tela grande.
  const w = width ?? Infinity;
  const columns = breakpoints.find(([min]) => w >= min)?.[1] ?? 1;
  const isDesktop = w >= DESKTOP_MIN_WIDTH;
  const fitted = Math.floor((height + gap) / (minCardHeight + gap));
  const rows = isDesktop ? Math.min(maxRows, Math.max(1, height > 0 ? fitted : 2)) : mobileRows;

  const style: CSSProperties = {
    gap,
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridTemplateRows: isDesktop ? `repeat(${rows}, minmax(0, 1fr))` : undefined,
  };

  return { ref, style, columns, rows, pageSize: columns * rows };
}
