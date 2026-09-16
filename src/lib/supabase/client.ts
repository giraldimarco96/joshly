"use client";

import { createBrowserClient } from "@supabase/ssr";

// Client Supabase per componenti lato browser ("use client").
// Le due variabili d'ambiente vanno impostate in .env.local (vedi .env.local.example).
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase non configurato: imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (vedi .env.local.example)."
    );
  }

  return createBrowserClient(url, anonKey);
}
