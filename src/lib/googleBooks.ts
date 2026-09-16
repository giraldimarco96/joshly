// Ricerca libri su Google Books (googleapis.com/books), gratuita e senza chiave API.
// Complementa Open Library: copertura molto migliore per l'editoria italiana
// e di nicchia (teologia, piccoli editori, ecc.), dove Open Library è debole.

import { OpenLibraryResult } from "./openLibrary";

type GoogleVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    pageCount?: number;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
};

function pickIsbn(ids?: { type: string; identifier: string }[]): string | null {
  if (!ids) return null;
  const isbn13 = ids.find((i) => i.type === "ISBN_13");
  if (isbn13) return isbn13.identifier;
  const isbn10 = ids.find((i) => i.type === "ISBN_10");
  return isbn10 ? isbn10.identifier : null;
}

function coverFromThumbnail(url?: string): string | null {
  if (!url) return null;
  // Google restituisce link http (li portiamo a https) e a volte con
  // un parametro che disegna una "piega" sulla copertina: lo togliamo.
  return url.replace(/^http:/, "https:").replace(/&edge=curl/, "");
}

function toResult(v: GoogleVolume): OpenLibraryResult | null {
  const info = v.volumeInfo;
  if (!info || !info.title) return null;
  return {
    key: "googlebooks:" + (pickIsbn(info.industryIdentifiers) || info.title),
    title: info.title,
    author: (info.authors && info.authors[0]) || "Autore sconosciuto",
    year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) || null : null,
    pages: info.pageCount ?? null,
    isbn: pickIsbn(info.industryIdentifiers),
    coverUrl: coverFromThumbnail(info.imageLinks?.thumbnail),
  };
}

export async function searchGoogleBooksByTitle(query: string): Promise<OpenLibraryResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Ricerca Google Books non riuscita: " + res.status);
  const data = await res.json();
  const items: GoogleVolume[] = data.items || [];
  return items.map(toResult).filter((r): r is OpenLibraryResult => r !== null);
}

export async function searchGoogleBooksByIsbn(isbn: string): Promise<OpenLibraryResult | null> {
  const clean = isbn.replace(/[^0-9Xx]/g, "");
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Ricerca ISBN Google Books non riuscita: " + res.status);
  const data = await res.json();
  const items: GoogleVolume[] = data.items || [];
  if (!items.length) return null;
  return toResult(items[0]);
}
