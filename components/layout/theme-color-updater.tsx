"use client";

import { useEffect } from "react";

export function ThemeColorUpdater({ isDarkMode }: { isDarkMode: boolean }) {
  useEffect(() => {
    // Define as cores reais que você quer na barra de status
    // Você pode usar HEX, RGB ou HSL. (Nem todos os navegadores suportam OKLCH na barra de status ainda, prefira HEX).
    const lightColor = "#f3f4f6"; // Exemplo: cinza bem claro
    const darkColor = "#111827";  // Exemplo: quase preto

    const currentColor = isDarkMode ? darkColor : lightColor;

    // Busca a tag meta existente
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (metaThemeColor) {
      // Se existir, atualiza a cor
      metaThemeColor.setAttribute("content", currentColor);
    } else {
      // Se por algum motivo não existir, cria uma nova
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      metaThemeColor.setAttribute("content", currentColor);
      document.head.appendChild(metaThemeColor);
    }
  }, [isDarkMode]); // Roda sempre que isDarkMode mudar

  return null; // Este componente não renderiza nada na tela
}