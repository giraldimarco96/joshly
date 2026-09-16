// Le stesse piccole icone lineari minimali usate nel prototipo,
// così ogni scaffale (di base o personalizzato) ha un simbolo coerente.

export const ICON_PATHS: Record<string, string> = {
  Teologia: '<line x1="12" y1="4" x2="12" y2="20"/><line x1="6" y1="9" x2="18" y2="9"/>',
  Narrativa:
    '<path d="M4 20C4 10 10 4 20 4 20 14 14 20 4 20Z"/><line x1="6.5" y1="17.5" x2="16.5" y2="7.5"/>',
  Saggistica:
    '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  Fantasy: '<path d="M14 3a9 9 0 1 0 0 18 7.2 7.2 0 0 1 0-18Z"/>',
  Tecnologia:
    '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="6" r="1.6"/><circle cx="18" cy="12" r="1.6"/><line x1="7.4" y1="11" x2="10.8" y2="7.4"/><line x1="13.2" y1="7.4" x2="16.6" y2="11"/>',
  Storia: '<line x1="6" y1="20" x2="6" y2="9"/><line x1="18" y1="20" x2="18" y2="9"/><path d="M5 9a7 7 0 0 1 14 0"/>',
  Altro:
    '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/><line x1="7.5" y1="7.5" x2="16.5" y2="16.5"/><line x1="16.5" y1="7.5" x2="7.5" y2="16.5"/>',
  star: '<path d="M12 3.5l2.4 5 5.5.6-4 3.8 1 5.4L12 15.9 7.1 18.3l1-5.4-4-3.8 5.5-.6L12 3.5Z"/>',
  diamond: '<path d="M12 3 20 12 12 21 4 12Z"/>',
  flag: '<path d="M6 3v18"/><path d="M6 4h11l-3 4 3 4H6"/>',
};

export const ICON_KEYS = Object.keys(ICON_PATHS);

export function ShelfIcon({
  name,
  size = 16,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const path = ICON_PATHS[name] ?? ICON_PATHS.Altro;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

export const CUSTOM_PALETTE = [
  "#C9A24B",
  "#8FA377",
  "#B0664A",
  "#8B6B7A",
  "#5F7A87",
  "#A08C4E",
  "#6E6B5E",
  "#7A5C3E",
  "#4E6B5C",
  "#9C5B6B",
];
