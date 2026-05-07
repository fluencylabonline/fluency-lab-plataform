import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";

function uniqStrings(list: string[], max: number) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const v = typeof raw === "string" ? raw.trim() : "";
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

function stripWikitext(input: string) {
  return input
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\{\{[\s\S]*?\}\}/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/''+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractWikilinks(line: string) {
  const out: string[] = [];
  const re = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const raw = (m[2] || m[1] || "").trim();
    const cleaned = stripWikitext(raw);
    if (cleaned) out.push(cleaned);
  }
  return out;
}

function extractSinonimosTemplate(line: string) {
  const out: string[] = [];
  const re = /\{\{\s*sinônimos?\s*\|([^}]+)\}\}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const body = String(m[1] || "");
    const parts = body
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);
    for (const p of parts) {
      if (/^(pt|pt-br|pt_br)$/i.test(p)) continue;
      if (/^\d+$/.test(p)) continue;
      const cleaned = stripWikitext(p);
      if (cleaned) out.push(cleaned);
    }
  }
  return out;
}

interface WiktionarySearchHit {
  title?: string;
}

interface WiktionaryPage {
  missing?: boolean;
  revisions?: {
    slots?: {
      main?: {
        content?: string;
      };
    };
    content?: string;
  }[];
  title?: string;
}

interface WiktionaryQueryResponse {
  query?: {
    pages?: WiktionaryPage[];
    search?: WiktionarySearchHit[];
  };
}

