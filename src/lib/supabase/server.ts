import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase per Server Components / Server Actions.
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase non configurato: imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (vedi .env.local.example)."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll può essere chiamato da un Server Component: si può ignorare
          // se c'è un middleware che rinfresca la sessione (vedi src/middleware.ts).
        }
      },
    },
  });
}
