"use client";

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type WordLadderWordsCarouselProps = {
  words: string[];
};

export function WordLadderWordsCarousel({ words }: WordLadderWordsCarouselProps) {
  if (!words.length) return null;

  return (
    <div className="w-full max-w-lg">
      <Carousel opts={{ align: "start" }} className="w-full">
        <CarouselContent>
          {words.map((w, idx) => (
            <CarouselItem key={`${w}-${idx}`}>
              <div className="w-full rounded-3xl border border-border/50 bg-background/80 backdrop-blur-md p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/5">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-full">
                    Passo {idx + 1}
                  </span>
                  <div
                    className={cn(
                      "text-xl font-black tracking-widest uppercase",
                      idx === 0 ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {w}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

