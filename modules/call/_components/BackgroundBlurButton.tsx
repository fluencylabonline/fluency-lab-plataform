"use client";

import { useBackgroundFilters } from "@stream-io/video-react-sdk";
import { Aperture } from "lucide-react";
import { ControlButton } from "./ControlButton";
import { cn } from "@/lib/utils";

export const BLUR_STORAGE_KEY = "fluency:call-background-blur";

/** Preferência salva do usuário (blur ligado por padrão na próxima chamada). */
export function readBlurPreference(): boolean {
  try {
    return localStorage.getItem(BLUR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveBlurPreference(enabled: boolean) {
  try {
    localStorage.setItem(BLUR_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // storage indisponível — a preferência só não persiste
  }
}

/** Liga/desliga o desfoque do fundo da câmera. Some em navegadores sem suporte. */
export const BackgroundBlurButton = ({ className }: { className?: string }) => {
  const {
    isSupported,
    isLoading,
    backgroundFilter,
    applyBackgroundBlurFilter,
    disableBackgroundFilter,
  } = useBackgroundFilters();

  if (!isSupported) return null;

  const isActive = backgroundFilter === "blur";

  const handleToggle = () => {
    if (isLoading) return;
    if (isActive) {
      disableBackgroundFilter();
      saveBlurPreference(false);
    } else {
      applyBackgroundBlurFilter("high");
      saveBlurPreference(true);
    }
  };

  return (
    <ControlButton
      onClick={handleToggle}
      isEnabled={true}
      enabledIcon={Aperture}
      disabledIcon={Aperture}
      className={cn(
        isActive &&
          "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-700",
        isLoading && "opacity-60 animate-pulse",
        className,
      )}
    />
  );
};
