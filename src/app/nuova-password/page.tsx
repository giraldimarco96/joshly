"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function NuovaPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Il link ricevuto via email crea automaticamente una sessione temporanea
    // di tipo "recovery" quando la pagina si apre: la aspettiamo qui.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });

    // Se la sessione era già pronta prima che ci iscrivessimo all'evento.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La password deve avere almeno 6 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le due password non coincidono.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => {
        router.push("/library");
        router.refresh();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="ambient" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-brand">
          <Logo />
          <h1>Joshly</h1>
        </div>

        {checking && <p className="lede">Verifica del link in corso…</p>}

        {!checking && !ready && !done && (
          <>
            <p className="lede">
              Questo link non è valido o è scaduto. Richiedine uno nuovo dalla pagina di recupero password.
            </p>
            <Link
              href="/recupera-password"
              className="primary-btn"
              style={{ display: "inline-block", textAlign: "center" }}
            >
              Richiedi un nuovo link
            </Link>
          </>
        )}

        {ready && !done && (
          <>
            <p className="lede">Scegli la tua nuova password.</p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="password">Nuova password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label htmlFor="confirm">Ripeti la password</label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Salvataggio…" : "Salva nuova password"}
              </button>
            </form>
          </>
        )}

        {done && <p className="lede">Fatto! Ti stiamo portando alla tua libreria…</p>}
      </div>
    </div>
  );
}
