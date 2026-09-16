"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function RecuperaPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/nuova-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="auth-shell">
        <div className="ambient" aria-hidden="true" />
        <div className="auth-card">
          <div className="auth-brand">
            <Logo />
            <h1>Joshly</h1>
          </div>
          <p className="lede">
            Se esiste un account con questa email, ti abbiamo appena mandato un link per scegliere una nuova
            password. Controlla anche nello spam.
          </p>
          <Link href="/login" className="primary-btn" style={{ display: "inline-block", textAlign: "center" }}>
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="ambient" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-brand">
          <Logo />
          <h1>Joshly</h1>
        </div>
        <p className="lede">Inserisci la tua email: ti manderemo un link per scegliere una nuova password.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Invio…" : "Invia link di recupero"}
          </button>
        </form>
        <p className="auth-switch">
          Ti sei ricordato la password? <Link href="/login">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
