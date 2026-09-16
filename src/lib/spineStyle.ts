// Piccole utility deterministiche per far sembrare lo scaffale "vero":
// ogni libro ha sempre la stessa leggera inclinazione e altezza, derivate dal suo id.

export function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function spineWidth(pages: number | null | undefined): number {
  const p = Math.max(60, Math.min(pages || 200, 1000));
  return Math.round(30 + (p / 1000) * 30);
}

export function spineHeight(id: string): number {
  return 116 + (hashStr(id) % 22);
}

export function spineTilt(id: string): string {
  const h = hashStr(id + "t") % 100;
  return ((h / 100) * 2.2 - 1.1).toFixed(2) + "deg";
}

export function starsString(n: number): string {
  let s = "";
  for (let i = 0; i < 5; i++) s += i < n ? "★" : "☆";
  return s;
}
