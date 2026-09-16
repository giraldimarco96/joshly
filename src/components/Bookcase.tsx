"use client";

import { Book, Shelf } from "@/lib/types";
import { ShelfIcon } from "@/lib/icons";
import { Spine } from "./Spine";

export function Bookcase({
  shelves,
  booksByShelf,
  readOnly = false,
  animEnterId,
  animLeaveId,
  onOpenBook,
  onDeleteShelf,
  onOpenNewShelf,
  onAnimEnd,
  emptyMessage,
}: {
  shelves: Shelf[];
  booksByShelf: Record<string, Book[]>;
  readOnly?: boolean;
  animEnterId?: string | null;
  animLeaveId?: string | null;
  onOpenBook: (book: Book) => void;
  onDeleteShelf?: (shelf: Shelf) => void;
  onOpenNewShelf?: () => void;
  onAnimEnd?: () => void;
  emptyMessage?: string;
}) {
  return (
    <div className="bookcase">
      {shelves.map((shelf) => {
        const all = booksByShelf[shelf.id] || [];
        return (
          <div className="shelf-section" key={shelf.id}>
            <div className="shelf-tag">
              <ShelfIcon name={shelf.icon} />
              <span>{shelf.name}</span>
              <span className="shelf-count">{all.length}</span>
              {!readOnly && !shelf.is_base && onDeleteShelf && (
                <button type="button" className="tag-del" title="Elimina scaffale" onClick={() => onDeleteShelf(shelf)}>
                  ✕
                </button>
              )}
            </div>
            <div className="cubby">
              <div className="books-row">
                {all.length === 0 ? (
                  <div className="empty-note">{emptyMessage || "Ancora nessun libro qui."}</div>
                ) : (
                  all.map((b) => (
                    <Spine
                      key={b.id}
                      book={b}
                      color={shelf.color}
                      entering={animEnterId === b.id}
                      leaving={animLeaveId === b.id}
                      onClick={() => onOpenBook(b)}
                      onAnimEnd={onAnimEnd}
                    />
                  ))
                )}
              </div>
              <div className="plank" />
            </div>
          </div>
        );
      })}

      {!readOnly && onOpenNewShelf && (
        <div className="shelf-section">
          <button type="button" className="shelf-add" onClick={onOpenNewShelf}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuovo scaffale
          </button>
        </div>
      )}
    </div>
  );
}
