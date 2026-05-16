"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import { WordLookup } from "../WordLookup";

type WordLadderLearningPanelProps = {
  word: string;
  lang: string;
  enabled: boolean;
};

export function WordLadderLearningPanel({
  word,
  lang,
  enabled,
}: WordLadderLearningPanelProps) {
  return (
    <WordLookup word={word} lang={lang} enabled={enabled}>
      {({ detailsLoading, details, imageLoading, image, retry }) => (
        <div className="w-full max-w-lg rounded-3xl border border-border/50 bg-background/80 backdrop-blur-md p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/5">
          <div className="flex flex-col items-center justify-center space-y-1 pb-4 border-b border-border/50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-full">
              Modo aprendizagem
            </span>
            <h2 className="text-3xl font-black tracking-widest text-foreground uppercase drop-shadow-sm">
              {word || "—"}
            </h2>
          </div>

          <div className="mt-4 overflow-y-auto max-h-[45vh] pr-2 custom-scrollbar">
            {!enabled ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60">
                <div className="text-muted-foreground text-sm max-w-[260px]">
                  Ative o modo aprendizagem para ver significado, exemplos e
                  imagem.
                </div>
              </div>
            ) : detailsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Spinner className="w-8 h-8 text-primary animate-spin-slow" />
                <span className="text-sm text-muted-foreground font-medium animate-pulse">
                  Buscando no dicionário...
                </span>
              </div>
            ) : !details ? (
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60">
                <div className="text-muted-foreground text-sm max-w-[260px]">
                  Não conseguimos encontrar os detalhes para esta palavra.
                </div>
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={retry}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-5 pb-2">
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 space-y-3 transition-colors hover:bg-muted/40">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider opacity-80">
                    <span className="text-primary">🖼️</span> Imagem
                  </h3>

                  {imageLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Spinner className="w-6 h-6 text-primary animate-spin-slow" />
                    </div>
                  ) : !image ? (
                    <p className="text-sm italic text-muted-foreground pl-7">
                      Nenhuma imagem encontrada.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative w-full aspect-video overflow-hidden rounded-md border border-border/40 bg-muted/40">
                        <Image
                          src={image.urls.regular || image.urls.small}
                          alt={
                            image.altDescription ||
                            image.description ||
                            `Imagem de ${word}`
                          }
                          fill
                          sizes="(max-width: 640px) 100vw, 512px"
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Foto por{" "}
                        <a
                          className="underline underline-offset-4 hover:text-foreground"
                          href={`https://unsplash.com/@${encodeURIComponent(
                            image.author.username
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {image.author.name}
                        </a>{" "}
                        no{" "}
                        <a
                          className="underline underline-offset-4 hover:text-foreground"
                          href={image.links.html}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Unsplash
                        </a>
                        .
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 space-y-3 transition-colors hover:bg-muted/40">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider opacity-80">
                    <span className="text-primary">📖</span> Significados
                  </h3>
                  {details.definitions.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground pl-7">
                      Nenhuma definição encontrada.
                    </p>
                  ) : (
                    <ul className="space-y-3 pl-1 text-foreground/90 text-[15px] leading-relaxed">
                      {details.definitions.slice(0, 3).map((d, idx) => (
                        <li
                          key={`def-${idx}`}
                          className="flex items-start gap-3"
                        >
                          <span className="text-primary/60 font-bold text-sm mt-0.5 select-none">
                            {idx + 1}.
                          </span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 space-y-3 transition-colors hover:bg-muted/40">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider opacity-80">
                    <span className="text-primary">💬</span> Exemplos de uso
                  </h3>
                  {details.examples.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground pl-7">
                      Nenhum exemplo encontrado.
                    </p>
                  ) : (
                    <div className="space-y-3 pl-1">
                      {details.examples.slice(0, 3).map((ex, idx) => (
                        <blockquote
                          key={`ex-${idx}`}
                          className="relative border-l-2 border-primary/40 pl-4 py-1.5 text-muted-foreground italic text-[15px] bg-linear-to-r from-primary/5 to-transparent rounded-r-lg"
                        >
                          &ldquo;{ex}&rdquo;
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </WordLookup>
  );
}
