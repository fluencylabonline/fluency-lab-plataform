import { notFound } from "next/navigation";

// Qualquer URL sem rota cai aqui e renderiza app/[locale]/not-found.tsx
// (traduzido, dentro do layout) em vez do 404 padrão do Next.
export default function CatchAllNotFound() {
  notFound();
}
