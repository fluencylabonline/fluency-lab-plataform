"use client";
import Link from "next/link";
import { Construction, ALargeSmall, Music, Layers, LucideIcon } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  wordle: ALargeSmall,
  music: Music,
  layers: Layers,
};

interface CarouselActivity {
  title: string;
  icon: string;
  color: string;
  href: string;
  comingSoon?: boolean;
}

interface ActivityCarouselProps {
  items: CarouselActivity[];
}

export function ActivityCarousel({ items }: ActivityCarouselProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-muted-foreground ml-1">
        Prática
      </h3>
      
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {items.map((item, index) => {
            const IconComponent = ICON_MAP[item.icon] || Construction;
            
            return (
              <CarouselItem
                key={item.title}
                className="basis-1/2 md:basis-1/4 lg:basis-1/5 pl-4"
              >
                <Link 
                  href={item.comingSoon ? "#" : item.href}
                  className={cn(
                    "item block relative aspect-square overflow-hidden group transition-all duration-300",
                    item.color,
                    item.comingSoon && "opacity-80 cursor-default"
                  )}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white z-10">
                    <span className="text-xl font-black tracking-tight drop-shadow-md">{item.title}</span>
                    
                    {item.comingSoon && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-md border border-white/10">
                        <Construction className="h-3 w-3" />
                        Em construção
                      </div>
                    )}
                  </div>

                  {/* Background Icon */}
                  <IconComponent className="absolute -right-6 -bottom-6 h-32 w-32 opacity-15 -rotate-12 transition-all duration-500 group-hover:scale-125 group-hover:rotate-0 group-hover:opacity-25" />

                {/* Hover overlay effect */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Link>
            </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
