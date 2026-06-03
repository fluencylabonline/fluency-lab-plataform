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
    const lightColor = "#f8fafc"; // Cinza bem claro (background do tema claro)
    const darkColor = "#030714";  // Cor escura (background do tema escuro/layout default)

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