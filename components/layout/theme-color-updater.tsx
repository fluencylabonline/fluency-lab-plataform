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
    const darkColor = "#121520";  // Cor escura (background do tema escuro/layout default)

    const currentColor = resolvedTheme === "dark" ? darkColor : lightColor;

    // Remove todas as tags meta theme-color existentes para evitar conflitos/duplicações durante a navegação
    const existingMetas = document.querySelectorAll('meta[name="theme-color"]');
    existingMetas.forEach((meta) => meta.remove());

    // Cria e adiciona a nova tag com a cor correta
    const metaThemeColor = document.createElement("meta");
    metaThemeColor.setAttribute("name", "theme-color");
    metaThemeColor.setAttribute("content", currentColor);
    document.head.appendChild(metaThemeColor);
  }, [resolvedTheme, pathname]); // Roda sempre que o tema ou o caminho mudar

  return null; // Este componente não renderiza nada na tela
}