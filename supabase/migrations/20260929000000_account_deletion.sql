-- Lets a signed-in user delete their own account and data.
-- Households they created are handed to the longest-standing other member first, so roommates keep
-- the household and its history; a household with no other members is deleted along with the account.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  h record;
  heir uuid;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  for h in select id from public.households where created_by = uid loop
    select user_id into heir
    from public.household_members
    where household_id = h.id and user_id <> uid
    order by joined_at, user_id
    limit 1;

    if heir is not null then
      update public.households set created_by = heir where id = h.id;
      update public.household_members set role = 'owner' where household_id = h.id and user_id = heir;
    end if;
  end loop;

  -- Cascades to profiles and everything the user owns.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
