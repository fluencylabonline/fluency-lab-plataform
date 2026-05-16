"use client";

import { Palette, Sun, Moon, Monitor } from "lucide-react";
import { ColorSwitcher } from "@/components/ui/color-switcher";
import { useTheme } from "next-themes";
import { useAppearanceStore } from "@/modules/appearance/appearance.store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function AppearanceSettings() {
    const t = useTranslations("Settings");
    const tc = useTranslations("Common");
    const { setTheme } = useTheme();
    const { mode, setMode } = useAppearanceStore();

    const modes = [
        { value: "light", label: tc("light"), icon: Sun },
        { value: "dark", label: tc("dark"), icon: Moon },
        { value: "system", label: tc("system"), icon: Monitor },
    ] as const;

    return (
        <div className="card p-6 space-y-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <Palette className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">{tc("appearance")}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t("appearanceDesc")}
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="flex flex-col space-y-1">
                        <span className="font-bold">{t("themeColor")}</span>
                        <span className="text-sm text-muted-foreground">
                            {t("themeColorDesc")}
                        </span>
                    </div>
                    <ColorSwitcher />
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col space-y-1">
                        <span className="font-bold">{t("mode")}</span>
                        <span className="text-sm text-muted-foreground">
                            {t("modeDesc")}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {modes.map(({ value, label, icon: Icon }) => (
                            <Button
                                key={value}
                                variant={mode === value ? "default" : "outline"}
                                className={cn(
                                    "flex flex-col h-20 gap-2 items-center justify-center border-2",
                                    mode === value ? "border-primary" : "border-transparent"
                                )}
                                onClick={() => {
                                    setMode(value);
                                    setTheme(value);
                                }}
                            >
                                <Icon className="h-5 w-5 mr-2" />
                                <span className="text-xs">{label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
