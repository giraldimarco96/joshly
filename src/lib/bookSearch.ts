// Combina Open Library e Google Books in un'unica ricerca: se una delle due
// fonti non trova nulla (o fallisce), l'altra ha comunque la sua chance.
// Utile soprattutto per libri italiani o di nicchia, poco coperti da Open Library.

import { OpenLibraryResult, looksLikeIsbn, searchByIsbn, searchByTitle } from "./openLibrary";
import { searchGoogleBooksByIsbn, searchGoogleBooksByTitle } from "./googleBooks";

export type { OpenLibraryResult as BookResult };
export { looksLikeIsbn };

function normalizeKey(r: OpenLibraryResult): string {
  if (r.isbn) return "isbn:" + r.isbn.replace(/[^0-9Xx]/g, "").toLowerCase();
  return "ta:" + (r.title + "|" + r.author).toLowerCase().replace(/\s+/g, " ").trim();
}

function dedupe(results: OpenLibraryResult[]): OpenLibraryResult[] {
  const seen = new Set<string>();
  const out: OpenLibraryResult[] = [];
  for (const r of results) {
    const key = normalizeKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export async function searchBooksByTitle(query: string): Promise<OpenLibraryResult[]> {
  const [ol, gb] = await Promise.allSettled([searchByTitle(query), searchGoogleBooksByTitle(query)]);
  const results: OpenLibraryResult[] = [];
  if (ol.status === "fulfilled") results.push(...ol.value);
  if (gb.status === "fulfilled") results.push(...gb.value);
  // Se ENTRAMBE le fonti falliscono (es. nessuna connessione), segnaliamolo al chiamante.
  if (ol.status === "rejected" && gb.status === "rejected") {
    throw ol.reason;
  }
  return dedupe(results).slice(0, 12);
}

export async function searchBookByIsbn(isbn: string): Promise<OpenLibraryResult | null> {
  const [ol, gb] = await Promise.allSettled([searchByIsbn(isbn), searchGoogleBooksByIsbn(isbn)]);
  const olResult = ol.status === "fulfilled" ? ol.value : null;
  const gbResult = gb.status === "fulfilled" ? gb.value : null;
  if (ol.status === "rejected" && gb.status === "rejected") {
    throw ol.reason;
  }
  if (!olResult) return gbResult;
  if (!gbResult) return olResult;
  // Preferiamo il risultato con più informazioni utili (copertina e pagine).
  const olScore = (olResult.coverUrl ? 1 : 0) + (olResult.pages ? 1 : 0);
  const gbScore = (gbResult.coverUrl ? 1 : 0) + (gbResult.pages ? 1 : 0);
  return gbScore > olScore ? gbResult : olResult;
}
