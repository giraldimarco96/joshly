export type BookStatus = "desiderio" | "lettura" | "letto";

export type Shelf = {
  id: string;
  owner_id: string;
  name: string;
  icon: string;
  color: string;
  is_base: boolean;
  sort_order: number;
};

export type Book = {
  id: string;
  owner_id: string;
  shelf_id: string;
  title: string;
  author: string;
  pages: number | null;
  status: BookStatus;
  rating: number;
  year: number | null;
  current_page: number;
  review: string;
  cover_url: string | null;
  isbn: string | null;
  created_at: string;
};

export type Quote = {
  id: string;
  book_id: string;
  owner_id: string;
  text: string;
  page: number | null;
  created_at: string;
};

export type Bookmark = {
  id: string;
  book_id: string;
  owner_id: string;
  page: number;
  note: string;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  email: string;
};

export type FriendshipStatus = "pending" | "accepted" | "declined";

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
};

export type Recommendation = {
  id: string;
  from_id: string;
  to_id: string;
  title: string;
  author: string;
  note: string;
  created_at: string;
};

export const STATUSES: { key: BookStatus; label: string }[] = [
  { key: "desiderio", label: "Da leggere" },
  { key: "lettura", label: "In lettura" },
  { key: "letto", label: "Letto" },
];

export function statusLabel(s: BookStatus): string {
  return STATUSES.find((x) => x.key === s)?.label ?? s;
}
