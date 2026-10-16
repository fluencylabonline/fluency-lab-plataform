/** Converte HTML (saída do Tiptap) em texto corrido. */
export function stripHtml(html: string) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trecho do texto em volta da primeira ocorrência de `query`, ou "" se não houver. */
export function getContentSnippet(content: string, query: string) {
  const stripped = stripHtml(content);
  if (!query.trim()) return "";

  const index = stripped.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return "";

  const start = Math.max(0, index - 40);
  const end = Math.min(stripped.length, index + query.length + 60);

  let snippet = stripped.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < stripped.length) snippet = snippet + "...";

  return snippet;
}
