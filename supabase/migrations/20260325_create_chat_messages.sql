create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  username text not null,
  avatar_url text,
  message text not null check (char_length(message) <= 200),
  level int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Anyone can read chat messages"
  on public.chat_messages for select
  to authenticated, anon
  using (true);

create policy "Authenticated users can insert chat messages"
  on public.chat_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

create index idx_chat_messages_created_at on public.chat_messages(created_at desc);

alter publication supabase_realtime add table public.chat_messages;
