create or replace function public.add_store_member_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user uuid;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if not exists (select 1 from public.restaurants where owner_id = auth.uid()) then
    raise exception 'Only the store owner can add members';
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No account found with that email. Ask them to sign up first.';
  end if;
  if v_user = auth.uid() then
    raise exception 'That is your own account';
  end if;
  if exists (select 1 from public.store_members where member_id = v_user) then
    raise exception 'That user already belongs to a store';
  end if;
  insert into public.store_members (store_owner_id, member_id)
  values (auth.uid(), v_user)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.list_store_members()
returns table (id uuid, member_id uuid, email text, created_at timestamptz)
language sql
security definer
set search_path to 'public'
as $$
  select sm.id, sm.member_id, u.email::text, sm.created_at
  from public.store_members sm
  join auth.users u on u.id = sm.member_id
  where sm.store_owner_id = auth.uid() or sm.member_id = auth.uid();
$$;

create or replace function public.remove_store_member(p_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  delete from public.store_members where id = p_id and store_owner_id = auth.uid();
  if not found then
    raise exception 'Not found or not allowed';
  end if;
end;
$$;

grant execute on function public.add_store_member_by_email(text) to authenticated;
grant execute on function public.list_store_members() to authenticated;
grant execute on function public.remove_store_member(uuid) to authenticated;