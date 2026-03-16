import sql from '../db'

async function migrate() {
  await sql`
    create table if not exists wedge_sessions (
      id uuid primary key default gen_random_uuid(),
      min_yards int not null,
      max_yards int not null,
      avg_diff numeric(5,1) not null,
      std_dev numeric(5,1) not null,
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists shots (
      id uuid primary key default gen_random_uuid(),
      session_id uuid not null references wedge_sessions(id) on delete cascade,
      shot_number int not null,
      target int not null,
      actual int not null,
      diff int not null
    )
  `

  await sql`
    create index if not exists idx_shots_session_id on shots(session_id)
  `

  await sql`
    create table if not exists putting_sessions (
      id uuid primary key default gen_random_uuid(),
      total_putts int not null,
      putts_made int not null,
      make_pct numeric(5,1) not null,
      three_putt_count int not null default 0,
      created_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists putting_attempts (
      id uuid primary key default gen_random_uuid(),
      session_id uuid not null references putting_sessions(id) on delete cascade,
      putt_number int not null,
      distance int not null,
      slope text not null,
      break_dir text not null,
      made boolean not null,
      speed_miss text,
      direction_miss text,
      misread boolean not null default false,
      comeback_made boolean
    )
  `

  await sql`
    create index if not exists idx_putting_attempts_session_id on putting_attempts(session_id)
  `

  // Rename sessions -> wedge_sessions if the old table exists and new one doesn't
  await sql`
    do $$ begin
      if exists (select 1 from information_schema.tables where table_name = 'sessions' and table_schema = 'public')
         and not exists (select 1 from information_schema.tables where table_name = 'wedge_sessions' and table_schema = 'public') then
        alter table sessions rename to wedge_sessions;
      end if;
    end $$
  `

  // Add user_id to wedge_sessions and putting_sessions
  await sql`
    alter table wedge_sessions
    add column if not exists user_id uuid references auth.users(id)
  `

  await sql`
    create index if not exists idx_wedge_sessions_user_id on wedge_sessions(user_id)
  `

  await sql`
    alter table putting_sessions
    add column if not exists user_id uuid references auth.users(id)
  `

  await sql`
    create index if not exists idx_putting_sessions_user_id on putting_sessions(user_id)
  `

  console.log('Migration complete')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
