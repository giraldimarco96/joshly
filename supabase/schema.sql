-- Joshly — schema Supabase (Postgres)
-- Incolla ed esegui questo intero file nell'SQL Editor del tuo progetto Supabase.
-- Sicuro da rilanciare più volte grazie agli "if not exists" / "or replace".

-- ---------------------------------------------------------------------
-- 1. Profili utente (un profilo per ogni account creato via Supabase Auth)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by everyone (per la ricerca amici)" on public.profiles;
create policy "profiles are viewable by everyone (per la ricerca amici)"
  on public.profiles for select
  using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Crea automaticamente un profilo quando qualcuno si registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. Scaffali (i 7 di base + quelli personalizzati da ogni utente)
-- ---------------------------------------------------------------------
create table if not exists public.shelves (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  icon text not null default 'Altro',
  color text not null default '#C9A24B',
  is_base boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

alter table public.shelves enable row level security;

drop policy if exists "owners manage their shelves" on public.shelves;
create policy "owners manage their shelves"
  on public.shelves for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "friends can view each other's shelves" on public.shelves;
create policy "friends can view each other's shelves"
  on public.shelves for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = owner_id)
          or (f.addressee_id = auth.uid() and f.requester_id = owner_id))
    )
  );

-- Crea i 7 scaffali di base per un nuovo utente
create or replace function public.create_default_shelves()
returns trigger as $$
begin
  insert into public.shelves (owner_id, name, icon, color, is_base, sort_order) values
    (new.id, 'Teologia',   'Teologia',   '#C9A24B', true, 1),
    (new.id, 'Narrativa',  'Narrativa',  '#B0664A', true, 2),
    (new.id, 'Saggistica', 'Saggistica', '#8FA377', true, 3),
    (new.id, 'Fantasy',    'Fantasy',    '#8B6B7A', true, 4),
    (new.id, 'Tecnologia', 'Tecnologia', '#5F7A87', true, 5),
    (new.id, 'Storia',     'Storia',     '#A08C4E', true, 6),
    (new.id, 'Altro',      'Altro',      '#6E6B5E', true, 7);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_profile_created_make_shelves on public.profiles;
create trigger on_profile_created_make_shelves
  after insert on public.profiles
  for each row execute procedure public.create_default_shelves();

-- ---------------------------------------------------------------------
-- 3. Libri
-- ---------------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  shelf_id uuid not null references public.shelves(id) on delete cascade,
  title text not null,
  author text not null,
  pages int,
  status text not null default 'letto' check (status in ('desiderio','lettura','letto')),
  rating int not null default 0 check (rating between 0 and 5),
  year int,
  current_page int not null default 0,
  review text not null default '',
  cover_url text,
  isbn text,
  created_at timestamptz not null default now()
);

create index if not exists books_owner_idx on public.books(owner_id);
create index if not exists books_shelf_idx on public.books(shelf_id);

alter table public.books enable row level security;

drop policy if exists "owners manage their books" on public.books;
create policy "owners manage their books"
  on public.books for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "friends can view each other's books" on public.books;
create policy "friends can view each other's books"
  on public.books for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = owner_id)
          or (f.addressee_id = auth.uid() and f.requester_id = owner_id))
    )
  );

-- ---------------------------------------------------------------------
-- 4. Citazioni preferite
-- ---------------------------------------------------------------------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  page int,
  created_at timestamptz not null default now()
);

alter table public.quotes enable row level security;

drop policy if exists "owners manage their quotes" on public.quotes;
create policy "owners manage their quotes"
  on public.quotes for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "friends can view quotes" on public.quotes;
create policy "friends can view quotes"
  on public.quotes for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = owner_id)
          or (f.addressee_id = auth.uid() and f.requester_id = owner_id))
    )
  );

-- ---------------------------------------------------------------------
-- 5. Segnalibri
-- ---------------------------------------------------------------------
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  page int not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.bookmarks enable row level security;

drop policy if exists "owners manage their bookmarks" on public.bookmarks;
create policy "owners manage their bookmarks"
  on public.bookmarks for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------
-- 6. Amicizie (richieste + accettate)
-- ---------------------------------------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

alter table public.friendships enable row level security;

drop policy if exists "involved users can view the friendship" on public.friendships;
create policy "involved users can view the friendship"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "users can send friend requests" on public.friendships;
create policy "users can send friend requests"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

drop policy if exists "addressee can respond, either side can update" on public.friendships;
create policy "addressee can respond, either side can update"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "either side can delete the friendship" on public.friendships;
create policy "either side can delete the friendship"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ---------------------------------------------------------------------
-- 7. Consigli di lettura (un amico ti consiglia un libro)
-- ---------------------------------------------------------------------
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  author text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.recommendations enable row level security;

drop policy if exists "sender and recipient can view" on public.recommendations;
create policy "sender and recipient can view"
  on public.recommendations for select
  using (auth.uid() = from_id or auth.uid() = to_id);

drop policy if exists "friends can send recommendations" on public.recommendations;
create policy "friends can send recommendations"
  on public.recommendations for insert
  with check (
    auth.uid() = from_id
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = to_id)
          or (f.addressee_id = auth.uid() and f.requester_id = to_id))
    )
  );

drop policy if exists "recipient can delete (dismiss)" on public.recommendations;
create policy "recipient can delete (dismiss)"
  on public.recommendations for delete
  using (auth.uid() = to_id or auth.uid() = from_id);
