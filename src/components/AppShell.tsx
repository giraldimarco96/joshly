"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "./Logo";

export type Stats = {
  letti: number;
  pagineLette: number;
  votoMedio: number | null;
  inLettura: number;
};

export function AppShell({
  stats,
  pendingRequests = 0,
  children,
}: {
  stats: Stats;
  pendingRequests?: number;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <header className="top">
        <div className="brand">
          <Link href="/library">
            <Logo />
            <div>
              <h1>Joshly</h1>
              <p>Ogni genere, il suo scaffale</p>
            </div>
          </Link>
        </div>
        <div className="header-right">
          <div className="stat-line mono">
            <div className="stat">
              <span className="num">{stats.letti}</span>
              <span className="lbl">Libri letti</span>
            </div>
            <div className="stat">
              <span className="num">{stats.pagineLette.toLocaleString("it-IT")}</span>
              <span className="lbl">Pagine lette</span>
            </div>
            <div className="stat">
              <span className="num">{stats.votoMedio != null ? stats.votoMedio.toFixed(1) : "—"}</span>
              <span className="lbl">Voto medio</span>
            </div>
            <div className="stat">
              <span className="num">{stats.inLettura}</span>
              <span className="lbl">In lettura</span>
            </div>
          </div>
          <button className="signout-btn" onClick={signOut}>
            Esci
          </button>
        </div>
      </header>

      <nav className="top-tabs">
        <Link href="/library" className={`top-tab ${pathname === "/library" ? "active" : ""}`}>
          Il mio scaffale
        </Link>
        <Link href="/friends" className={`top-tab ${pathname?.startsWith("/friends") ? "active" : ""}`}>
          Amici
          {pendingRequests > 0 && <span className="badge">{pendingRequests}</span>}
        </Link>
      </nav>

      <main className="wrap">{children}</main>

      <footer className="site-footer">Joshly</footer>
    </>
  );
}
