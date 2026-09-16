# Joshly

> «Non si allontani dalla tua bocca il libro di questa legge, ma meditalo giorno e notte...» — Giosuè 1:8

Joshly è la tua libreria personale: scaffali per genere, stati diversi per i libri (desiderio / in lettura / letto), citazioni preferite, segnalibri, recensioni, ricerca online tramite Open Library, scansione ISBN da fotocamera, e la possibilità di seguire gli amici e consigliarsi libri a vicenda.

È un sito web che funziona anche come app installabile (PWA): niente App Store o Play Store, si installa direttamente dal browser.

Questa guida ti porta da zero (nessun account) a Joshly online e funzionante, passo per passo. Non serve sapere programmare: sono tutti click nella dashboard di Supabase e di Vercel.

## 1. Crea il progetto Supabase (il database + gli account utente)

Supabase è il servizio che tiene il database (Postgres) e gestisce login/registrazione. Il piano gratuito basta ampiamente per uso personale.

1. Vai su [supabase.com](https://supabase.com) e crea un account gratuito (puoi usare GitHub o Google per registrarti più in fretta).
2. Crea un nuovo progetto ("New project"): scegli un nome (es. "joshly"), una password per il database (salvala da parte, non ti servirà quasi mai ma è meglio conservarla) e una regione vicina a te (es. Europa).
3. Aspetta 1-2 minuti che il progetto venga creato.

## 2. Crea le tabelle del database

1. Nel menu a sinistra della dashboard Supabase, apri **SQL Editor**.
2. Clicca "New query".
3. Apri il file [`supabase/schema.sql`](./supabase/schema.sql) di questo progetto, copiane **tutto** il contenuto e incollalo nell'editor SQL di Supabase.
4. Clicca "Run" (o Ctrl/Cmd+Enter).

Questo crea tutte le tabelle necessarie (profili, scaffali, libri, citazioni, segnalibri, amicizie, consigli), le regole di sicurezza (ogni utente vede solo i propri dati, o quelli di un amico se accettato), e due automatismi: alla registrazione di un nuovo utente viene creato automaticamente il suo profilo e i 7 scaffali di base (Narrativa, Saggistica, Poesia, Biografie, Spiritualità, Fumetti, Altro).

## 3. Attiva la registrazione via email/password

1. Nel menu a sinistra, vai su **Authentication → Providers**.
2. Assicurati che **Email** sia attivo (di solito lo è già di default).
3. Se vuoi evitare l'invio di email di conferma durante i test (comodo per provare subito), in **Authentication → Providers → Email** disattiva temporaneamente "Confirm email". Puoi riattivarlo più avanti se vuoi maggiore sicurezza in produzione.

## 4. Copia le chiavi API nel progetto

1. Nel menu a sinistra, vai su **Project Settings → API**.
2. Copia il valore **Project URL** e il valore **anon public** (la chiave pubblica, non quella "service_role").
3. In questo progetto, duplica il file `.env.local.example` in un nuovo file chiamato **`.env.local`** (stessa cartella, sostituendo `.example` alla fine del nome).
4. Apri `.env.local` e incolla i due valori:

```
NEXT_PUBLIC_SUPABASE_URL=https://il-tuo-progetto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=la-tua-chiave-anon-pubblica
```

`.env.local` non va mai condiviso o caricato su GitHub (contiene le tue chiavi) — è già escluso di default da `.gitignore`.

## 5. Provalo in locale

Nella cartella del progetto:

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000): dovresti vedere la schermata di benvenuto di Joshly. Registra un account di prova, aggiungi un libro cercandolo per titolo (funziona davvero, tramite Open Library) e prova a cambiare stato, aggiungere citazioni, ecc.

La scansione ISBN da fotocamera richiede il permesso della fotocamera e funziona meglio su Chrome (desktop o Android); su `localhost` il browser potrebbe essere più permissivo, ma una volta online (passo 6, con HTTPS) funzionerà ovunque.

