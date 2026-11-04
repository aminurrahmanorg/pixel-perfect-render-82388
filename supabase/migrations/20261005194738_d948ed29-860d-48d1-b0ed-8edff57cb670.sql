ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL;

DO $$
DECLARE
  uid uuid := 'ff2769a4-564c-4fbd-a061-acff3d79c176';
  base text := 'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-';
  taxp numeric; cash uuid; d int; k int; it record; q int; sub numeric; tx numeric; sid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM restaurants WHERE owner_id = uid) THEN RETURN; END IF;
  PERFORM set_config('app.seeding','on',true);
  SELECT tax_percent INTO taxp FROM restaurants WHERE owner_id = uid LIMIT 1;
  SELECT id INTO cash FROM accounts WHERE owner_id = uid ORDER BY (type='cash') DESC, created_at LIMIT 1;

  INSERT INTO menu_items (owner_id, name, category, price, cost, image_url) VALUES
   (uid,'Chicken Tikka Masala','Main Course',420,190,base||'tikka.jpg'),
   (uid,'Tonkotsu Ramen','Main Course',480,210,base||'ramen.jpg'),
   (uid,'French Fries','Starters',150,45,base||'fries.jpg'),
   (uid,'Ribeye Steak','Main Course',1250,640,base||'steak.jpg'),
   (uid,'Prawn Fried Rice','Main Course',360,150,base||'friedrice.jpg'),
   (uid,'Beef Tacos','Fast Food',320,130,base||'tacos.jpg'),
   (uid,'Chocolate Milkshake','Drinks',220,80,base||'milkshake.jpg'),
   (uid,'Ice Cream Sundae','Desserts',260,90,base||'icecream.jpg'),
   (uid,'Veg Spring Rolls','Starters',180,60,base||'springroll.jpg'),
   (uid,'Iced Latte','Drinks',200,70,base||'icedcoffee.jpg');

  -- 30 days of sales for the new items
  FOR d IN 0..29 LOOP
    FOR k IN 1..3 LOOP
      SELECT * INTO it FROM menu_items WHERE owner_id = uid AND image_url LIKE '%seed-%' AND name IN
        ('Chicken Tikka Masala','Tonkotsu Ramen','French Fries','Ribeye Steak','Prawn Fried Rice','Beef Tacos','Chocolate Milkshake','Ice Cream Sundae','Veg Spring Rolls','Iced Latte')
        ORDER BY random() LIMIT 1;
      q := 1 + floor(random()*3)::int;
      sub := it.price * q;
      tx := round(sub * coalesce(taxp,0) / 100, 2);
      INSERT INTO sales (owner_id, sale_date, account_id, customer, discount, tax, total, cost_total)
        VALUES (uid, current_date - d, cash, 'Walk-in', 0, tx, sub + tx, it.cost * q) RETURNING id INTO sid;
      INSERT INTO sale_items (owner_id, sale_id, menu_item_id, name, qty, price, cost)
        VALUES (uid, sid, it.id, it.name, q, it.price, it.cost);
    END LOOP;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM staff WHERE owner_id = uid) THEN
    INSERT INTO staff (owner_id, name, role, phone, salary, hire_date) VALUES
     (uid,'Rahim Uddin','Manager','01711000001',35000,current_date - 400),
     (uid,'Karim Hossain','Chef','01711000002',30000,current_date - 300),
     (uid,'Sumon Mia','Cook','01711000003',18000,current_date - 200),
     (uid,'Nasrin Akter','Cashier','01711000004',16000,current_date - 150),
     (uid,'Jamal Sheikh','Waiter','01711000005',12000,current_date - 90),
     (uid,'Rubel Ahmed','Delivery','01711000006',11000,current_date - 60);
  END IF;
END $$;