"use client";

import { useEffect, useRef, useState } from "react";
import { Book, Bookmark, Quote, STATUSES, statusLabel } from "@/lib/types";
import { ShelfIcon } from "@/lib/icons";
import { starsString } from "@/lib/spineStyle";
import { createClient } from "@/lib/supabase/client";

export function CoverModal({
  open,
  book,
  shelfName,
  shelfIcon,
  color,
  quotes,
  bookmarks,
  readOnly = false,
  userId,
  onClose,
  onUpdate,
  onDelete,
  onAddQuote,
  onDeleteQuote,
  onAddBookmark,
  onDeleteBookmark,
  onRecommendToFriend,
  onAddToLibrary,
  addedToLibrary = false,
}: {
  open: boolean;
  book: Book | null;
  shelfName: string;
  shelfIcon: string;
  color: string;
  quotes: Quote[];
  bookmarks: Bookmark[];
  readOnly?: boolean;
  userId?: string | null;
  onClose: () => void;
  onUpdate?: (patch: Partial<Book>) => void;
  onDelete?: () => void;
  onAddQuote?: (text: string) => void;
  onDeleteQuote?: (id: string) => void;
  onAddBookmark?: (page: number, note: string) => void;
  onDeleteBookmark?: (id: string) => void;
  onRecommendToFriend?: () => void;
  onAddToLibrary?: () => void;
  addedToLibrary?: boolean;
}) {
  const [review, setReview] = useState("");
  const [quoteInput, setQuoteInput] = useState("");
  const [markPage, setMarkPage] = useState("");
  const [markNote, setMarkNote] = useState("");
  const [pageEdit, setPageEdit] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleCoverFile(file: File | null) {
    if (!file || !book) return;
    setCoverError(null);
    if (!file.type.startsWith("image/")) {
      setCoverError("Scegli un file immagine (JPG, PNG…).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setCoverError("L'immagine è troppo grande (max 8 MB).");
      return;
    }
    setCoverUploading(true);
    try {
      const supabase = createClient();
      const owner = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!owner) throw new Error("Devi essere autenticato per caricare una copertina.");
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${owner}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("covers").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("covers").getPublicUrl(path);
      onUpdate?.({ cover_url: data.publicUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setCoverError("Caricamento non riuscito: " + message);
    } finally {
      setCoverUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (!book) return;
    // Sincronizzazione intenzionale dei campi editabili ogni volta che cambia il libro mostrato
    // (di proposito solo su cambio id, non sull'intero oggetto book che cambia identità più spesso).
    /* eslint-disable react-hooks/set-state-in-effect */
    setReview(book.review || "");
    setPageEdit(String(book.current_page || 0));
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id]);

  if (!book) return null;

  const pct = book.pages ? Math.min(100, Math.round(((book.current_page || 0) / book.pages) * 100)) : 0;

  return (
    <div className="modal-host cover-host" style={{ pointerEvents: open ? "auto" : "none" }}>
      <div className={`cover-box ${open ? "open" : ""}`} role="dialog" aria-label="Copertina del libro">
        <div className="cover-card" style={{ "--sc": color } as React.CSSProperties}>
          <button className="cover-close" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
          <div className="cover-emblem">
            {book.cover_url ? <img src={book.cover_url} alt="" /> : <ShelfIcon name={shelfIcon} size={22} />}
          </div>

          {!readOnly && onUpdate && (
            <div className="cover-change">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleCoverFile(e.target.files?.[0] || null)}
              />
              <button type="button" className="text-btn" onClick={() => fileInputRef.current?.click()} disabled={coverUploading}>
                {coverUploading ? "Caricamento…" : book.cover_url ? "Cambia copertina" : "Aggiungi copertina"}
              </button>
              {coverError && <p className="error-text" style={{ margin: "4px 0 0" }}>{coverError}</p>}
            </div>
          )}

          <h3 className="cover-title">{book.title}</h3>
          <div className="cover-author">{book.author}</div>

          {!readOnly && onUpdate && (
            <div className="status-switch">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={`status-pill ${book.status === s.key ? "active" : ""}`}
                  onClick={() => {
                    const patch: Partial<Book> = { status: s.key };
                    if (s.key === "letto" && !book.year) patch.year = new Date().getFullYear();
                    onUpdate(patch);
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {book.status === "lettura" && book.pages ? (
            <div className="progress-wrap">
              <div className="progress-labels">
                <span>Pagina attuale</span>
                <span>
                  {book.current_page} / {book.pages} ({pct}%)
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: pct + "%" }} />
              </div>
              {!readOnly && onUpdate && (
                <div className="page-edit">
                  <input
                    type="number"
                    min={0}
                    max={book.pages}
                    value={pageEdit}
                    onChange={(e) => setPageEdit(e.target.value)}
                  />
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => onUpdate({ current_page: parseInt(pageEdit, 10) || 0 })}
                  >
                    Aggiorna
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {book.status !== "desiderio" && <div className="cover-stars">{starsString(book.rating)}</div>}

          <div className="cover-meta mono">
            {shelfName} · {book.pages || "?"} pag. ·{" "}
            {book.status === "letto" && book.year ? book.year : statusLabel(book.status)}
          </div>

          <div className="notes-section">
            <h4>Recensione personale</h4>
            {readOnly ? (
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{book.review || "Nessuna recensione ancora."}</p>
            ) : (
              <textarea
                className="review-box"
                placeholder="Cosa ne pensi di questo libro?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                onBlur={() => onUpdate?.({ review })}
              />
            )}
          </div>

          <div className="notes-section">
            <h4>Citazioni preferite</h4>
            <div className="mini-list">
              {quotes.map((q) => (
                <div className="mini-item" key={q.id}>
                  “{q.text}”
                  {!readOnly && onDeleteQuote && (
                    <button className="del" onClick={() => onDeleteQuote(q.id)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && onAddQuote && (
              <div className="mini-add">
                <input
                  className="txt"
                  placeholder="Aggiungi una citazione…"
                  value={quoteInput}
                  onChange={(e) => setQuoteInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (quoteInput.trim()) {
                      onAddQuote(quoteInput.trim());
                      setQuoteInput("");
                    }
                  }}
                >
                  Aggiungi
                </button>
              </div>
            )}
          </div>

          <div className="notes-section">
            <h4>Segnalibri</h4>
            <div className="mini-list">
              {bookmarks
                .slice()
                .sort((a, b) => a.page - b.page)
                .map((m) => (
                  <div className="mini-item" key={m.id}>
                    <span className="pg">p. {m.page}</span>
                    {m.note}
                    {!readOnly && onDeleteBookmark && (
                      <button className="del" onClick={() => onDeleteBookmark(m.id)}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
            </div>
            {!readOnly && onAddBookmark && (
              <div className="mini-add">
                <input
                  className="pgnum"
                  type="number"
                  min={0}
                  placeholder="pag."
                  value={markPage}
                  onChange={(e) => setMarkPage(e.target.value)}
                />
                <input
                  className="txt"
                  placeholder="Nota (facoltativa)"
                  value={markNote}
                  onChange={(e) => setMarkNote(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    const pg = parseInt(markPage, 10);
                    if (!isNaN(pg)) {
                      onAddBookmark(pg, markNote.trim());
                      setMarkPage("");
                      setMarkNote("");
                    }
                  }}
                >
                  Segna
                </button>
              </div>
            )}
          </div>

          {readOnly && onAddToLibrary && (
            <button
              className="primary-btn"
              style={{ width: "100%", marginBottom: 10 }}
              onClick={onAddToLibrary}
              disabled={addedToLibrary}
            >
              {addedToLibrary ? "Aggiunto alla tua lista ✓" : "Aggiungi alla tua lista"}
            </button>
          )}

          {readOnly && onRecommendToFriend && (
            <button className="secondary-btn" style={{ width: "100%", marginBottom: 12 }} onClick={onRecommendToFriend}>
              Consiglialo a un amico
            </button>
          )}

          {!readOnly && onDelete && (
            <button className="cover-remove" onClick={onDelete}>
              Rimuovi dallo scaffale
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
