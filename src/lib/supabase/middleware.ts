import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rinfresca la sessione Supabase ad ogni richiesta e protegge le rotte private.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
  // Pagine di recupero password: devono restare accessibili anche senza sessione
  // (il link ricevuto via email crea la sessione temporanea lato client, dopo
  // che questa richiesta server-side è già stata gestita) e anche a chi ha già
  // una sessione attiva altrove, quindi non vanno rimandate via da qui.
  const isPasswordRecoveryPage = path.startsWith("/recupera-password") || path.startsWith("/nuova-password");
  const isPublicAsset = path.startsWith("/_next") || path.startsWith("/manifest") || path.startsWith("/sw.js");

  if (!user && !isAuthPage && !isPasswordRecoveryPage && !isPublicAsset && path !== "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/library";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
