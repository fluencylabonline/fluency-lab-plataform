/**
 * Nomes de cache do Service Worker compartilhados entre `sw.ts` e o logout.
 * Sem imports: este arquivo entra também no bundle do Service Worker.
 */

/** Páginas públicas (HTML e RSC) que o SW pode guardar para uso offline. */
export const PUBLIC_PAGES_CACHE = {
  rscPrefetch: "public-pages-rsc-prefetch",
  rsc: "public-pages-rsc",
  html: "public-pages",
} as const;

/**
 * Rotas cujo HTML/RSC não depende de quem está logado. A landing (`/`) fica de
 * fora: ela renderiza com o usuário da sessão.
 */
export const PUBLIC_PAGE_PATHS = ["/privacy", "/terms", "/faq", "/download", "/offline"];

/**
 * Caches que já guardaram (ou podem guardar) respostas de um usuário logado.
 * Os quatro primeiros são das versões antigas do SW, que cacheavam /hub e /api.
 */
export const PRIVATE_CACHE_NAMES = ["pages-rsc-prefetch", "pages-rsc", "pages", "apis", "others"];

/** Apaga do navegador tudo que possa conter dados do usuário que saiu. */
export async function purgePrivateCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  await Promise.all(PRIVATE_CACHE_NAMES.map((name) => caches.delete(name)));
}
