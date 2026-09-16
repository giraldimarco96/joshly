"use client";

import { useEffect, useState } from "react";
import { Shelf, BookStatus, STATUSES } from "@/lib/types";
import { ShelfIcon } from "@/lib/icons";
import { OpenLibraryResult, looksLikeIsbn, searchByIsbn, searchByTitle } from "@/lib/openLibrary";
import { BarcodeScanner } from "./BarcodeScanner";

export type NewBookInput = {
  title: string;
  author: string;
  pages: number;
  year: number | null;
  shelfId: string;
  status: BookStatus;
  rating: number;
  currentPage: number;
  coverUrl: string | null;
  isbn: string | null;
};

export function AddBookModal({
  open,
  shelves,
  onClose,
  onSave,
}: {
  open: boolean;
  shelves: Shelf[];
  onClose: () => void;
  onSave: (data: NewBookInput) => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<OpenLibraryResult[]>([]);
  const [picked, setPicked] = useState<OpenLibraryResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [currentPage, setCurrentPage] = useState("0");
  const [status, setStatus] = useState<BookStatus>("letto");
  const [rating, setRating] = useState(0);
  const [shelfId, setShelfId] = useState(shelves[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Reset intenzionale del form ogni volta che il modale si (ri)apre.
    /* eslint-disable react-hooks/set-state-in-effect */
    setQuery("");
    setResults([]);
    setPicked(null);
    setSearchError(null);
    setShowScanner(false);
    setTitle("");
    setAuthor("");
    setPages("");
    setYear(String(new Date().getFullYear()));
    setCurrentPage("0");
    setStatus("letto");
    setRating(0);
    setShelfId(shelves[0]?.id || "");
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, shelves]);

  async function runSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      if (looksLikeIsbn(q)) {
        const r = await searchByIsbn(q);
        setResults(r ? [r] : []);
        if (!r) setSearchError("Nessun libro trovato con questo ISBN. Puoi inserirlo a mano qui sotto.");
      } else {
        const r = await searchByTitle(q);
        setResults(r);
        if (r.length === 0) setSearchError("Nessun risultato. Puoi inserirlo a mano qui sotto.");
      }
    } catch {
      setSearchError("Ricerca non riuscita (connessione assente?). Inserisci il libro a mano qui sotto.");
    } finally {
      setSearching(false);
    }
  }

  function pickResult(r: OpenLibraryResult) {
    setPicked(r);
    setTitle(r.title);
    setAuthor(r.author);
    if (r.pages) setPages(String(r.pages));
    if (r.year) setYear(String(r.year));
    setResults([]);
  }

  function onIsbnScanned(isbn: string) {
    setShowScanner(false);
    setQuery(isbn);
    searchByIsbn(isbn)
      .then((r) => {
        if (r) pickResult(r);
        else setSearchError("ISBN letto (" + isbn + ") ma nessun libro trovato: inseriscilo a mano.");
      })
      .catch(() => setSearchError("ISBN letto, ma la ricerca è fallita. Inseriscilo a mano."));
  }

  async function handleSave() {
    setError(null);
    if (!title.trim() || !author.trim()) {
      setError("Titolo e autore sono obbligatori.");
      return;
    }
    if (!shelfId) {
      setError("Scegli uno scaffale.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        author: author.trim(),
        pages: parseInt(pages, 10) || 200,
        year: status === "letto" ? parseInt(year, 10) || new Date().getFullYear() : null,
        shelfId,
        status,
        rating: status === "desiderio" ? 0 : rating,
        currentPage: status === "lettura" ? parseInt(currentPage, 10) || 0 : 0,
        coverUrl: picked?.coverUrl || null,
        isbn: picked?.isbn || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-host" style={{ pointerEvents: open ? "auto" : "none" }}>
      <div className={`box-modal ${open ? "open" : ""}`} role="dialog" aria-label="Aggiungi un libro">
        <div className="modal-head">
          <h2>Nuova scheda</h2>
          <button className="modal-close" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Cerca online (titolo, autore o ISBN)</label>
            <div className="search-row">
              <input
                type="text"
                placeholder="Es. Il Nome della Rosa, oppure un ISBN…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runSearch())}
              />
              <button type="button" onClick={runSearch} disabled={searching}>
                {searching ? "…" : "Cerca"}
              </button>
              <button type="button" className="cam-btn" onClick={() => setShowScanner((s) => !s)} title="Scansiona ISBN">
                📷
              </button>
            </div>
            <p className="search-hint">La scansione da fotocamera funziona sui browser che la supportano (es. Chrome su Android).</p>

            {showScanner && <BarcodeScanner onDetected={onIsbnScanned} onClose={() => setShowScanner(false)} />}

            {searchError && <p className="search-hint">{searchError}</p>}

            {results.length > 0 && (
              <div className="search-results">
                {results.map((r) => (
                  <button type="button" key={r.key} className="search-result" onClick={() => pickResult(r)}>
                    {r.coverUrl ? <img src={r.coverUrl} alt="" /> : <div className="ph" />}
                    <div className="meta">
                      {r.title}
                      <small>
                        {r.author} {r.year ? "· " + r.year : ""}
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {picked && (
              <div className="selected-pick">
                {picked.coverUrl ? <img src={picked.coverUrl} alt="" style={{ width: 24, height: 36, objectFit: "cover" }} /> : null}
                Selezionato: {picked.title}
              </div>
            )}
          </div>

          <div className="field">
            <label>Stato</label>
            <div className="status-picker">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={`status-opt ${status === s.key ? "sel" : ""}`}
                  onClick={() => setStatus(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="fTitle">Titolo</label>
            <input id="fTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Il Nome della Rosa" />
          </div>
          <div className="field">
            <label htmlFor="fAuthor">Autore</label>
            <input id="fAuthor" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Es. Umberto Eco" />
          </div>

          <div className="row2">
            <div className="field">
              <label htmlFor="fPages">Pagine</label>
              <input id="fPages" type="number" min={1} value={pages} onChange={(e) => setPages(e.target.value)} placeholder="320" />
            </div>
            {status === "letto" && (
              <div className="field">
                <label htmlFor="fYear">Anno di lettura</label>
                <input id="fYear" type="number" min={1900} max={2100} value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            )}
            {status === "lettura" && (
              <div className="field">
                <label htmlFor="fCurrentPage">Pagina attuale</label>
                <input id="fCurrentPage" type="number" min={0} value={currentPage} onChange={(e) => setCurrentPage(e.target.value)} />
              </div>
            )}
          </div>

          <div className="field">
            <label>Scaffale</label>
            <div className="genre-grid">
              {shelves.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`genre-chip ${shelfId === s.id ? "sel" : ""}`}
                  onClick={() => setShelfId(s.id)}
                >
                  <ShelfIcon name={s.icon} size={17} />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {status !== "desiderio" && (
            <div className="field">
              <label>Valutazione</label>
              <div className="stars-input">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" className={i <= rating ? "on" : ""} onClick={() => setRating(i)}>
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          <div className="btn-row">
            <button className="primary-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Salvataggio…" : "Metti sullo scaffale"}
            </button>
            <button className="text-btn" onClick={onClose}>
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