## 6. Metti Joshly online (Vercel + GitHub)

Vercel è il modo più semplice per pubblicare un progetto Next.js, ed è gratuito per uso personale.

1. Crea un account su [github.com](https://github.com) se non ne hai già uno, e crea un nuovo repository (puoi lasciarlo privato).
2. Carica il codice di questo progetto in quel repository (dalla cartella del progetto):
   ```bash
   git init
   git add .
   git commit -m "Joshly"
   git branch -M main
   git remote add origin https://github.com/TUO-UTENTE/TUO-REPO.git
   git push -u origin main
   ```
3. Crea un account su [vercel.com](https://vercel.com) (puoi accedere direttamente con GitHub).
4. Clicca "Add New… → Project", scegli il repository che hai appena creato e importalo.
5. Prima di premere "Deploy", apri la sezione **Environment Variables** e aggiungi le stesse due variabili di `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Clicca "Deploy". Dopo un minuto avrai un link pubblico (es. `joshly.vercel.app`).

Da quel momento, ogni volta che fai `git push` su `main`, Vercel ripubblica automaticamente la nuova versione.

## 7. Evita che Supabase metta in pausa il progetto (gratis)

Il piano gratuito di Supabase mette in pausa un progetto dopo circa una settimana senza attività (i dati non si perdono, ma va "risvegliato" a mano dalla dashboard). Nello zip trovi già pronto `.github/workflows/supabase-keep-alive.yml`: una GitHub Action che due volte a settimana fa una piccola richiesta al progetto, così Supabase lo considera sempre attivo. È gratis (GitHub offre minuti di Action gratuiti più che sufficienti per questo) e non richiede nulla da mantenere.

Per attivarla, dopo aver caricato il progetto su GitHub (passo 6):

1. Nel repository su GitHub vai su **Settings → Secrets and variables → Actions**.
2. Clicca **"New repository secret"** e crea questi due segreti, con gli stessi valori che hai messo in `.env.local`:
   - `SUPABASE_URL` → il tuo Project URL (es. `https://il-tuo-progetto.supabase.co`)
   - `SUPABASE_ANON_KEY` → la tua chiave anon public
3. Vai sulla scheda **Actions** del repository: dovresti già vedere il workflow "Supabase keep-alive" elencato. Per testarlo subito senza aspettare lunedì/giovedì, aprilo e clicca **"Run workflow"**.

Se va bene, nel log vedrai "Risposta da Supabase: HTTP 200". Da quel momento il progetto non si metterà più in pausa da solo, finché il repository resta attivo su GitHub.

### Installare Joshly come app

Una volta online, apri il link su telefono o computer e usa la voce del browser "Aggiungi a schermata Home" (Android/Chrome) o "Aggiungi al Dock/Home" (iPhone Safari, dal menu Condividi). Joshly si aprirà come un'app a schermo intero, con la sua icona.

## Struttura del progetto

- `supabase/schema.sql` — tutte le tabelle e le regole di sicurezza del database.
- `src/app/` — le pagine: login, registrazione, libreria (`/library`), amici (`/friends`).
- `src/components/` — i componenti riutilizzabili (scaffali, dorsi dei libri, modali per aggiungere un libro, vedere la copertina, scansionare un ISBN, creare uno scaffale).
- `src/lib/openLibrary.ts` — la ricerca libri su Open Library (gratuita, senza chiave API).
- `public/manifest.json`, `public/sw.js` — configurazione PWA (icona, installabilità).

## Sicurezza dei dati

La sicurezza non è affidata al codice dell'app, ma al database stesso: ogni tabella ha delle regole (Row Level Security) che impediscono a un utente di leggere o modificare i dati di un altro, a meno che non siate amici e lui non abbia condiviso quel libro. Anche se qualcuno intercettasse le chiavi pubbliche nel codice del sito, non potrebbe comunque accedere ai dati altrui.
