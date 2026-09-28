-- Roommate Meal Prep: core schema
-- Money is stored in integer cents. Nutrients are stored per meal (totals) and per serving on recipes.

create extension if not exists pgcrypto;

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Households ----------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Security definer so policies on household_members can call it without recursing.
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create or replace function public.shares_household_with(other uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.household_members a
    join public.household_members b on a.household_id = b.household_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- Creator becomes owner automatically.
create or replace function public.handle_new_household()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.household_members (household_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_household_created
  after insert on public.households
  for each row execute function public.handle_new_household();

-- Joining by invite code: non-members cannot read the household row, so this runs as definer.
create or replace function public.join_household(code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  hid uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  select id into hid from public.households where invite_code = lower(trim(code));
  if hid is null then
    raise exception 'invalid invite code';
  end if;
  insert into public.household_members (household_id, user_id)
  values (hid, auth.uid())
  on conflict do nothing;
  return hid;
end;
$$;

-- Recipes -------------------------------------------------------------------

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  household_id uuid references public.households (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  ingredients text not null default '',
  instructions text not null default '',
  servings numeric(6, 2) not null default 1 check (servings > 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),       -- whole recipe
  calories numeric(8, 1) not null default 0 check (calories >= 0),     -- per serving
  protein_g numeric(7, 1) not null default 0 check (protein_g >= 0),
  carbs_g numeric(7, 1) not null default 0 check (carbs_g >= 0),
  fat_g numeric(7, 1) not null default 0 check (fat_g >= 0),
  fiber_g numeric(7, 1) not null default 0 check (fiber_g >= 0),
  created_at timestamptz not null default now()
);

create index recipes_owner_idx on public.recipes (owner_id);
create index recipes_household_idx on public.recipes (household_id);

-- Meals ---------------------------------------------------------------------
-- household_id null = personal meal. Otherwise a joint meal whose cost is split via meal_shares.

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  household_id uuid references public.households (id) on delete cascade,
  recipe_id uuid references public.recipes (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  eaten_on date not null default current_date,
  servings numeric(6, 2) not null default 1 check (servings > 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),
  paid_by uuid references public.profiles (id) on delete set null,
  calories numeric(9, 1) not null default 0 check (calories >= 0),     -- totals for the meal
  protein_g numeric(8, 1) not null default 0 check (protein_g >= 0),
  carbs_g numeric(8, 1) not null default 0 check (carbs_g >= 0),
  fat_g numeric(8, 1) not null default 0 check (fat_g >= 0),
  fiber_g numeric(8, 1) not null default 0 check (fiber_g >= 0),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index meals_created_by_idx on public.meals (created_by, eaten_on desc);
create index meals_household_idx on public.meals (household_id, eaten_on desc);

create table public.meal_shares (
  meal_id uuid not null references public.meals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  share_cents integer not null check (share_cents >= 0),
  primary key (meal_id, user_id)
);

create index meal_shares_user_idx on public.meal_shares (user_id);

create or replace function public.can_see_meal(mid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.meals m
    where m.id = mid
      and (m.created_by = auth.uid()
           or (m.household_id is not null and public.is_household_member(m.household_id)))
  );
$$;

-- Settlements: someone paying a housemate back.
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  note text not null default '',
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  settled_on date not null default current_date,
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

create index settlements_household_idx on public.settlements (household_id);

-- Balances: positive = the household owes this member, negative = they owe.
create or replace view public.household_balances
with (security_invoker = true)
as
select
  hm.household_id,
  hm.user_id,
  coalesce(paid.total, 0)
    - coalesce(owed.total, 0)
    + coalesce(sent.total, 0)
    - coalesce(received.total, 0) as balance_cents
from public.household_members hm
left join lateral (
  select sum(m.cost_cents) as total from public.meals m
  where m.household_id = hm.household_id and m.paid_by = hm.user_id
) paid on true
left join lateral (
  select sum(s.share_cents) as total
  from public.meal_shares s join public.meals m on m.id = s.meal_id
  where m.household_id = hm.household_id and s.user_id = hm.user_id
) owed on true
left join lateral (
  select sum(st.amount_cents) as total from public.settlements st
  where st.household_id = hm.household_id and st.from_user = hm.user_id
) sent on true
left join lateral (
  select sum(st.amount_cents) as total from public.settlements st
  where st.household_id = hm.household_id and st.to_user = hm.user_id
) received on true;

-- Row level security --------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.recipes enable row level security;
alter table public.meals enable row level security;
alter table public.meal_shares enable row level security;
alter table public.settlements enable row level security;

create policy "profiles: read self and housemates" on public.profiles
  for select using (id = auth.uid() or public.shares_household_with(id));
create policy "profiles: update self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "households: members read" on public.households
  for select using (public.is_household_member(id) or created_by = auth.uid());
create policy "households: anyone signed in creates" on public.households
  for insert with check (created_by = auth.uid());
create policy "households: owner updates" on public.households
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "households: owner deletes" on public.households
  for delete using (created_by = auth.uid());

create policy "members: members read" on public.household_members
  for select using (public.is_household_member(household_id));
create policy "members: leave self or owner removes" on public.household_members
  for delete using (
    user_id = auth.uid()
    or exists (select 1 from public.households h where h.id = household_id and h.created_by = auth.uid())
  );

create policy "recipes: read own or household" on public.recipes
  for select using (
    owner_id = auth.uid() or (household_id is not null and public.is_household_member(household_id))
  );
create policy "recipes: insert own" on public.recipes
  for insert with check (
    owner_id = auth.uid() and (household_id is null or public.is_household_member(household_id))
  );
create policy "recipes: update own" on public.recipes
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and (household_id is null or public.is_household_member(household_id)));
create policy "recipes: delete own" on public.recipes
  for delete using (owner_id = auth.uid());

create policy "meals: read own or household" on public.meals
  for select using (
    created_by = auth.uid() or (household_id is not null and public.is_household_member(household_id))
  );
create policy "meals: insert" on public.meals
  for insert with check (
    created_by = auth.uid()
    and (
      (household_id is null and (paid_by is null or paid_by = auth.uid()))
      or (public.is_household_member(household_id)
          and (paid_by is null or exists (
            select 1 from public.household_members hm
            where hm.household_id = meals.household_id and hm.user_id = meals.paid_by)))
    )
  );
create policy "meals: update own" on public.meals
  for update using (created_by = auth.uid())
  with check (created_by = auth.uid() and (household_id is null or public.is_household_member(household_id)));
create policy "meals: delete own" on public.meals
  for delete using (created_by = auth.uid());

create policy "shares: read visible meals" on public.meal_shares
  for select using (public.can_see_meal(meal_id));
create policy "shares: meal creator writes" on public.meal_shares
  for insert with check (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.created_by = auth.uid()
        and (
          (m.household_id is null and user_id = auth.uid())
          or exists (select 1 from public.household_members hm
                     where hm.household_id = m.household_id and hm.user_id = meal_shares.user_id)
        )
    )
  );
create policy "shares: meal creator deletes" on public.meal_shares
  for delete using (exists (select 1 from public.meals m where m.id = meal_id and m.created_by = auth.uid()));

create policy "settlements: members read" on public.settlements
  for select using (public.is_household_member(household_id));
create policy "settlements: members record" on public.settlements
  for insert with check (
    created_by = auth.uid()
    and public.is_household_member(household_id)
    and (from_user = auth.uid() or to_user = auth.uid())
    and exists (select 1 from public.household_members where household_id = settlements.household_id and user_id = from_user)
    and exists (select 1 from public.household_members where household_id = settlements.household_id and user_id = to_user)
  );
create policy "settlements: creator deletes" on public.settlements
  for delete using (created_by = auth.uid());

grant execute on function public.join_household(text) to authenticated;
