"use client";

import useSWR from "swr";
import { getLanguagesAction } from "@/modules/curriculum/curriculum.actions";

export function useLanguages() {
  const { data, error, isLoading, mutate } = useSWR(
    "curriculum:languages",
    async () => {
      const result = await getLanguagesAction({});
      if (result?.data) return result.data;
      throw new Error(result?.serverError || "Failed to fetch languages");
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  return {
    languages: data || [],
    isLoading,
    error,
    mutate,
  };
}
