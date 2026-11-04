insert into public.menu_items (owner_id, name, category, price, cost, image_url)
select r.owner_id, v.name, v.category, v.price, v.cost, v.image_url
from public.restaurants r
join (values
  ('Mutton Kacchi','Main Course',16,7,'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-biryani.jpg'),
  ('BBQ Chicken Pizza','Fast Food',15,6,'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-pizza.jpg'),
  ('Cheeseburger','Fast Food',10,4,'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-burger.jpg'),
  ('Grilled Salmon','Main Course',22,11,'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-fish.jpg'),
  ('Garden Salad','Starters',6,2,'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-salad.jpg'),
  ('Spicy Wings Bucket','Starters',12,5,'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-wings.jpg'),
  ('Cappuccino','Drinks',4,1,'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-espresso.jpg'),
  ('Mint Mojito','Drinks',5,1.5,'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-lime-soda.jpg'),
  ('Strawberry Lassi','Drinks',4.5,1.5,'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-lassi.jpg'),
  ('Fudge Brownie','Desserts',5,2,'https://hcekufpitfscrwpcwzxy.supabase.co/storage/v1/object/public/images/ff2769a4-564c-4fbd-a061-acff3d79c176%2Fseed-cake.jpg')
) as v(name, category, price, cost, image_url) on true
where not exists (select 1 from public.menu_items m where m.owner_id = r.owner_id and m.name = v.name);