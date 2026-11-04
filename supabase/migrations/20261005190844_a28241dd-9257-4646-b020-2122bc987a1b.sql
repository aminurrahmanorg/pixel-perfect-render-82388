create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique default auth.uid(),
  name text not null,
  logo_url text,
  owner_name text,
  phone text,
  email text,
  country text,
  address text,
  time_zone text not null default 'UTC',
  currency text not null default 'USD',
  currency_symbol text not null default '$',
  tax_percent numeric not null default 0,
  fy_start_month int not null default 1,
  created_at timestamptz not null default now()
);
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  name text not null,
  type text not null default 'cash', -- cash | bank | wallet
  opening_balance numeric not null default 0,
  created_at timestamptz not null default now()
);
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  name text not null,
  category text not null default 'General',
  price numeric not null default 0,
  cost numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  sale_date date not null default current_date,
  account_id uuid references public.accounts(id) on delete set null,
  customer text,
  discount numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  cost_total numeric not null default 0,
  note text,
  created_at timestamptz not null default now()
);
create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  qty numeric not null default 1,
  price numeric not null default 0,
  cost numeric not null default 0
);
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  expense_date date not null default current_date,
  category text not null default 'Other',
  description text,
  amount numeric not null default 0,
  account_id uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['restaurants','accounts','menu_items','sales','sale_items','expenses'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

create index on public.sales(owner_id, sale_date);
create index on public.expenses(owner_id, expense_date);
create index on public.sale_items(sale_id);

-- Seeds demo data for the calling user (invoker rights, RLS applies)
create or replace function public.seed_sample_data()
returns void language plpgsql security invoker set search_path = public as $$
declare
  uid uuid := auth.uid();
  cash uuid; bank uuid; wallet uuid;
  items uuid[];
  d int; s uuid; n int; i int; it record; total numeric; cost numeric;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if exists (select 1 from menu_items where owner_id = uid) then return; end if;
  insert into accounts(name,type,opening_balance) values ('Cash Drawer','cash',500) returning id into cash;
  insert into accounts(name,type,opening_balance) values ('Main Bank','bank',5000) returning id into bank;
  insert into accounts(name,type,opening_balance) values ('Mobile Wallet','wallet',200) returning id into wallet;
  insert into menu_items(name,category,price,cost) values
    ('Chicken Biryani','Main Course',12,4.5),('Beef Burger','Fast Food',9,3.2),
    ('Margherita Pizza','Fast Food',14,4.8),('Caesar Salad','Starters',7,2.1),
    ('Grilled Fish','Main Course',18,7.5),('Mango Lassi','Drinks',4,1.1),
    ('Espresso','Drinks',3,0.6),('Chocolate Cake','Desserts',6,1.9);
  for d in 0..59 loop
    n := 4 + floor(random()*6)::int;
    for i in 1..n loop
      insert into sales(sale_date, account_id) values (current_date - d,
        (array[cash,cash,bank,wallet])[1+floor(random()*4)::int]) returning id into s;
      total := 0; cost := 0;
      for it in select * from menu_items where owner_id = uid order by random() limit 1 + floor(random()*3)::int loop
        insert into sale_items(sale_id, menu_item_id, name, qty, price, cost)
          values (s, it.id, it.name, 1 + floor(random()*3)::int, it.price, it.cost);
      end loop;
      update sales set total = (select sum(qty*price) from sale_items where sale_id = s),
        cost_total = (select sum(qty*cost) from sale_items where sale_id = s) where id = s;
    end loop;
    if d % 3 = 0 then
      insert into expenses(expense_date, category, description, amount, account_id) values
        (current_date - d, (array['Utilities','Supplies','Maintenance','Marketing'])[1+floor(random()*4)::int], 'Sample expense', round((20+random()*120)::numeric,2), cash);
    end if;
    if d % 30 = 0 then
      insert into expenses(expense_date, category, description, amount, account_id) values
        (current_date - d, 'Rent', 'Monthly rent', 1500, bank),
        (current_date - d, 'Salaries', 'Staff salaries', 2400, bank);
    end if;
  end loop;
end $$;
grant execute on function public.seed_sample_data() to authenticated;