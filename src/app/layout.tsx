import type { Metadata, Viewport } from "next";
import "./globals.css";

// Indirizzo pubblico del sito, usato per generare link assoluti corretti
// (es. l'immagine di anteprima quando condividi il link). Va impostato come
// variabile d'ambiente NEXT_PUBLIC_SITE_URL su Vercel con l'indirizzo vero
// del sito pubblicato — altrimenti si userebbe "localhost" anche online.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Joshly",
  description:
    "La tua libreria personale: scaffali per genere, stati di lettura, citazioni, segnalibri, recensioni e amici con cui condividerla.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Joshly",
  },
  openGraph: {
    title: "Joshly",
    description:
      "La tua libreria personale: scaffali per genere, stati di lettura, citazioni, segnalibri, recensioni e amici con cui condividerla.",
    type: "website",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#12140F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(){});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
