CREATE OR REPLACE FUNCTION public.seed_sample_data_for(uid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    (uid,'Cotton T-Shirt','Clothing',15,7),(uid,'Coffee Mug','Home & Living',6,2.2),
    (uid,'Backpack','Bags',28,12),(uid,'LED Bulb','Electronics',4,1.5),
    (uid,'Bluetooth Earbuds','Electronics',35,18),(uid,'Notebook A5','Stationery',3,1),
    (uid,'Water Bottle','Home & Living',8,3),(uid,'Power Bank','Electronics',25,13),
    (uid,'Leather Handbag','Bags',22,9),(uid,'Wall Clock','Home & Living',14,6);
  for d in 0..59 loop
    n := 4 + floor(random()*6)::int;
    for i in 1..n loop
      insert into sales(owner_id, sale_date, account_id, customer) values (uid, current_date - d,
        (array[cash,cash,bank,wallet])[1+floor(random()*4)::int],
        (array[null,null,null,'Walk-in','Wholesale buyer','Rahim','Sarah','Online order'])[1+floor(random()*8)::int]) returning id into s;
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
        (uid, current_date - d, 'Wholesale order', 'Wholesale order income', 650, bank);
    end if;
    if d % 7 = 0 then
      insert into transfers(owner_id, transfer_date, from_account_id, to_account_id, amount, note) values
        (uid, current_date - d, cash, bank, 400, 'Weekly cash deposit');
    end if;
  end loop;
end $function$;