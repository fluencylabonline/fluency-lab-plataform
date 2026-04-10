"use client";
import { Check } from "lucide-react";
import { useAppearanceStore, ThemeColor } from "@/modules/appearance/appearance.store";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const colorOptions: { value: ThemeColor; bg: string; label: string }[] = [
    { value: "violet", bg: "bg-purple-500", label: "Violeta" },
    { value: "indigo", bg: "bg-indigo-500", label: "Índigo" },
    { value: "rose", bg: "bg-rose-500", label: "Rosa" },
    { value: "yellow", bg: "bg-yellow-500", label: "Amarelo" },
    { value: "green", bg: "bg-green-500", label: "Verde" },
];

export function ColorSwitcher() {
    const { themeColor, setThemeColor } = useAppearanceStore();

    return (
        <TooltipProvider>
            <div className="flex flex-wrap gap-3">
                {colorOptions.map((color) => (
                    <Tooltip key={color.value}>
                        <TooltipTrigger
                            className={cn(
                                "h-8 w-8 rounded-full p-0 border-2 transition-all hover:scale-110 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                                themeColor === color.value
                                    ? "border-primary ring-2 ring-primary/20 ring-offset-2"
                                    : "border-transparent"
                            )}
                            onClick={() => setThemeColor(color.value)}
                        >
                            <div className={cn("h-6 w-6 rounded-full shadow-inner flex items-center justify-center", color.bg)}>
                                {themeColor === color.value && (
                                    <Check className="h-3 w-3 text-white" strokeWidth={4} />
                                )}
                            </div>
                            <span className="sr-only">{color.label}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className="text-xs font-medium">{color.label}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
}