"use client";

import { useEffect, useState } from "react";

/** [largura mínima da janela em px, colunas], da maior para a menor (mesmos breakpoints do Tailwind). */
export type GridBreakpoints = ReadonlyArray<readonly [number, number]>;

function compute(breakpoints: GridBreakpoints, rows: number, fallbackColumns: number) {
  const width = typeof window === "undefined" ? Infinity : window.innerWidth;
  const columns = breakpoints.find(([min]) => width >= min)?.[1] ?? fallbackColumns;
  return columns * rows;
}

/**
 * Quantidade de cards por página: colunas da grade × linhas. Assim a página inteira cabe na janela
 * e a paginação (em vez da rolagem) navega pelo resto.
 */
export function useGridPageSize(breakpoints: GridBreakpoints, rows = 2, fallbackColumns = 1, mobileMin = 4) {
  // Render do servidor e primeiro render do cliente usam o tamanho de telas grandes.
  const [size, setSize] = useState(() => breakpoints[0][1] * rows);

  useEffect(() => {
    const update = () => setSize(Math.max(mobileMin, compute(breakpoints, rows, fallbackColumns)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, fallbackColumns, mobileMin, breakpoints.map((b) => b.join(":")).join(",")]);

  return size;
}
