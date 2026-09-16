"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La password deve avere almeno 6 caratteri.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name || email.split("@")[0] } },
      });
      if (error) throw error;

      if (data.session) {
        router.push("/library");
        router.refresh();
      } else {
        // Conferma email attiva sul progetto Supabase: l'utente deve cliccare il link ricevuto.
        setDone(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message === "User already registered" ? "Esiste già un account con questa email." : message);
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
            Controlla la tua casella email: ti abbiamo mandato un link di conferma. Una volta confermato, potrai
            accedere.
          </p>
          <Link href="/login" className="primary-btn" style={{ display: "inline-block", textAlign: "center" }}>
            Vai al login
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
        <p className="lede">Crea il tuo scaffale personale.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Nome</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
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
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Creazione…" : "Crea account"}
          </button>
        </form>
        <p className="auth-switch">
          Hai già un account? <Link href="/login">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
