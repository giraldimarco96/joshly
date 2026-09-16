// Ricerca libri su Open Library (openlibrary.org), gratuita e senza chiave API.
// Qui funziona davvero (a differenza del prototipo pubblicato come Artifact),
// perché questo è un sito vero senza le restrizioni di rete di quella sandbox.

export type OpenLibraryResult = {
  key: string;
  title: string;
  author: string;
  year: number | null;
  pages: number | null;
  isbn: string | null;
  coverUrl: string | null;
};

function coverUrlFromId(coverId: number | undefined, size: "S" | "M" | "L" = "M") {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;
}

export async function searchByTitle(query: string): Promise<OpenLibraryResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query
  )}&limit=10&fields=key,title,author_name,first_publish_year,number_of_pages_median,cover_i,isbn`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Ricerca non riuscita: " + res.status);
  const data = await res.json();
  type RawDoc = {
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    number_of_pages_median?: number;
    cover_i?: number;
    isbn?: string[];
  };
  const docs: RawDoc[] = data.docs || [];
  return docs.map((d) => ({
    key: d.key,
    title: d.title,
    author: (d.author_name && d.author_name[0]) || "Autore sconosciuto",
    year: d.first_publish_year ?? null,
    pages: d.number_of_pages_median ?? null,
    isbn: (d.isbn && d.isbn[0]) || null,
    coverUrl: coverUrlFromId(d.cover_i),
  }));
}

export async function searchByIsbn(isbn: string): Promise<OpenLibraryResult | null> {
  const clean = isbn.replace(/[^0-9Xx]/g, "");
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Ricerca ISBN non riuscita: " + res.status);
  const data = await res.json();
  const entry = data["ISBN:" + clean];
  if (!entry) return null;
  return {
    key: entry.key || clean,
    title: entry.title,
    author: (entry.authors && entry.authors[0] && entry.authors[0].name) || "Autore sconosciuto",
    year: entry.publish_date ? parseInt(String(entry.publish_date).slice(-4), 10) || null : null,
    pages: entry.number_of_pages ?? null,
    isbn: clean,
    coverUrl: entry.cover ? entry.cover.medium || entry.cover.large || entry.cover.small : null,
  };
}

export function looksLikeIsbn(query: string): boolean {
  const digits = query.replace(/[^0-9Xx]/g, "");
  return digits.length === 10 || digits.length === 13;
}
