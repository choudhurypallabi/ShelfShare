-- ShelfShare schema
-- Run this once in your Supabase project's SQL editor.

create extension if not exists "uuid-ossp";

-- One row per signed-up user
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table books (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  author text not null,
  genre text not null,
  condition text not null check (condition in ('Good', 'Fair', 'Poor')),
  description text,
  cover_url text,
  owner_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'Available' check (status in ('Available', 'Pending', 'Borrowed')),
  created_at timestamptz not null default now()
);

create table borrows (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid not null references books(id) on delete cascade,
  borrower_id uuid not null references profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  borrowed_at timestamptz,
  due_at timestamptz,
  returned_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'active', 'returned')),
  extension_count int not null default 0
);

create table extensions (
  id uuid primary key default uuid_generate_v4(),
  borrow_id uuid not null references borrows(id) on delete cascade,
  extended_at timestamptz not null default now(),
  previous_due_at timestamptz not null,
  new_due_at timestamptz not null,
  fee_amount numeric(10, 2) not null default 2.00,
  fee_paid boolean not null default false
);

create table waitlist (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid not null references books(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (book_id, user_id)
);

-- Row Level Security
alter table profiles enable row level security;
alter table books enable row level security;
alter table borrows enable row level security;
alter table extensions enable row level security;
alter table waitlist enable row level security;

-- profiles: anyone signed in can read all profiles (needed to show owner names);
-- a user can only insert/update their own profile row
create policy "profiles are readable by all signed-in users" on profiles
  for select using (auth.role() = 'authenticated');
create policy "users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- books: anyone signed in can read; only the owner can insert/update/delete their own
create policy "books are readable by all signed-in users" on books
  for select using (auth.role() = 'authenticated');
create policy "owners can insert their own books" on books
  for insert with check (auth.uid() = owner_id);
create policy "owners can update their own books" on books
  for update using (auth.uid() = owner_id);
create policy "owners can delete their own books" on books
  for delete using (auth.uid() = owner_id);

-- borrows: readable by the borrower or the book's owner; insertable by the borrower;
-- updatable by the borrower (extend/return) or the owner (confirm/return)
create policy "borrows readable by borrower or book owner" on borrows
  for select using (
    auth.uid() = borrower_id
    or auth.uid() = (select owner_id from books where books.id = borrows.book_id)
  );
create policy "borrower can create a borrow request" on borrows
  for insert with check (auth.uid() = borrower_id);
create policy "borrower or owner can update a borrow" on borrows
  for update using (
    auth.uid() = borrower_id
    or auth.uid() = (select owner_id from books where books.id = borrows.book_id)
  );

-- extensions: readable/insertable by the borrow's borrower
create policy "extensions readable by the borrower" on extensions
  for select using (
    auth.uid() = (select borrower_id from borrows where borrows.id = extensions.borrow_id)
  );
create policy "borrower can record their own extension" on extensions
  for insert with check (
    auth.uid() = (select borrower_id from borrows where borrows.id = extensions.borrow_id)
  );

-- waitlist: readable by all signed-in users (to know if a book has a queue);
-- a user can only add/remove themselves
create policy "waitlist readable by all signed-in users" on waitlist
  for select using (auth.role() = 'authenticated');
create policy "users can join waitlist as themselves" on waitlist
  for insert with check (auth.uid() = user_id);
create policy "users can leave waitlist themselves" on waitlist
  for delete using (auth.uid() = user_id);

-- Enable Realtime on the tables the UI needs to live-sync
alter publication supabase_realtime add table books;
alter publication supabase_realtime add table borrows;
alter publication supabase_realtime add table waitlist;

-- Auto-create a profile row whenever someone signs up, using the "name"
-- passed in via supabase.auth.signUp(..., { data: { name } }). This runs as
-- the table owner (security definer), so it works even before the new
-- user's session/RLS context exists (e.g. while email confirmation is pending).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for user-uploaded book cover photos.
-- Public read (covers need to display for everyone browsing); only
-- signed-in users can upload, and only into their own user-id folder.
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

create policy "book covers are publicly readable" on storage.objects
  for select using (bucket_id = 'book-covers');

create policy "users can upload covers into their own folder" on storage.objects
  for insert with check (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
