create table public.income (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  income_date date not null default current_date,
  source text not null default 'Other',
  description text,
  amount numeric not null default 0 check (amount >= 0),
  account_id uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  transfer_date date not null default current_date,
  from_account_id uuid not null references public.accounts(id) on delete cascade,
  to_account_id uuid not null references public.accounts(id) on delete cascade,
  amount numeric not null check (amount > 0),
  note text,
  created_at timestamptz not null default now(),
  check (from_account_id <> to_account_id)
);
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  action text not null,
  entity text not null,
  entity_id uuid,
  summary text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.income, public.transfers to authenticated;
grant select on public.activity_logs to authenticated;
grant all on public.income, public.transfers, public.activity_logs to service_role;
alter table public.income enable row level security;
alter table public.transfers enable row level security;
alter table public.activity_logs enable row level security;
create policy "own rows" on public.income for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own rows" on public.transfers for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own logs" on public.activity_logs for select to authenticated using (owner_id = auth.uid());
create index on public.activity_logs(owner_id, created_at desc);

create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare r jsonb; s text;
begin
  if current_setting('app.seeding', true) = 'on' then return null; end if;
  r := to_jsonb(coalesce(new, old));
  s := coalesce(r->>'name', r->>'category', r->>'source', r->>'customer', r->>'description', '')
       || case when r ? 'total' then ' · ' || (r->>'total') when r ? 'amount' then ' · ' || (r->>'amount') else '' end;
  insert into activity_logs(owner_id, action, entity, entity_id, summary)
  values ((r->>'owner_id')::uuid, lower(tg_op), tg_table_name, (r->>'id')::uuid, nullif(trim(s), ''));
  return null;
end $$;

do $$ declare t text;
begin
  foreach t in array array['restaurants','accounts','menu_items','sales','expenses','income','transfers'] loop
    execute format('create trigger log_%1$s after insert or update or delete on public.%1$I for each row execute function public.log_activity()', t);
  end loop;
end $$;

drop function if exists public.seed_sample_data();

create or replace function public.seed_sample_data_for(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  cash uuid; bank uuid; wallet uuid; taxp numeric;
  d int; s uuid; n int; it record; sub numeric; disc numeric;
begin
  if exists (select 1 from menu_items where owner_id = uid) then return; end if;
  perform set_config('app.seeding', 'on', true);
  select coalesce(tax_percent, 0) into taxp from restaurants where owner_id = uid;
  taxp := coalesce(taxp, 0);
  insert into accounts(owner_id,name,type,opening_balance) values (uid,'Cash Drawer','cash',500) returning id into cash;
  insert into accounts(owner_id,name,type,opening_balance) values (uid,'Main Bank','bank',5000) returning id into bank;
  insert into accounts(owner_id,name,type,opening_balance) values (uid,'Mobile Wallet','wallet',200) returning id into wallet;
  insert into menu_items(owner_id,name,category,price,cost) values
    (uid,'Chicken Biryani','Main Course',12,4.5),(uid,'Beef Burger','Fast Food',9,3.2),
    (uid,'Margherita Pizza','Fast Food',14,4.8),(uid,'Caesar Salad','Starters',7,2.1),
    (uid,'Grilled Fish','Main Course',18,7.5),(uid,'Mango Lassi','Drinks',4,1.1),
    (uid,'Espresso','Drinks',3,0.6),(uid,'Chocolate Cake','Desserts',6,1.9),
    (uid,'Chicken Wings','Starters',8,2.8),(uid,'Fresh Lime Soda','Drinks',3,0.5);
  for d in 0..59 loop
    n := 4 + floor(random()*6)::int;
    for i in 1..n loop
      insert into sales(owner_id, sale_date, account_id, customer) values (uid, current_date - d,
        (array[cash,cash,bank,wallet])[1+floor(random()*4)::int],
        (array[null,null,null,'Table 3','Table 7','Rahim','Sarah','Online order'])[1+floor(random()*8)::int]) returning id into s;
      for it in select * from menu_items where owner_id = uid order by random() limit 1 + floor(random()*3)::int loop
        insert into sale_items(owner_id, sale_id, menu_item_id, name, qty, price, cost)
          values (uid, s, it.id, it.name, 1 + floor(random()*3)::int, it.price, it.cost);
      end loop;
      select sum(qty*price) into sub from sale_items where sale_id = s;
      disc := case when random() < 0.15 then round(sub * 0.1, 2) else 0 end;
      update sales set discount = disc,
        tax = round((sub - disc) * taxp / 100, 2),
        total = round((sub - disc) * (1 + taxp / 100), 2),
        cost_total = (select sum(qty*cost) from sale_items where sale_id = s) where id = s;
    end loop;
    if d % 3 = 0 then
      insert into expenses(owner_id, expense_date, category, description, amount, account_id) values
        (uid, current_date - d, (array['Utilities','Supplies','Maintenance','Marketing','Transport'])[1+floor(random()*5)::int], 'Sample expense', round((20+random()*120)::numeric,2), cash);
    end if;
    if d % 30 = 0 then
      insert into expenses(owner_id, expense_date, category, description, amount, account_id) values
        (uid, current_date - d, 'Rent', 'Monthly rent', 1500, bank),
        (uid, current_date - d, 'Salaries', 'Staff salaries', 2400, bank);
      insert into income(owner_id, income_date, source, description, amount, account_id) values
        (uid, current_date - d, 'Catering', 'Office catering order', 650, bank);
    end if;
    if d % 7 = 0 then
      insert into transfers(owner_id, transfer_date, from_account_id, to_account_id, amount, note) values
        (uid, current_date - d, cash, bank, 400, 'Weekly cash deposit');
    end if;
  end loop;
end $$;
revoke all on function public.seed_sample_data_for(uuid) from public, anon, authenticated;

create or replace function public.seed_sample_data()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  perform public.seed_sample_data_for(auth.uid());
end $$;
revoke all on function public.seed_sample_data() from public, anon;
grant execute on function public.seed_sample_data() to authenticated;