async function fetchEnglishDefinition(word: string) {
  try {
    const dictRes = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        word
      )}`,
      { cache: "no-store" }
    );
    if (!dictRes.ok) {
      return { definitions: [], synonyms: [], examples: [] };
    }
    const json = await dictRes.json();
    const definitions: string[] = [];
    const synonymsSet = new Set<string>();
    const examples: string[] = [];
    if (Array.isArray(json)) {
      for (const entry of json) {
        const meanings = entry?.meanings || [];
        for (const m of meanings) {
          const defs = m?.definitions || [];
          for (const d of defs) {
            if (d?.definition) definitions.push(String(d.definition));
            if (Array.isArray(d?.synonyms)) {
              d.synonyms.forEach((s: unknown) => {
                if (typeof s === "string") synonymsSet.add(s);
              });
            }
            if (d?.example) examples.push(String(d.example));
          }
          if (Array.isArray(m?.synonyms)) {
            m.synonyms.forEach((s: unknown) => {
              if (typeof s === "string") synonymsSet.add(s);
            });
          }
        }
      }
    }
    if (synonymsSet.size === 0) {
      const dmRes = await fetch(
        `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(
          word
        )}&max=10`,
        { cache: "no-store" }
      );
      if (dmRes.ok) {
        const list = await dmRes.json();
        if (Array.isArray(list)) {
          list.forEach((x: unknown) => {
            if (x && typeof x === "object" && "word" in x) {
              const entry = x as { word: unknown };
              if (typeof entry.word === "string") {
                synonymsSet.add(entry.word);
              }
            }
          });
        }
      }
    }
    return {
      definitions,
      synonyms: Array.from(synonymsSet),
      examples,
    };
  } catch {
    return { definitions: [], synonyms: [], examples: [] };
  }
}

async function fetchWiktionaryWikitextByTitle(title: string) {
  const api = new URL("https://pt.wiktionary.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("formatversion", "2");
  api.searchParams.set("prop", "revisions");
  api.searchParams.set("rvprop", "content");
  api.searchParams.set("rvslots", "main");
  api.searchParams.set("redirects", "1");
  api.searchParams.set("titles", title);

  const res = await fetch(api.toString(), { cache: "no-store" });
  if (!res.ok) return "";
  const json = (await res.json()) as WiktionaryQueryResponse;
  const page = Array.isArray(json?.query?.pages) ? json.query.pages[0] : null;
  if (!page || page.missing) return "";
  const wikitext =
    typeof page?.revisions?.[0]?.slots?.main?.content === "string"
      ? page.revisions[0].slots.main.content
      : typeof page?.revisions?.[0]?.content === "string"
        ? page.revisions[0].content
        : "";
  return typeof wikitext === "string" ? wikitext : "";
}

async function searchWiktionaryTitle(query: string) {
  const api = new URL("https://pt.wiktionary.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("formatversion", "2");
  api.searchParams.set("list", "search");
  api.searchParams.set("srsearch", query);
  api.searchParams.set("srlimit", "1");

  const res = await fetch(api.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as WiktionaryQueryResponse;
  const hit = Array.isArray(json?.query?.search) ? json.query.search[0] : null;
  const title = typeof hit?.title === "string" ? hit.title : "";
  return title ? title : null;
}

async function searchWiktionaryTitles(query: string, limit: number) {
  const api = new URL("https://pt.wiktionary.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("formatversion", "2");
  api.searchParams.set("list", "search");
  api.searchParams.set("srsearch", query);
  api.searchParams.set("srlimit", String(Math.max(1, Math.min(10, limit))));

  const res = await fetch(api.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as WiktionaryQueryResponse;
  const list = Array.isArray(json?.query?.search) ? json.query.search : [];
  return list
    .map((x) => (typeof x?.title === "string" ? x.title : ""))
    .filter(Boolean);
}

function extractPortugueseDetailsFromWikitext(wikitext: string) {
  const ptHeader = wikitext.match(
    /(^|\n)={1,3}\s*(Portugu[eê]s|\{\{\s*-\s*pt\s*-\s*\}\})\s*={1,3}\s*(\n|$)/i
  );
  if (!ptHeader || typeof ptHeader.index !== "number") return null;

  const after = wikitext.slice(ptHeader.index + ptHeader[0].length);
  const nextLangIndex = after.search(/\n=[^=\n]/);
  const ptSection = nextLangIndex >= 0 ? after.slice(0, nextLangIndex) : after;

  const definitionsRaw: string[] = [];
  const examplesRaw: string[] = [];
  const synonymsRaw: string[] = [];

  const lines = ptSection.split("\n");
  let inSynonyms = false;
  let inExamples = false;
  let activeLevel = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingMatch = line.match(/^(=+)\s*(.*?)\s*\1\s*$/);
    if (headingMatch) {
      const level = headingMatch[1]?.length || 0;
      const title = stripWikitext(headingMatch[2] || "").toLowerCase();
      if (activeLevel === 0 || level <= activeLevel) {
        inSynonyms = false;
        inExamples = false;
        activeLevel = 0;
      }
      if (level >= 3) {
        if (title.includes("sinônim") || title.includes("sinonim")) {
          inSynonyms = true;
          inExamples = false;
          activeLevel = level;
        } else if (title.includes("exemplo")) {
          inExamples = true;
          inSynonyms = false;
          activeLevel = level;
        }
      }
      continue;
    }

    if (/^#+(?![:*])/.test(line)) {
      const def = stripWikitext(line.replace(/^#+\s*/, ""));
      if (def) definitionsRaw.push(def);
      continue;
    }

    if (/^#[:*]+/.test(line)) {
      const ex = stripWikitext(line.replace(/^#[:*]+\s*/, ""));
      if (ex) examplesRaw.push(ex);
      continue;
    }

    if (inExamples && (/^[*#]+/.test(line) || /^:/.test(line))) {
      const ex = stripWikitext(line.replace(/^[*#:]+\s*/, ""));
      if (ex) examplesRaw.push(ex);
    }

    if (inSynonyms) {
      extractSinonimosTemplate(line).forEach((s) => synonymsRaw.push(s));
      extractWikilinks(line).forEach((s) => synonymsRaw.push(s));
    }
  }

  const definitions = uniqStrings(definitionsRaw, 10);
  const synonyms = uniqStrings(synonymsRaw, 10);
  const examples = uniqStrings(examplesRaw, 10);
  if (
    definitions.length === 0 &&
    synonyms.length === 0 &&
    examples.length === 0
  ) {
    return null;
  }
  return { definitions, synonyms, examples };
}

async function fetchPortugueseFromWiktionary(word: string) {
  try {
    const candidates: string[] = [];
    const seen = new Set<string>();
    const addCandidate = (t: string | null | undefined) => {
      const v = typeof t === "string" ? t.trim() : "";
      if (!v) return;
      const key = v.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push(v);
    };

    addCandidate(word);
    addCandidate(await searchWiktionaryTitle(word));
    (await searchWiktionaryTitles(word, 5)).forEach(addCandidate);

    for (const title of candidates) {
      const wikitext = await fetchWiktionaryWikitextByTitle(title);
      if (!wikitext) continue;
      const details = extractPortugueseDetailsFromWikitext(wikitext);
      if (details) return details;
    }

    return { definitions: [], synonyms: [], examples: [] };
  } catch {
    return { definitions: [], synonyms: [], examples: [] };
  }
}

async function fetchPortugueseSynonymsFromOpenDicio(word: string) {
  try {
    const url = `https://opendicio.herokuapp.com/api/v1/syn/${encodeURIComponent(
      word
    )}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as unknown;

    const out: string[] = [];
    const pushFrom = (v: unknown) => {
      if (!v) return;
      if (typeof v === "string") {
        out.push(v);
        return;
      }
      if (Array.isArray(v)) {
        v.forEach(pushFrom);
        return;
      }
      if (typeof v === "object") {
        const obj = v as Record<string, unknown>;
        if (typeof obj.word === "string") out.push(obj.word);
        if (Array.isArray(obj.synonyms)) obj.synonyms.forEach(pushFrom);
        if (Array.isArray(obj.sinonimos)) obj.sinonimos.forEach(pushFrom);
        if (Array.isArray(obj.syns)) obj.syns.forEach(pushFrom);
        if (typeof obj.data === "object" && obj.data) {
          Object.values(obj.data).forEach(pushFrom);
        }
      }
    };

    pushFrom(json);
    const cleaned = out
      .map((s) => stripWikitext(String(s)))
      .filter((s) => s && s.toLowerCase() !== word.toLowerCase());
    return uniqStrings(cleaned, 10);
  } catch {
    return [];
  }
}


export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await checkRateLimit("word_definition", user.id, 100);
  if (!rate.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const lang = (params.get("lang") || "en").toLowerCase();
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }
  if (lang === "en") {
    const data = await fetchEnglishDefinition(q);
    return NextResponse.json(data);
  }
  if (lang === "pt" || lang === "pt-br" || lang === "pt_br") {
    const data = await fetchPortugueseFromWiktionary(q);
    if (data.synonyms.length === 0) {
      const syns = await fetchPortugueseSynonymsFromOpenDicio(q);
      return NextResponse.json({ ...data, synonyms: syns });
    }
    return NextResponse.json(data);
  }
  return NextResponse.json({ definitions: [], synonyms: [], examples: [] });
}
