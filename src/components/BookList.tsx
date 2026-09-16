"use client";

import { Book, Shelf, statusLabel } from "@/lib/types";
import { ShelfIcon } from "@/lib/icons";
import { starsString } from "@/lib/spineStyle";

export function BookList({
  books,
  shelves,
  onOpenBook,
  emptyMessage,
}: {
  books: Book[];
  shelves: Shelf[];
  onOpenBook: (book: Book) => void;
  emptyMessage?: string;
}) {
  if (books.length === 0) {
    return <div className="empty-note">{emptyMessage || "Ancora nessun libro qui."}</div>;
  }

  const shelfById: Record<string, Shelf> = {};
  shelves.forEach((s) => (shelfById[s.id] = s));

  return (
    <div className="book-list">
      {books.map((book) => {
        const shelf = shelfById[book.shelf_id];
        return (
          <button
            type="button"
            key={book.id}
            className={`list-row st-${book.status}`}
            style={{ "--sc": shelf?.color || "#C9A24B" } as React.CSSProperties}
            onClick={() => onOpenBook(book)}
          >
            <span className="list-cover">
              {book.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.cover_url} alt="" />
              ) : (
                <ShelfIcon name={shelf?.icon || "Altro"} size={15} />
              )}
            </span>
            <span className="list-main">
              <span className="list-title">{book.title}</span>
              <span className="list-author">{book.author}</span>
            </span>
            <span className="list-shelf">
              <ShelfIcon name={shelf?.icon || "Altro"} size={13} />
              {shelf?.name || "Altro"}
            </span>
            <span className="list-status">{statusLabel(book.status)}</span>
            <span className="list-stars">
              {book.status !== "desiderio" && book.rating > 0 ? starsString(book.rating) : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
