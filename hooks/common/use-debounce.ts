"use client";

import { useState, useEffect } from "react";

/**
 * Hook para debouncing de valores.
 * Útil para evitar disparos excessivos de buscas ou atualizações enquanto o usuário digita.
 * 
 * @param value O valor a ser debounced
 * @param delay O tempo de espera em ms (default 400ms)
 * @returns O valor após o período de espera
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
