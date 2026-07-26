-- Rulează acest cod în Supabase → SQL Editor → New query → Run.
-- Creează tabelul unde se salvează ședințele programate.

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  room text not null,
  start_time timestamptz not null,
  duration_minutes int not null default 30,
  host_name text,
  invitees text[] default '{}',
  created_at timestamptz default now()
);

-- Tabelul pentru prezentări (editorul de slide-uri)
create table if not exists presentations (
  id uuid primary key,
  title text not null default 'Prezentare',
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Tabelul pentru camere separate (breakout rooms)
create table if not exists breakout_sessions (
  main_room text primary key,
  rooms jsonb not null default '[]',
  recall_at bigint default 0,
  updated_at timestamptz default now()
);

-- Leagă ședințele și prezentările de utilizatorul conectat
alter table meetings add column if not exists user_id uuid;
alter table presentations add column if not exists user_id uuid;

-- Gazda fiecărei săli (primul venit devine gazdă)
create table if not exists room_hosts (
  room text primary key,
  host_identity text,
  host_name text,
  claimed_at timestamptz default now()
);

-- Mod sală (sală de așteptare / webinar) + cererile din sala de așteptare
alter table room_hosts add column if not exists lobby boolean default false;
alter table room_hosts add column if not exists webinar boolean default false;

create table if not exists lobby_requests (
  room text,
  identity text,
  name text,
  admitted boolean default false,
  requested_at timestamptz default now(),
  primary key (room, identity)
);

-- Marcaje pentru remindere (ca să nu se trimită de două ori)
alter table meetings add column if not exists reminded_24h boolean default false;
alter table meetings add column if not exists reminded_1h boolean default false;

-- Contacte (lista personală de emailuri a fiecărui utilizator)
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  name text,
  created_at timestamptz default now(),
  unique (user_id, email)
);
