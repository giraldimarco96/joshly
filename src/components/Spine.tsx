"use client";

import { Book } from "@/lib/types";
import { spineHeight, spineTilt, spineWidth, starsString } from "@/lib/spineStyle";

export function Spine({
  book,
  color,
  entering,
  leaving,
  onClick,
  onAnimEnd,
}: {
  book: Book;
  color: string;
  entering?: boolean;
  leaving?: boolean;
  onClick: () => void;
  onAnimEnd?: () => void;
}) {
  const hasStars = book.status === "letto" && book.rating > 0;
  const classes = ["spine", `st-${book.status}`];
  if (entering) classes.push("entering");
  if (leaving) classes.push("leaving");
  if (hasStars) classes.push("has-stars");

  return (
    <button
      type="button"
      className={classes.join(" ")}
      style={
        {
          "--sc": color,
          "--rest-tilt": spineTilt(book.id),
          width: spineWidth(book.pages) + "px",
          height: spineHeight(book.id) + "px",
          transform: entering ? undefined : `rotate(${spineTilt(book.id)})`,
        } as React.CSSProperties
      }
      onClick={onClick}
      onAnimationEnd={(e) => {
        if (e.animationName === "flyIn") onAnimEnd?.();
      }}
      title={book.title}
    >
      <span className="spine-cap" />
      <span className="spine-label">{book.title}</span>
      {hasStars && <span className="stars-mini">{starsString(book.rating)}</span>}
    </button>
  );
}
