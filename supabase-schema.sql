create table if not exists public.retirement_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.retirement_plans enable row level security;

drop policy if exists "Users can read their own retirement plan" on public.retirement_plans;
create policy "Users can read their own retirement plan"
  on public.retirement_plans
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own retirement plan" on public.retirement_plans;
create policy "Users can insert their own retirement plan"
  on public.retirement_plans
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own retirement plan" on public.retirement_plans;
create policy "Users can update their own retirement plan"
  on public.retirement_plans
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
