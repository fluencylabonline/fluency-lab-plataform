"use client";

import useSWR from "swr";
import { useDebounce } from "../common/use-debounce";

interface UseSearchOptions {
  minLength?: number;
  delay?: number;
  domain?: string;
}

/**
 * Hook utilitário para realizar buscas debounced usando SWR.
 * Encapsula a lógica de loading, erro, cache e o atraso (debounce).
 * 
 * @param term O termo de busca (geralmente vindo de um input)
 * @param searchAction A Server Action que realiza a busca
 * @param options Opções de configuração (minLength, delay, domain para o cache key)
 */
export function useSearch<T>(
  term: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchAction: (params: { term: string }) => Promise<any>,
  options: UseSearchOptions = {}
) {
  const { minLength = 2, delay = 400, domain = "general" } = options;
  const debouncedTerm = useDebounce(term, delay);

  const shouldFetch = debouncedTerm.length >= minLength;

  const { data, error, isLoading, isValidating } = useSWR(
    shouldFetch ? ["search", domain, debouncedTerm] : null,
    async () => {
      const result = await searchAction({ term: debouncedTerm });
      
      // Lida com o formato do next-safe-action ou retorno direto
      if (Array.isArray(result)) return result as T[];
      if (result?.data && Array.isArray(result.data)) return result.data as T[];
      
      return [] as T[];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      dedupingInterval: 2000,
    }
  );

  return {
    results: (data || []) as T[],
    error,
    isLoading: isLoading || (shouldFetch && isValidating),
    isSearching: shouldFetch && (isLoading || isValidating),
  };
}
