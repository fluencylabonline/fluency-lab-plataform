"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    // Define as cores reais que você quer na barra de status (HEX ou RGB)
    // OKLCH não é suportado na tag meta theme-color por navegadores móveis como o Safari do iOS
    const lightColor = "#f0f0f0"; // Cinza bem claro (oklch(95.514% 0.00011 271.152))
    const darkColor = "#02060e";  // Cor escura (oklch(12.048% 0.02283 254.114))

    const currentColor = resolvedTheme === "dark" ? darkColor : lightColor;

    // Busca todas as tags meta theme-color existentes no documento
    const existingMetas = document.querySelectorAll('meta[name="theme-color"]');

    if (existingMetas.length > 0) {
      // Atualiza os atributos sem remover os elementos do DOM para evitar que o React quebre no commitDeletion
      existingMetas.forEach((meta) => {
        meta.setAttribute("content", currentColor);
        meta.removeAttribute("media");
      });
    } else {
      // Se não existir nenhuma tag, cria uma nova
      const metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      metaThemeColor.setAttribute("content", currentColor);
      document.head.appendChild(metaThemeColor);
    }
  }, [resolvedTheme, pathname]); // Roda sempre que o tema ou o caminho mudar

  return null; // Este componente não renderiza nada na tela
}