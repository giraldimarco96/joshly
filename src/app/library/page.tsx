"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Book, BookStatus, Bookmark, Quote, STATUSES, Shelf } from "@/lib/types";
import { AppShell, Stats } from "@/components/AppShell";
import { Bookcase } from "@/components/Bookcase";
import { BookList } from "@/components/BookList";
import { AddBookModal, NewBookInput } from "@/components/AddBookModal";
import { NewShelfModal } from "@/components/NewShelfModal";
import { CoverModal } from "@/components/CoverModal";

type SortMode = "recenti" | "titolo" | "autore" | "voto" | "pagine";
type ViewMode = "scaffali" | "elenco";
const VIEW_MODE_KEY = "joshly-view-mode";

export default function LibraryPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [quotesByBook, setQuotesByBook] = useState<Record<string, Quote[]>>({});
  const [bookmarksByBook, setBookmarksByBook] = useState<Record<string, Bookmark[]>>({});
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookStatus | "tutti">("tutti");
  const [sortMode, setSortMode] = useState<SortMode>("recenti");
  const [viewMode, setViewMode] = useState<ViewMode>("scaffali");

  const [addOpen, setAddOpen] = useState(false);
  const [newShelfOpen, setNewShelfOpen] = useState(false);
  const [coverBookId, setCoverBookId] = useState<string | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  function openCover(bookId: string) {
    setCoverBookId(bookId);
    setCoverOpen(true);
  }

  useEffect(() => {
    // Preferenza personale di visualizzazione (scaffale o elenco), salvata solo
    // in questo browser: ognuno può scegliere quella che preferisce.
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      /* eslint-disable react-hooks/set-state-in-effect */
      if (saved === "elenco" || saved === "scaffali") setViewMode(saved);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // localStorage non disponibile (es. navigazione privata): va bene lo stesso, resta il default.
    }
  }, []);

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // niente di grave se non si salva: al prossimo giro riparte dal default.
    }
  }

  function closeCover() {
    // Chiude prima con l'animazione (rotateY), e solo dopo la transizione
    // svuota il libro mostrato: così la copertina si "richiude" invece di sparire di colpo.
    setCoverOpen(false);
    setTimeout(() => setCoverBookId(null), 520);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      if (cancelled) return;
      setUserId(user.id);

      const [shelvesRes, booksRes, quotesRes, bookmarksRes, reqRes] = await Promise.all([
        supabase.from("shelves").select("*").eq("owner_id", user.id).order("sort_order"),
        supabase.from("books").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
        supabase.from("quotes").select("*").eq("owner_id", user.id),
        supabase.from("bookmarks").select("*").eq("owner_id", user.id),
        supabase.from("friendships").select("id", { count: "exact", head: true }).eq("addressee_id", user.id).eq("status", "pending"),
      ]);

      if (cancelled) return;

      if (shelvesRes.error || booksRes.error) {
        setError(shelvesRes.error?.message || booksRes.error?.message || "Errore di caricamento.");
        setLoading(false);
        return;
      }

      setShelves(shelvesRes.data as Shelf[]);
      setBooks(booksRes.data as Book[]);

      const qMap: Record<string, Quote[]> = {};
      (quotesRes.data as Quote[] | null)?.forEach((q) => {
        (qMap[q.book_id] ||= []).push(q);
      });
      setQuotesByBook(qMap);

      const bMap: Record<string, Bookmark[]> = {};
      (bookmarksRes.data as Bookmark[] | null)?.forEach((b) => {
        (bMap[b.book_id] ||= []).push(b);
      });
      setBookmarksByBook(bMap);

      setPendingRequests(reqRes.count || 0);
      setLoading(false);
    }
    load().catch((e) => {
      if (!cancelled) {
        setError(e.message || "Errore imprevisto.");
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const stats: Stats = useMemo(() => {
    const letti = books.filter((b) => b.status === "letto");
    const lettura = books.filter((b) => b.status === "lettura");
    const pagineLette =
      letti.reduce((s, b) => s + (b.pages || 0), 0) + lettura.reduce((s, b) => s + (b.current_page || 0), 0);
    const rated = letti.filter((b) => b.rating > 0);
    const votoMedio = rated.length ? rated.reduce((s, b) => s + b.rating, 0) / rated.length : null;
    return { letti: letti.length, pagineLette, votoMedio, inLettura: lettura.length };
  }, [books]);

  const filteredSortedBooks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = books.filter((b) => {
      const matchSearch = !term || (b.title + " " + b.author).toLowerCase().includes(term);
      const matchStatus = statusFilter === "tutti" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
    return filtered.slice().sort((a, b) => {
      if (sortMode === "titolo") return a.title.localeCompare(b.title);
      if (sortMode === "autore") return a.author.localeCompare(b.author);
      if (sortMode === "voto") return b.rating - a.rating;
      if (sortMode === "pagine") return (b.pages || 0) - (a.pages || 0);
      return 0; // recenti: già ordinati per created_at desc dalla query
    });
  }, [books, searchTerm, statusFilter, sortMode]);

  const booksByShelf = useMemo(() => {
    const map: Record<string, Book[]> = {};
    filteredSortedBooks.forEach((b) => {
      (map[b.shelf_id] ||= []).push(b);
    });
    return map;
  }, [filteredSortedBooks]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { tutti: books.length };
    STATUSES.forEach((s) => (c[s.key] = books.filter((b) => b.status === s.key).length));
    return c;
  }, [books]);

  async function handleAddBook(data: NewBookInput) {
    if (!userId) return;
    const { data: inserted, error } = await supabase
      .from("books")
      .insert({
        owner_id: userId,
        shelf_id: data.shelfId,
        title: data.title,
        author: data.author,
        pages: data.pages,
        year: data.year,
        status: data.status,
        rating: data.rating,
        current_page: data.currentPage,
        cover_url: data.coverUrl,
        isbn: data.isbn,
      })
      .select()
      .single();
    if (error || !inserted) {
      setError(error?.message || "Impossibile salvare il libro.");
      return;
    }
    setBooks((prev) => [inserted as Book, ...prev]);
    setAddOpen(false);
    setStatusFilter("tutti");
    setEnteringId(inserted.id);
    setTimeout(() => setEnteringId(null), 900);
  }

  async function handleCreateShelf(data: { name: string; icon: string; color: string }) {
    if (!userId) return;
    const { data: inserted, error } = await supabase
      .from("shelves")
      .insert({
        owner_id: userId,
        name: data.name,
        icon: data.icon,
        color: data.color,
        is_base: false,
        sort_order: shelves.length + 1,
      })
      .select()
      .single();
    if (error || !inserted) {
      setError(error?.message || "Impossibile creare lo scaffale.");
      return;
    }
    setShelves((prev) => [...prev, inserted as Shelf]);
    setNewShelfOpen(false);
  }

  async function handleDeleteShelf(shelf: Shelf) {
    if (!confirm(`Eliminare lo scaffale "${shelf.name}"? I libri che contiene passeranno ad "Altro".`)) return;
    const altro = shelves.find((s) => s.name === "Altro" && s.id !== shelf.id);
    if (!altro) return;
    await supabase.from("books").update({ shelf_id: altro.id }).eq("shelf_id", shelf.id);
    await supabase.from("shelves").delete().eq("id", shelf.id);
    setBooks((prev) => prev.map((b) => (b.shelf_id === shelf.id ? { ...b, shelf_id: altro.id } : b)));
    setShelves((prev) => prev.filter((s) => s.id !== shelf.id));
  }

  async function handleUpdateBook(bookId: string, patch: Partial<Book>) {
    setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, ...patch } : b)));
    const { error } = await supabase.from("books").update(patch).eq("id", bookId);
    if (error) setError(error.message);
  }

  function handleDeleteBook(bookId: string) {
    setLeavingId(bookId);
    setCoverOpen(false);
    setTimeout(async () => {
      await supabase.from("books").delete().eq("id", bookId);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      setLeavingId(null);
      setCoverBookId(null);
    }, 480);
  }

  async function handleAddQuote(bookId: string, text: string) {
    if (!userId) return;
    const { data: inserted, error } = await supabase
      .from("quotes")
      .insert({ book_id: bookId, owner_id: userId, text })
      .select()
      .single();
    if (error || !inserted) return;
    setQuotesByBook((prev) => ({ ...prev, [bookId]: [...(prev[bookId] || []), inserted as Quote] }));
  }

  async function handleDeleteQuote(bookId: string, quoteId: string) {
    setQuotesByBook((prev) => ({ ...prev, [bookId]: (prev[bookId] || []).filter((q) => q.id !== quoteId) }));
    await supabase.from("quotes").delete().eq("id", quoteId);
  }

  async function handleAddBookmark(bookId: string, page: number, note: string) {
    if (!userId) return;
    const { data: inserted, error } = await supabase
      .from("bookmarks")
      .insert({ book_id: bookId, owner_id: userId, page, note })
      .select()
      .single();
    if (error || !inserted) return;
    setBookmarksByBook((prev) => ({ ...prev, [bookId]: [...(prev[bookId] || []), inserted as Bookmark] }));
  }

  async function handleDeleteBookmark(bookId: string, markId: string) {
    setBookmarksByBook((prev) => ({ ...prev, [bookId]: (prev[bookId] || []).filter((m) => m.id !== markId) }));
    await supabase.from("bookmarks").delete().eq("id", markId);
  }

  const coverBook = books.find((b) => b.id === coverBookId) || null;
  const coverShelf = coverBook ? shelves.find((s) => s.id === coverBook.shelf_id) : null;

  if (loading) {
    return <div className="loading-shell">Sto sistemando lo scaffale…</div>;
  }

  return (
    <>
      <AppShell stats={stats} pendingRequests={pendingRequests}>
        <div className="toolbar">
          <div className="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Cerca per titolo o autore…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="status-tabs">
            <button
              className={`status-tab ${statusFilter === "tutti" ? "active" : ""}`}
              onClick={() => setStatusFilter("tutti")}
            >
              Tutti ({statusCounts.tutti})
            </button>
            {STATUSES.map((s) => (
              <button
                key={s.key}
                className={`status-tab ${statusFilter === s.key ? "active" : ""}`}
                onClick={() => setStatusFilter(s.key)}
              >
                {s.label} ({statusCounts[s.key]})
              </button>
            ))}
          </div>
          <div className="sort-field">
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
              <option value="recenti">Recenti</option>
              <option value="titolo">Titolo</option>
              <option value="autore">Autore</option>
              <option value="voto">Valutazione</option>
              <option value="pagine">Pagine</option>
            </select>
          </div>
          <div className="view-toggle" role="group" aria-label="Modalità di visualizzazione">
            <button
              type="button"
              className={viewMode === "scaffali" ? "active" : ""}
              onClick={() => changeViewMode("scaffali")}
              title="Vista a scaffali"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M4 4v16M20 4v16M4 12h16" />
              </svg>
              Scaffali
            </button>
            <button
              type="button"
              className={viewMode === "elenco" ? "active" : ""}
              onClick={() => changeViewMode("elenco")}
              title="Vista a elenco"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
              Elenco
            </button>
          </div>
          <button className="btn-add" onClick={() => setAddOpen(true)}>
            + Aggiungi libro
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        {viewMode === "scaffali" ? (
          <Bookcase
            shelves={shelves}
            booksByShelf={booksByShelf}
            animEnterId={enteringId}
            animLeaveId={leavingId}
            onOpenBook={(b) => openCover(b.id)}
            onDeleteShelf={handleDeleteShelf}
            onOpenNewShelf={() => setNewShelfOpen(true)}
            emptyMessage={searchTerm || statusFilter !== "tutti" ? "Nessun libro corrisponde qui." : "Ancora nessun libro qui."}
          />
        ) : (
          <BookList
            books={filteredSortedBooks}
            shelves={shelves}
            onOpenBook={(b) => openCover(b.id)}
            emptyMessage={searchTerm || statusFilter !== "tutti" ? "Nessun libro corrisponde qui." : "Ancora nessun libro qui."}
          />
        )}
      </AppShell>

      <AddBookModal open={addOpen} shelves={shelves} userId={userId} onClose={() => setAddOpen(false)} onSave={handleAddBook} />

      <NewShelfModal
        open={newShelfOpen}
        existingNames={shelves.map((s) => s.name)}
        onClose={() => setNewShelfOpen(false)}
        onCreate={handleCreateShelf}
      />

      <CoverModal
        open={coverOpen}
        book={coverBook}
        shelfName={coverShelf?.name || ""}
        shelfIcon={coverShelf?.icon || "Altro"}
        color={coverShelf?.color || "#C9A24B"}
        quotes={coverBook ? quotesByBook[coverBook.id] || [] : []}
        bookmarks={coverBook ? bookmarksByBook[coverBook.id] || [] : []}
        userId={userId}
        onClose={closeCover}
        onUpdate={(patch) => coverBook && handleUpdateBook(coverBook.id, patch)}
        onDelete={() => coverBook && handleDeleteBook(coverBook.id)}
        onAddQuote={(text) => coverBook && handleAddQuote(coverBook.id, text)}
        onDeleteQuote={(qid) => coverBook && handleDeleteQuote(coverBook.id, qid)}
        onAddBookmark={(page, note) => coverBook && handleAddBookmark(coverBook.id, page, note)}
        onDeleteBookmark={(mid) => coverBook && handleDeleteBookmark(coverBook.id, mid)}
      />

      {(addOpen || newShelfOpen || coverOpen) && (
        <div
          className={`scrim ${addOpen || newShelfOpen || coverOpen ? "open" : ""}`}
          onClick={() => {
            setAddOpen(false);
            setNewShelfOpen(false);
            closeCover();
          }}
        />
      )}
    </>
  );
}
