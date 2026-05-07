"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

export type WordLookupDetails = {
  definitions: string[];
  synonyms: string[];
  examples: string[];
};

export type WordLookupImage = {
  id: string;
  description: string | null;
  altDescription: string | null;
  urls: {
    regular: string;
    small: string;
  };
  author: {
    name: string;
    username: string;
  };
  links: {
    html: string;
  };
};

export type WordLookupState = {
  word: string;
  lang: string;
  detailsLoading: boolean;
  details: WordLookupDetails | null;
  detailsError: boolean;
  imageLoading: boolean;
  image: WordLookupImage | null;
  imageError: boolean;
  retry: () => void;
};

type WordLookupProps = {
  word: string;
  lang: string;
  enabled?: boolean;
  children: (state: WordLookupState) => ReactNode;
};

export function WordLookup({ word, lang, enabled = true, children }: WordLookupProps) {
  const normalizedWord = useMemo(() => word.trim(), [word]);
  const normalizedLang = useMemo(() => (lang || "en").trim().toLowerCase(), [lang]);

  const [retryKey, setRetryKey] = useState(0);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<WordLookupDetails | null>(null);
  const [detailsError, setDetailsError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [image, setImage] = useState<WordLookupImage | null>(null);
  const [imageError, setImageError] = useState(false);

  const retry = () => setRetryKey((k) => k + 1);

  useEffect(() => {
    if (!enabled || !normalizedWord) {
      queueMicrotask(() => {
        setDetailsLoading(false);
        setDetails(null);
        setDetailsError(false);
        setImageLoading(false);
        setImage(null);
        setImageError(false);
      });
      return;
    }

    const detailsController = new AbortController();
    const imageController = new AbortController();
    const w = normalizedWord;
    const l = normalizedLang;

    queueMicrotask(() => {
      setDetailsLoading(true);
      setDetails(null);
      setDetailsError(false);
      setImageLoading(true);
      setImage(null);
      setImageError(false);
    });

    fetch(`/api/words/definition?q=${encodeURIComponent(w)}&lang=${encodeURIComponent(l)}`, {
      method: "GET",
      signal: detailsController.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const json = (await res.json()) as { definitions?: string[]; synonyms?: string[]; examples?: string[] };
        const defs = Array.isArray(json?.definitions) ? json.definitions : [];
        const syns = Array.isArray(json?.synonyms) ? json.synonyms : [];
        const exs = Array.isArray(json?.examples) ? json.examples : [];
        return {
          definitions: defs.filter((x: unknown) => typeof x === "string"),
          synonyms: syns.filter((x: unknown) => typeof x === "string"),
          examples: exs.filter((x: unknown) => typeof x === "string"),
        } satisfies WordLookupDetails;
      })
      .then((data) => {
        if (detailsController.signal.aborted) return;
        setDetails(data);
      })
      .catch(() => {
        if (detailsController.signal.aborted) return;
        setDetails(null);
        setDetailsError(true);
      })
      .finally(() => {
        if (detailsController.signal.aborted) return;
        setDetailsLoading(false);
      });

    fetch(`/api/images/search?q=${encodeURIComponent(w)}&per_page=1`, {
      method: "GET",
      signal: imageController.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const json = (await res.json()) as { results?: WordLookupImage[] };
        const first = Array.isArray(json?.results) ? json.results[0] : null;
        if (!first) return null;
        return first as WordLookupImage;
      })
      .then((img) => {
        if (imageController.signal.aborted) return;
        setImage(img);
      })
      .catch(() => {
        if (imageController.signal.aborted) return;
        setImage(null);
        setImageError(true);
      })
      .finally(() => {
        if (imageController.signal.aborted) return;
        setImageLoading(false);
      });

    return () => {
      detailsController.abort();
      imageController.abort();
    };
  }, [enabled, normalizedLang, normalizedWord, retryKey]);

  return children({
    word: normalizedWord,
    lang: normalizedLang,
    detailsLoading,
    details,
    detailsError,
    imageLoading,
    image,
    imageError,
    retry,
  });
}

