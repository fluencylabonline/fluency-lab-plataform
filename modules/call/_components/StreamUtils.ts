import { cn } from "@/lib/utils";

export const getGlassContainerClasses = (isMobile: boolean) =>
  cn(
    "fixed z-[9999] rounded-3xl overflow-hidden flex flex-col pointer-events-auto",
    "bg-white/80 dark:bg-black/60 backdrop-blur-xl saturate-150",
    "border border-white/20 dark:border-white/10",
    "text-slate-800 dark:text-slate-100 shadow-2xl shadow-black/10",
    "transition-all duration-300",
    isMobile
      ? "bottom-4 left-2 right-2 w-[calc(100vw-1rem)] max-h-[80vh]"
      : "top-24 right-4 bottom-4 w-full max-w-[25vw] max-h-[75vh]",
  );
