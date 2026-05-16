"use client";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultBody,
} from "@/components/ui/vault";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { WordLookup } from "../WordLookup";
import { ImmersionButton } from "../ImmersionButton";

type WordleDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word: string;
  lang: string;
  onPlayAgain?: () => void;
};

export function WordleDetailsModal({
  open,
  onOpenChange,
  word,
  lang,
  onPlayAgain,
}: WordleDetailsModalProps) {
  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="max-w-md">
        <WordLookup word={word} lang={lang}>
          {({ detailsLoading, details, imageLoading, image, retry }) => (
            <>
              <VaultHeader>
                <div className="flex flex-col items-center justify-center w-full">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-full mb-1">
                    Palavra do Jogo
                  </span>
                  <VaultTitle className="text-3xl font-black tracking-widest text-foreground uppercase drop-shadow-sm">
                    {word}
                  </VaultTitle>
                </div>
              </VaultHeader>

              <VaultBody className="overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                {detailsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Spinner className="w-8 h-8 text-primary animate-spin-slow" />
                    <span className="text-sm text-muted-foreground font-medium animate-pulse">
                      Buscando detalhes...
                    </span>
                  </div>
                ) : !details ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-10 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60 mx-1">
                    <div className="text-4xl opacity-50">📚</div>
                    <div className="text-muted-foreground text-sm max-w-[220px]">
                      Não conseguimos encontrar as definições para esta palavra agora.
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full px-6"
                      onClick={retry}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pb-6 px-1">
                    {/* Imagem */}
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 space-y-3">
                      <h3 className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider opacity-80">
                        <span className="text-primary text-base">🖼️</span> Imagem Ilustrativa
                      </h3>
                      {imageLoading ? (
                        <div className="flex justify-center py-8">
                          <Spinner className="w-6 h-6 text-primary animate-spin-slow" />
                        </div>
                      ) : !image ? (
                        <p className="text-sm italic text-muted-foreground text-center py-2">
                          Nenhuma imagem disponível.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative w-full h-40 sm:h-48 overflow-hidden rounded-md border border-border/40 bg-muted/40 shadow-sm">
                            <Image
                              src={image.urls.regular || image.urls.small}
                              alt={image.altDescription || `Imagem de ${word}`}
                              fill
                              sizes="(max-width: 640px) 100vw, 512px"
                              className="object-cover transition-transform duration-500 hover:scale-105"
                            />
                          </div>
                          <div className="text-[10px] text-muted-foreground px-1">
                            Foto por{" "}
                            <a
                              className="underline font-medium hover:text-foreground"
                              href={`https://unsplash.com/@${encodeURIComponent(image.author.username)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {image.author.name}
                            </a>{" "}
                            via{" "}
                            <a
                              className="underline font-medium hover:text-foreground"
                              href={image.links.html}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Unsplash
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Significados */}
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 space-y-3">
                      <h3 className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider opacity-80">
                        <span className="text-primary text-base">📖</span> Significados
                      </h3>
                      {details.definitions.length === 0 ? (
                        <p className="text-sm italic text-muted-foreground">
                          Nenhuma definição encontrada.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {details.definitions.slice(0, 3).map((d, idx) => (
                            <li
                              key={`def-${idx}`}
                              className="flex items-start gap-3 text-[15px] leading-snug text-foreground/90"
                            >
                              <span className="flex-none w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Sinônimos */}
                    {details.synonyms.length > 0 && (
                      <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 space-y-3">
                        <h3 className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider opacity-80">
                          <span className="text-primary text-base">✨</span> Sinônimos
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {details.synonyms.slice(0, 6).map((s, idx) => (
                            <span
                              key={`syn-${idx}`}
                              className="text-xs px-3 py-1 rounded-full border border-border/60 bg-background text-foreground/80 shadow-xs font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exemplos */}
                    {details.examples.length > 0 && (
                      <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 space-y-3">
                        <h3 className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider opacity-80">
                          <span className="text-primary text-base">💬</span> Exemplos de Uso
                        </h3>
                        <div className="space-y-3">
                          {details.examples.slice(0, 2).map((ex, idx) => (
                            <blockquote
                              key={`ex-${idx}`}
                              className="border-l-3 border-primary/30 pl-4 py-1 text-[14px] text-muted-foreground italic bg-linear-to-r from-primary/5 to-transparent rounded-r-xl leading-relaxed"
                            >
                              &ldquo;{ex}&rdquo;
                            </blockquote>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {onPlayAgain && (
                  <div className="mt-2 mb-6">
                    <ImmersionButton
                      className="w-full rounded-2xl font-bold text-base h-14 shadow-lg active:scale-[0.97] transition-all"
                      onClick={() => {
                        onOpenChange(false);
                        onPlayAgain();
                      }}
                    >
                      Jogar Nova Palavra
                    </ImmersionButton>
                  </div>
                )}
              </VaultBody>
            </>
          )}
        </WordLookup>
      </VaultContent>
    </Vault>
  );
}
