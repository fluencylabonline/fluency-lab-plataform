"use client";

import { useEffect } from "react";

export function ThemeColorUpdater({ isDarkMode }: { isDarkMode: boolean }) {
  useEffect(() => {
    // Definimos as cores equivalentes em HEX para máxima compatibilidade móvel
    // (Safari iOS e Chrome Android não suportam consistentemente o formato oklch() na tag meta theme-color)
    const lightColor = "oklch(70.9% 0.00008 271.152)";
    const darkColor = "oklch(12.048% 0.02283 254.114)";

    const currentColor = isDarkMode ? darkColor : lightColor;

    // Remove TODAS as tags meta theme-color existentes para evitar conflitos
    // com as tags estáticas geradas pelo Next.js Viewport (que contêm queries de media e travam a prioridade do navegador)
    const existingMetas = document.querySelectorAll('meta[name="theme-color"]');
    existingMetas.forEach((meta) => meta.remove());

    // Cria uma única tag limpa e atualizada para assumir o controle dinâmico da barra de status no cliente
    const metaThemeColor = document.createElement("meta");
    metaThemeColor.setAttribute("name", "theme-color");
    metaThemeColor.setAttribute("content", currentColor);
    document.head.appendChild(metaThemeColor);
  }, [isDarkMode]); // Roda sempre que o estado do dark mode mudar no cliente

  return null; // Este componente não renderiza nada visualmente
}