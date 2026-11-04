-- Egyptian Discovery platform schema
-- Apply through Supabase CLI or SQL editor after configuring a project.
create extension if not exists pgcrypto;

create schema if not exists private;

create type public.app_role as enum ('customer','admin','main_admin');
create type public.trip_status as enum ('draft','gathering','under_review','confirmed','fully_booked','cancelled','completed');
create type public.reservation_status as enum ('held','awaiting_payment','payment_review','deposit_paid','confirmed','fully_paid','completed','waitlisted','cancelled','expired','refunded');
create type public.payment_status as enum ('pending','under_review','approved','rejected','refunded');
create type public.order_status as enum ('awaiting_payment','payment_review','confirmed','preparing','shipped','delivered','cancelled','refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text not null unique,
  display_name text,
  email text,
  governorate text,
  role public.app_role not null default 'customer',
  referral_code text unique not null default upper(substr(encode(gen_random_bytes(8),'hex'),1,10)),
  referred_by uuid references public.profiles(id),
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.destinations (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  name_en text not null, name_ar text not null, region_en text, region_ar text,
  description_en text, description_ar text, hero_image text,
  latitude double precision, longitude double precision,
  highlights_en jsonb not null default '[]', highlights_ar jsonb not null default '[]',
  activities_en jsonb not null default '[]', activities_ar jsonb not null default '[]',
  travel_info_en jsonb not null default '{}', travel_info_ar jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  destination_id uuid not null references public.destinations(id),
  name_en text not null, name_ar text not null, trip_type text not null,
  duration_days integer not null check(duration_days > 0), price_per_person numeric(12,2) not null check(price_per_person >= 0),
  currency text not null default 'EGP', deposit_percent numeric(5,2) not null default 10 check(deposit_percent between 0 and 100),
  min_travelers integer not null default 13 check(min_travelers > 0), max_capacity integer not null check(max_capacity >= min_travelers),
  booking_deadline timestamptz, departure_date date, preferred_dates date[] not null default '{}',
  minimum_target_deadline timestamptz not null default (now()+interval '1 month'),
  hero_image text, itinerary_en jsonb not null default '[]', itinerary_ar jsonb not null default '[]',
  included_en jsonb not null default '[]', included_ar jsonb not null default '[]', excluded_en jsonb not null default '[]', excluded_ar jsonb not null default '[]',
  accommodation_en text, accommodation_ar text, transport_en text, transport_ar text,
  requirements_en jsonb not null default '[]', requirements_ar jsonb not null default '[]', bring_en jsonb not null default '[]', bring_ar jsonb not null default '[]',
  cancellation_policy_en text, cancellation_policy_ar text,
  status public.trip_status not null default 'draft', priority_starts_at timestamptz, priority_ends_at timestamptz,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.trip_date_options (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id) on delete cascade,
  starts_on date not null, ends_on date not null, votes integer not null default 0 check(votes >= 0),
  status text not null default 'proposed' check(status in ('proposed','selected','rejected')),
  check(ends_on >= starts_on), unique(trip_id, starts_on, ends_on)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(), reference text not null unique default upper(substr(encode(gen_random_bytes(8),'hex'),1,10)),
  trip_id uuid not null references public.trips(id), customer_id uuid not null references public.profiles(id),
  seats integer not null default 1 check(seats between 1 and 10), status public.reservation_status not null default 'held',
  priority_booking boolean not null default false,
  held_until timestamptz not null default (now() + interval '12 hours'),
  amount_due numeric(12,2) not null check(amount_due >= 0), deposit_due numeric(12,2) not null check(deposit_due >= 0),
  price_per_seat numeric(12,2) not null check(price_per_seat>=0), deposit_per_seat numeric(12,2) not null check(deposit_per_seat>=0),
  amount_paid numeric(12,2) not null default 0 check(amount_paid >= 0), balance_due_at timestamptz,
  preferred_dates date[] not null default '{}',
  selected_date_option uuid references public.trip_date_options(id), confirmed_at timestamptz, cancellation_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index reservations_trip_status_idx on public.reservations(trip_id,status);
create index reservations_customer_idx on public.reservations(customer_id,created_at desc);
create unique index one_priority_extra_seat_per_customer_trip on public.reservations(trip_id,customer_id) where priority_booking;

create table public.travelers (
  id uuid primary key default gen_random_uuid(), reservation_id uuid not null references public.reservations(id) on delete cascade,
  full_name text not null, phone text, date_of_birth date, emergency_contact_name text, emergency_contact_phone text, created_at timestamptz not null default now()
);
create table public.traveler_identity_documents (
  traveler_id uuid primary key references public.travelers(id) on delete cascade,
  national_id_ciphertext bytea not null, photo_path text not null, submitted_at timestamptz not null default now(), purge_after timestamptz
);
create table public.date_decisions (
 id uuid primary key default gen_random_uuid(), reservation_id uuid not null references public.reservations(id) on delete cascade,
 proposed_date date not null, decision text check(decision in ('accepted','refund_requested','pending')) not null default 'pending',
 decided_at timestamptz, created_at timestamptz not null default now(), unique(reservation_id,proposed_date)
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id),
 channel text not null default 'whatsapp' check(channel='whatsapp'), template text not null, payload jsonb not null default '{}',
 dedupe_key text unique not null default gen_random_uuid()::text,
 status text not null default 'queued' check(status in ('queued','sent','failed','skipped')), provider_reference text, sent_at timestamptz, created_at timestamptz not null default now()
);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references public.trips(id),
  customer_id uuid not null references public.profiles(id), requested_seats integer not null default 1 check(requested_seats > 0),
  preferred_date_options uuid[] not null default '{}', status text not null default 'waiting' check(status in ('waiting','invited','accepted','expired','removed')),
  created_at timestamptz not null default now(), unique(trip_id,customer_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id),
  reservation_id uuid references public.reservations(id), order_id uuid,
  amount numeric(12,2) not null check(amount > 0), currency text not null default 'EGP',
  method text not null check(method in ('instapay','bank_transfer')), status public.payment_status not null default 'pending',
  transfer_reference text, proof_path text, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, review_note text,
  created_at timestamptz not null default now(), check(num_nonnulls(reservation_id,order_id)=1)
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(), payment_id uuid not null unique references public.payments(id),
  receipt_number text not null unique default 'ED-'||to_char(now(),'YYYYMM')||'-'||upper(substr(encode(gen_random_bytes(4),'hex'),1,8)),
  issued_at timestamptz not null default now(), receipt_data jsonb not null default '{}'
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id),
  amount numeric(12,2) not null check(amount > 0), reason text not null, status text not null default 'pending' check(status in ('pending','approved','rejected','paid')),
  decided_by uuid references public.profiles(id), decided_at timestamptz, created_at timestamptz not null default now()
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name_en text not null, name_ar text not null, sort_order integer not null default 0
);
create table public.products (
  id uuid primary key default gen_random_uuid(), slug text unique not null, category_id uuid references public.product_categories(id),
  name_en text not null, name_ar text not null, description_en text, description_ar text,
  price numeric(12,2) not null check(price >= 0), currency text not null default 'EGP', images jsonb not null default '[]',
  stock_quantity integer not null default 0 check(stock_quantity >= 0), availability boolean not null default true,
  status text not null default 'draft' check(status in ('draft','published','archived')), sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.governorates (
  code text primary key, name_en text not null, name_ar text not null, delivery_fee numeric(12,2) not null default 0 check(delivery_fee >= 0), enabled boolean not null default true
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), reference text not null unique default 'EDO-'||upper(substr(encode(gen_random_bytes(6),'hex'),1,10)),
  customer_id uuid not null references public.profiles(id), governorate_code text not null references public.governorates(code),
  address text not null, recipient_name text not null, recipient_phone text not null,
  subtotal numeric(12,2) not null check(subtotal >= 0), delivery_fee numeric(12,2) not null check(delivery_fee >= 0),
  total numeric(12,2) not null check(total = subtotal + delivery_fee), status public.order_status not null default 'awaiting_payment',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.payments add constraint payments_order_id_fkey foreign key(order_id) references public.orders(id);
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id), product_name_en text not null, product_name_ar text not null,
  quantity integer not null check(quantity > 0), unit_price numeric(12,2) not null check(unit_price >= 0),
  line_total numeric(12,2) not null check(line_total = quantity * unit_price)
);
create table public.defective_claims (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), customer_id uuid not null references public.profiles(id),
  order_item_id uuid not null references public.order_items(id), description text not null, proof_paths text[] not null default '{}',
  status text not null default 'submitted' check(status in ('submitted','under_review','approved','rejected','resolved')),
  decided_by uuid references public.profiles(id), decision_note text, created_at timestamptz not null default now()
);
create table public.trip_expenses (
 id uuid primary key default gen_random_uuid(), trip_id uuid references public.trips(id), category text not null,
 description text not null, amount numeric(12,2) not null check(amount>=0), currency text not null default 'EGP',
 incurred_on date not null default current_date, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.saved_destinations (
 profile_id uuid not null references public.profiles(id) on delete cascade, destination_id uuid not null references public.destinations(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(profile_id,destination_id)
);

-- Order totals, inventory deductions, and snapshots are created atomically from database prices.
create or replace function public.create_store_order(p_governorate_code text,p_address text,p_recipient_name text,p_recipient_phone text,p_items jsonb)
returns public.orders language plpgsql security definer set search_path=public,pg_temp as $$
declare g public.governorates; p public.products; i record; o public.orders; sub numeric:=0; line numeric;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if length(trim(p_address))<5 or length(trim(p_recipient_name))<2 or length(trim(p_recipient_phone))<7 then raise exception 'Complete delivery details'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>20 then raise exception 'Invalid cart'; end if;
 select * into g from public.governorates where code=p_governorate_code and enabled;
 if not found then raise exception 'Delivery is unavailable in this governorate'; end if;
 for i in select product_id,quantity from jsonb_to_recordset(p_items) as x(product_id uuid,quantity integer) order by product_id loop
  if i.quantity<1 or i.quantity>20 then raise exception 'Invalid product quantity'; end if;
  select * into p from public.products where id=i.product_id and status='published' and availability for update;
  if not found or p.stock_quantity<i.quantity then raise exception 'A product is no longer available in the requested quantity'; end if;
  line:=p.price*i.quantity; sub:=sub+line;
  update public.products set stock_quantity=stock_quantity-i.quantity,availability=(stock_quantity-i.quantity)>0 where id=p.id;
 end loop;
 insert into public.orders(customer_id,governorate_code,address,recipient_name,recipient_phone,subtotal,delivery_fee,total)
 values(auth.uid(),g.code,trim(p_address),trim(p_recipient_name),trim(p_recipient_phone),sub,g.delivery_fee,sub+g.delivery_fee) returning * into o;
 for i in select product_id,quantity from jsonb_to_recordset(p_items) as x(product_id uuid,quantity integer) loop
  select * into p from public.products where id=i.product_id;
  insert into public.order_items(order_id,product_id,product_name_en,product_name_ar,quantity,unit_price,line_total)
  values(o.id,p.id,p.name_en,p.name_ar,i.quantity,p.price,p.price*i.quantity);
 end loop;
 return o;
end $$;
revoke all on function public.create_store_order(text,text,text,text,jsonb) from public;
grant execute on function public.create_store_order(text,text,text,text,jsonb) to authenticated;

create or replace function public.submit_order_payment(p_order_id uuid,p_method text,p_proof_path text)
returns public.payments language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.orders; p public.payments;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if p_method not in ('instapay','bank_transfer') or p_proof_path not like auth.uid()::text||'/%' then raise exception 'Invalid payment details'; end if;
 select * into o from public.orders where id=p_order_id and customer_id=auth.uid() for update;
 if not found or o.status<>'awaiting_payment' then raise exception 'Order is not accepting payment'; end if;
 if exists(select 1 from public.payments where order_id=o.id and status in ('pending','under_review','approved')) then raise exception 'Payment was already submitted'; end if;
 insert into public.payments(customer_id,order_id,amount,currency,method,status,proof_path)
 values(auth.uid(),o.id,o.total,'EGP',p_method,'under_review',p_proof_path) returning * into p;
 update public.orders set status='payment_review' where id=o.id;
 return p;
end $$;
revoke all on function public.submit_order_payment(uuid,text,text) from public;
grant execute on function public.submit_order_payment(uuid,text,text) to authenticated;

create table public.referrals (
  id uuid primary key default gen_random_uuid(), referrer_id uuid not null references public.profiles(id), referred_id uuid not null unique references public.profiles(id),
  status text not null default 'pending' check(status in ('pending','qualified','rewarded','reversed')), qualified_at timestamptz, created_at timestamptz not null default now(), check(referrer_id <> referred_id)
);
create table public.reward_ledger (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id), points integer not null check(points <> 0),
  reason text not null, source_type text, source_id uuid, created_at timestamptz not null default now(), unique(profile_id,reason,source_type,source_id)
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id), trip_id uuid not null references public.trips(id),
  rating integer not null check(rating between 1 and 5), review_en text, review_ar text, status text not null default 'pending' check(status in ('pending','published','rejected')),
  created_at timestamptz not null default now(), unique(customer_id,trip_id)
);
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(), trip_id uuid references public.trips(id), image_path text not null, caption_en text, caption_ar text,
  status text not null default 'draft' check(status in ('draft','published','archived')), created_at timestamptz not null default now()
);
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(), code text not null unique, discount_percent numeric(5,2) check(discount_percent between 0 and 100),
  discount_amount numeric(12,2) check(discount_amount >= 0), active boolean not null default false, starts_at timestamptz, ends_at timestamptz,
  max_uses integer, uses integer not null default 0 check(uses >= 0), check(num_nonnulls(discount_percent,discount_amount)=1)
);
create table public.business_settings (
  key text primary key, value jsonb not null, updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);
insert into public.business_settings(key,value) values
 ('reservation_hold_hours','12'::jsonb),('remaining_balance_hours','48'::jsonb),('priority_period_hours','24'::jsonb),
 ('additional_priority_seats','1'::jsonb),('referral_points','100'::jsonb),('loyalty_points_per_egp','0.01'::jsonb),
 ('leaderboard_points_per_activity','1'::jsonb),('national_id_retention_days','365'::jsonb),
 ('cancellation_policy_en','Cancellation and refund decisions are reviewed by the travel team case by case.'::jsonb),
 ('cancellation_policy_ar','تراجع إدارة الرحلات طلبات الإلغاء والاسترداد لكل حالة على حدة.'::jsonb)
on conflict(key) do nothing;
create table public.admin_audit_log (
  id bigint generated always as identity primary key, actor_id uuid references public.profiles(id), action text not null,
  entity text not null, entity_id text, details jsonb not null default '{}', created_at timestamptz not null default now()
);

create or replace function private.is_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','main_admin'));
$$;
create or replace function private.is_main_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='main_admin');
$$;
revoke all on function private.is_admin() from public;
revoke all on function private.is_main_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin(), private.is_main_admin() to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare referrer uuid; referral text;
begin
  referral:=upper(nullif(trim(new.raw_user_meta_data->>'referral_code'),''));
  if referral is not null then select id into referrer from public.profiles where referral_code=referral; end if;
  insert into public.profiles(id,phone,display_name,referred_by) values(new.id,coalesce(new.phone,''),new.raw_user_meta_data->>'display_name',referrer);
  if referrer is not null then insert into public.referrals(referrer_id,referred_id) values(referrer,new.id) on conflict(referred_id) do nothing; end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
 foreach t in array array['profiles','destinations','trips','reservations','products','orders'] loop
  execute format('create trigger touch_%I before update on public.%I for each row execute function public.touch_updated_at()',t,t);
 end loop;
end $$;

-- Reservation holds and seat caps are enforced within one database transaction.
create or replace function public.create_reservation(p_trip_id uuid,p_seats integer default 1,p_preferred_dates date[] default '{}')
returns public.reservations language plpgsql security definer set search_path=public,pg_temp as $$
declare trip public.trips; occupied integer; created public.reservations; amount numeric; is_priority boolean;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if p_seats < 1 or p_seats > 10 then raise exception 'Invalid seat count'; end if;
 select * into trip from public.trips where id=p_trip_id for update;
 if not found or trip.status not in ('gathering','confirmed') then raise exception 'This trip is not accepting reservations'; end if;
 update public.reservations set status='expired' where trip_id=p_trip_id and status in ('held','awaiting_payment') and held_until<=now() and amount_paid=0;
 if trip.booking_deadline is not null and trip.booking_deadline<now() then raise exception 'Booking is closed'; end if;
 if coalesce(cardinality(p_preferred_dates),0)=0 or not (p_preferred_dates <@ trip.preferred_dates) then raise exception 'Choose one or more dates offered for this trip'; end if;
 is_priority:=trip.status='confirmed' and trip.priority_starts_at<=now() and trip.priority_ends_at>now() and exists(select 1 from public.reservations r where r.trip_id=trip.id and r.customer_id=auth.uid() and r.status in ('deposit_paid','confirmed','fully_paid'));
 if trip.status='confirmed' and trip.priority_ends_at>now() and not is_priority then raise exception 'Priority booking is still open for confirmed travelers'; end if;
 if is_priority and p_seats>1 then raise exception 'Priority reservations allow one additional seat'; end if;
 select coalesce(sum(seats),0) into occupied from public.reservations where trip_id=p_trip_id and
  (status in ('deposit_paid','confirmed') or (status in ('held','awaiting_payment','payment_review') and held_until>now()));
 if occupied+p_seats>trip.max_capacity then raise exception 'Not enough seats available'; end if;
 amount:=round(trip.price_per_person*trip.deposit_percent/100,2)*p_seats;
 if is_priority and exists(select 1 from public.reservations where trip_id=trip.id and customer_id=auth.uid() and priority_booking) then raise exception 'Priority seat already reserved'; end if;
 insert into public.reservations(trip_id,customer_id,seats,status,held_until,amount_due,deposit_due,price_per_seat,deposit_per_seat,preferred_dates,priority_booking)
 values(p_trip_id,auth.uid(),p_seats,'held',now()+make_interval(hours=>coalesce((select (value#>>'{}')::integer from public.business_settings where key='reservation_hold_hours'),12)),round(trip.price_per_person*p_seats,2),amount,trip.price_per_person,round(trip.price_per_person*trip.deposit_percent/100,2),p_preferred_dates,is_priority) returning * into created;
 return created;
end $$;
revoke all on function public.create_reservation(uuid,integer,date[]) from public;
grant execute on function public.create_reservation(uuid,integer,date[]) to authenticated;

create or replace function public.submit_reservation_payment(p_reservation_id uuid,p_amount numeric,p_method text,p_proof_path text)
returns public.payments language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.reservations; p public.payments; paid numeric;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if p_amount<=0 or p_method not in ('instapay','bank_transfer') then raise exception 'Invalid payment details'; end if;
 if p_proof_path not like auth.uid()::text||'/%' then raise exception 'Invalid proof path'; end if;
 select * into r from public.reservations where id=p_reservation_id and customer_id=auth.uid() for update;
 if not found or r.status not in ('held','awaiting_payment','payment_review','deposit_paid','confirmed') or (r.status in ('held','awaiting_payment') and r.held_until<now()) then raise exception 'Reservation is no longer accepting payment'; end if;
 if exists(select 1 from public.payments where reservation_id=r.id and status in ('pending','under_review')) then raise exception 'A payment is already awaiting review'; end if;
 select coalesce(sum(amount),0) into paid from public.payments where reservation_id=r.id and status in ('pending','under_review','approved');
 if r.confirmed_at is not null then
  if paid+p_amount>r.amount_due then raise exception 'Payment exceeds the remaining balance'; end if;
 else
  if r.deposit_per_seat>0 and mod(p_amount,r.deposit_per_seat)<>0 then raise exception 'Deposit must cover a whole number of traveler seats'; end if;
  if paid+p_amount>r.deposit_due then raise exception 'Payment exceeds the remaining deposit'; end if;
 end if;
 insert into public.payments(customer_id,reservation_id,amount,method,status,proof_path)
 values(auth.uid(),r.id,p_amount,p_method,'under_review',p_proof_path) returning * into p;
 update public.reservations set status='payment_review',held_until=case when status='held' then greatest(held_until,now()+interval '24 hours') else held_until end where id=r.id;
 return p;
end $$;
revoke all on function public.submit_reservation_payment(uuid,numeric,text,text) from public;
grant execute on function public.submit_reservation_payment(uuid,numeric,text,text) to authenticated;

create or replace function public.save_traveler_details(p_reservation_id uuid,p_full_name text,p_phone text,p_date_of_birth date,p_national_id text,p_photo_path text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.reservations; t public.travelers; secret text; retention integer;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if length(trim(p_full_name))<2 or length(regexp_replace(coalesce(p_national_id,''),'\s','','g'))<>14 or p_national_id !~ '^[0-9]{14}$' then raise exception 'Enter a valid 14-digit national ID and traveler name'; end if;
 select * into r from public.reservations where id=p_reservation_id and customer_id=auth.uid() and status='confirmed' and amount_paid>0 for update;
 if not found then raise exception 'Traveler details are available only for a paid, confirmed trip'; end if;
 if p_photo_path not like auth.uid()::text||'/'||r.id::text||'/%' then raise exception 'Upload a photo of the national ID'; end if;
 if (select count(*) from public.travelers where reservation_id=r.id)>=r.seats then raise exception 'Traveler limit reached for this reservation'; end if;
 select decrypted_secret into secret from vault.decrypted_secrets where name='national_id_encryption_key' limit 1;
 if secret is null or length(secret)<32 then raise exception 'Private identity encryption is not configured'; end if;
 select coalesce((value#>>'{}')::integer,365) into retention from public.business_settings where key='national_id_retention_days';
 insert into public.travelers(reservation_id,full_name,phone,date_of_birth) values(r.id,trim(p_full_name),nullif(trim(p_phone),''),p_date_of_birth) returning * into t;
 insert into public.traveler_identity_documents(traveler_id,national_id_ciphertext,photo_path,purge_after)
 values(t.id,pgp_sym_encrypt(p_national_id,secret,'cipher-algo=aes256'),p_photo_path,now()+make_interval(days=>coalesce(retention,365)));
 insert into public.admin_audit_log(actor_id,action,entity,entity_id,details) values(auth.uid(),'traveler.identity_submitted','traveler',t.id::text,'{}'::jsonb);
 return t.id;
end $$;
revoke all on function public.save_traveler_details(uuid,text,text,date,text,text) from public;
grant execute on function public.save_traveler_details(uuid,text,text,date,text,text) to authenticated;

create or replace function public.review_payment(p_payment_id uuid,p_approve boolean,p_note text default null)
returns public.payments language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.payments; r public.reservations; o public.orders;
begin
 if not private.is_admin() then raise exception 'Administrator access required'; end if;
 select * into p from public.payments where id=p_payment_id for update;
 if not found or p.status not in ('pending','under_review') then raise exception 'Payment is no longer awaiting review'; end if;
 update public.payments set status=case when p_approve then 'approved'::public.payment_status else 'rejected'::public.payment_status end,
   reviewed_by=auth.uid(),reviewed_at=now(),review_note=nullif(trim(p_note),'') where id=p.id returning * into p;
 if p.reservation_id is not null then
  select * into r from public.reservations where id=p.reservation_id for update;
  if p_approve then
   if r.confirmed_at is not null then
    update public.reservations set amount_paid=amount_paid+p.amount,status=case when amount_paid+p.amount>=amount_due then 'fully_paid'::public.reservation_status else 'confirmed'::public.reservation_status end where id=r.id;
   else
    update public.reservations set amount_paid=amount_paid+p.amount,
     seats=case when deposit_per_seat>0 then least(seats,floor((amount_paid+p.amount)/deposit_per_seat)::integer) else seats end,
     amount_due=case when deposit_per_seat>0 then price_per_seat*least(seats,floor((amount_paid+p.amount)/deposit_per_seat)::integer) else amount_due end,
     deposit_due=case when deposit_per_seat>0 then deposit_per_seat*least(seats,floor((amount_paid+p.amount)/deposit_per_seat)::integer) else deposit_due end,
     status=case when deposit_per_seat=0 or amount_paid+p.amount>=deposit_per_seat*least(seats,floor((amount_paid+p.amount)/deposit_per_seat)::integer) then 'deposit_paid'::public.reservation_status else 'awaiting_payment'::public.reservation_status end where id=r.id;
   end if;
   insert into public.receipts(payment_id,receipt_data) values(p.id,jsonb_build_object('reservation_reference',r.reference,'amount',p.amount,'currency',p.currency,'method',p.method,'issued_at',now()));
  elsif r.status='payment_review' then update public.reservations set status=case when confirmed_at is not null then 'confirmed'::public.reservation_status else 'awaiting_payment'::public.reservation_status end where id=r.id; end if;
 else
  select * into o from public.orders where id=p.order_id for update;
  if p_approve then
   update public.orders set status='confirmed' where id=o.id;
   insert into public.receipts(payment_id,receipt_data) values(p.id,jsonb_build_object('order_reference',o.reference,'amount',p.amount,'currency',p.currency,'method',p.method,'issued_at',now()));
  elsif o.status='payment_review' then update public.orders set status='awaiting_payment' where id=o.id; end if;
 end if;
 if p_approve and p.reservation_id is not null then
  if exists(select 1 from public.reservations x join public.trips t on t.id=x.trip_id where x.id=p.reservation_id and t.status='gathering' and (select coalesce(sum(seats),0) from public.reservations z where z.trip_id=t.id and z.status in ('deposit_paid','confirmed','fully_paid'))>=t.min_travelers) then
   update public.trips set status='under_review' where id=(select trip_id from public.reservations where id=p.reservation_id) and status='gathering';
  end if;
 end if;
 insert into public.admin_audit_log(actor_id,action,entity,entity_id,details) values(auth.uid(),case when p_approve then 'payment.approved' else 'payment.rejected' end,'payment',p.id::text,jsonb_build_object('amount',p.amount,'note',nullif(trim(p_note),'')));
 insert into public.notifications(profile_id,template,payload,dedupe_key)
 select customer_id,'payment_status',jsonb_build_object('message',case when p_approve then 'Your payment was approved.' else 'Your payment was not approved. Please contact Egyptian Discovery.' end), 'payment:'||p.id::text||':'||p.status::text
 from public.payments where id=p.id on conflict(dedupe_key) do nothing;
 return p;
end $$;
revoke all on function public.review_payment(uuid,boolean,text) from public;
grant execute on function public.review_payment(uuid,boolean,text) to authenticated;

create or replace function public.confirm_trip(p_trip_id uuid,p_departure_date date)
returns public.trips language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.trips; paid_seats integer; priority_hours integer;
begin
 if not private.is_admin() then raise exception 'Administrator access required'; end if;
 select * into t from public.trips where id=p_trip_id for update;
 if not found or t.status not in ('gathering','under_review') then raise exception 'Trip is not awaiting confirmation'; end if;
 select coalesce(sum(seats),0) into paid_seats from public.reservations where trip_id=t.id and status in ('deposit_paid','confirmed','fully_paid');
 if paid_seats<t.min_travelers then raise exception 'The minimum paid traveler requirement has not been reached'; end if;
 if not (p_departure_date=any(t.preferred_dates)) then
  if exists(select 1 from public.reservations r where r.trip_id=t.id and r.status='deposit_paid' and not (p_departure_date=any(r.preferred_dates)) and not exists(select 1 from public.date_decisions d where d.reservation_id=r.id and d.proposed_date=p_departure_date and d.decision='accepted')) then raise exception 'Some paid customers have not accepted this date'; end if;
 end if;
 select coalesce((select (value#>>'{}')::integer from public.business_settings where key='priority_period_hours'),24) into priority_hours;
 update public.trips set status='confirmed',departure_date=p_departure_date,priority_starts_at=now(),priority_ends_at=now()+make_interval(hours=>priority_hours) where id=t.id returning * into t;
 update public.reservations set status='confirmed',confirmed_at=now(),balance_due_at=now()+make_interval(hours=>coalesce((select (value#>>'{}')::integer from public.business_settings where key='remaining_balance_hours'),48)) where trip_id=t.id and status='deposit_paid';
 insert into public.notifications(profile_id,template,payload,dedupe_key)
 select distinct customer_id,'trip_confirmed',jsonb_build_object('message','Your trip is confirmed. Please check your account for the balance deadline.'),'trip-confirmed:'||t.id::text||':'||customer_id::text
 from public.reservations where trip_id=t.id and status='confirmed' on conflict(dedupe_key) do nothing;
 insert into public.admin_audit_log(actor_id,action,entity,entity_id,details) values(auth.uid(),'trip.confirmed','trip',t.id::text,jsonb_build_object('paid_seats',paid_seats,'departure_date',p_departure_date));
 return t;
end $$;
revoke all on function public.confirm_trip(uuid,date) from public;
grant execute on function public.confirm_trip(uuid,date) to authenticated;

create or replace function public.complete_trip(p_trip_id uuid)
returns public.trips language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.trips; r record; referrer uuid; points integer; referral_points integer; earned integer;
begin
 if not private.is_admin() then raise exception 'Administrator access required'; end if;
 select * into t from public.trips where id=p_trip_id for update;
 if not found or t.status<>'confirmed' then raise exception 'Only confirmed trips can be marked complete'; end if;
 if exists(select 1 from public.reservations where trip_id=t.id and status in ('confirmed','fully_paid') and amount_paid<amount_due) then raise exception 'Some reservation balances are unpaid'; end if;
 update public.trips set status='completed' where id=t.id returning * into t;
 select coalesce((select (value#>>'{}')::integer from public.business_settings where key='leaderboard_points_per_activity'),1) into points;
 select coalesce((select (value#>>'{}')::integer from public.business_settings where key='referral_points'),100) into referral_points;
 for r in select customer_id,sum(amount_paid) as amount_paid from public.reservations where trip_id=t.id and status in ('confirmed','fully_paid') group by customer_id loop
  earned:=greatest(points,0)+round(r.amount_paid*coalesce((select (value#>>'{}')::numeric from public.business_settings where key='loyalty_points_per_egp'),0.01))::integer;
  insert into public.reward_ledger(profile_id,points,reason,source_type,source_id) values(r.customer_id,earned,'trip_completed','trip',t.id) on conflict do nothing;
  update public.profiles set loyalty_points=loyalty_points+earned where id=r.customer_id and exists(select 1 from public.reward_ledger where profile_id=r.customer_id and reason='trip_completed' and source_type='trip' and source_id=t.id);
  referrer:=null;
  update public.referrals set status='rewarded',qualified_at=now() where referred_id=r.customer_id and status='pending' returning referrer_id into referrer;
  if referrer is not null then
   insert into public.reward_ledger(profile_id,points,reason,source_type,source_id) values(referrer,referral_points,'referral_trip_completed','trip',t.id) on conflict do nothing;
   update public.profiles set loyalty_points=loyalty_points+referral_points where id=referrer and exists(select 1 from public.reward_ledger where profile_id=referrer and reason='referral_trip_completed' and source_type='trip' and source_id=t.id);
  end if;
 end loop;
 update public.reservations set status='completed' where trip_id=t.id and status in ('confirmed','fully_paid');
 insert into public.admin_audit_log(actor_id,action,entity,entity_id) values(auth.uid(),'trip.completed','trip',t.id::text);
 return t;
end $$;
revoke all on function public.complete_trip(uuid) from public;
grant execute on function public.complete_trip(uuid) to authenticated;

create or replace function public.expire_reservation_holds()
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare changed integer;
begin
 update public.reservations set status='expired' where status in ('held','awaiting_payment') and held_until<=now() and amount_paid=0;
 get diagnostics changed=row_count;
 return changed;
end $$;
revoke all on function public.expire_reservation_holds() from public;
grant execute on function public.expire_reservation_holds() to service_role;

create or replace function public.cancel_unpaid_reservation(p_reservation_id uuid)
returns public.reservations language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.reservations;
begin
 select * into r from public.reservations where id=p_reservation_id and customer_id=auth.uid() for update;
 if not found or r.status not in ('held','awaiting_payment') or r.amount_paid>0 then raise exception 'Only unpaid reservations can be cancelled here'; end if;
 update public.reservations set status='cancelled',cancellation_reason='Customer cancelled before deposit' where id=r.id returning * into r;
 return r;
end $$;
revoke all on function public.cancel_unpaid_reservation(uuid) from public;
grant execute on function public.cancel_unpaid_reservation(uuid) to authenticated;

create or replace function public.join_trip_waitlist(p_trip_id uuid,p_seats integer default 1,p_preferred_dates date[] default '{}')
returns public.waitlist_entries language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.trips; occupied integer; entry public.waitlist_entries;
begin
 if auth.uid() is null or p_seats<1 or p_seats>10 then raise exception 'Sign in and select a valid traveler count'; end if;
 select * into t from public.trips where id=p_trip_id for update;
 if not found or t.status not in ('gathering','under_review','confirmed','fully_booked') then raise exception 'This trip is not accepting waitlist requests'; end if;
 select coalesce(sum(seats),0) into occupied from public.reservations where trip_id=t.id and (status in ('deposit_paid','confirmed','fully_paid') or (status in ('held','awaiting_payment','payment_review') and held_until>now()));
 if occupied<t.max_capacity then raise exception 'Seats are still available. Reserve directly instead.'; end if;
 insert into public.waitlist_entries(trip_id,customer_id,requested_seats,preferred_date_options)
 values(t.id,auth.uid(),p_seats,array(select id from public.trip_date_options where trip_id=t.id and starts_on=any(p_preferred_dates)))
 on conflict(trip_id,customer_id) do update set requested_seats=excluded.requested_seats,preferred_date_options=excluded.preferred_date_options,status='waiting'
 returning * into entry;
 return entry;
end $$;
revoke all on function public.join_trip_waitlist(uuid,integer,date[]) from public;
grant execute on function public.join_trip_waitlist(uuid,integer,date[]) to authenticated;

create or replace function public.offer_alternative_trip_date(p_trip_id uuid,p_date date)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare r record; affected integer:=0;
begin
 if not private.is_admin() then raise exception 'Administrator access required'; end if;
 for r in select id,customer_id from public.reservations where trip_id=p_trip_id and status in ('deposit_paid','confirmed','fully_paid') and not (p_date=any(preferred_dates)) loop
  insert into public.date_decisions(reservation_id,proposed_date) values(r.id,p_date) on conflict(reservation_id,proposed_date) do update set decision='pending',decided_at=null;
  insert into public.notifications(profile_id,template,payload) values(r.customer_id,'alternative_trip_date',jsonb_build_object('reservation_id',r.id,'date',p_date));
  affected:=affected+1;
 end loop;
 return affected;
end $$;
revoke all on function public.offer_alternative_trip_date(uuid,date) from public;
grant execute on function public.offer_alternative_trip_date(uuid,date) to authenticated;

create or replace function public.decide_alternative_trip_date(p_decision_id uuid,p_decision text)
returns public.date_decisions language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.date_decisions;
begin
 if p_decision not in ('accepted','refund_requested') then raise exception 'Choose an available decision'; end if;
 update public.date_decisions x set decision=p_decision,decided_at=now() from public.reservations r
 where x.id=p_decision_id and r.id=x.reservation_id and r.customer_id=auth.uid() and r.status in ('deposit_paid','confirmed','fully_paid')
 returning x.* into d;
 if not found then raise exception 'Date decision is unavailable'; end if;
 return d;
end $$;
revoke all on function public.decide_alternative_trip_date(uuid,text) from public;
grant execute on function public.decide_alternative_trip_date(uuid,text) to authenticated;

create or replace function public.record_refund_decision(p_payment_id uuid,p_amount numeric,p_reason text,p_approve boolean)
returns public.refunds language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.payments; prior numeric; result public.refunds;
begin
 if not private.is_admin() then raise exception 'Administrator access required'; end if;
 if length(trim(coalesce(p_reason,'')))<5 or p_amount<=0 then raise exception 'Enter a refund reason and amount'; end if;
 select * into p from public.payments where id=p_payment_id for update;
 if not found or p.status not in ('approved','refunded') then raise exception 'Only verified payments can be refunded'; end if;
 select coalesce(sum(amount),0) into prior from public.refunds where payment_id=p.id and status in ('pending','approved','paid');
 if prior+p_amount>p.amount then raise exception 'Refund amount exceeds the unrefunded payment amount'; end if;
 insert into public.refunds(payment_id,amount,reason,status,decided_by,decided_at)
 values(p.id,p_amount,trim(p_reason),case when p_approve then 'approved' else 'rejected' end,auth.uid(),now()) returning * into result;
 insert into public.admin_audit_log(actor_id,action,entity,entity_id,details) values(auth.uid(),case when p_approve then 'refund.approved' else 'refund.rejected' end,'refund',result.id::text,jsonb_build_object('amount',p_amount,'reason',trim(p_reason)));
 return result;
end $$;
revoke all on function public.record_refund_decision(uuid,numeric,text,boolean) from public;
grant execute on function public.record_refund_decision(uuid,numeric,text,boolean) to authenticated;

create or replace function public.mark_refund_paid(p_refund_id uuid,p_note text default null)
returns public.refunds language plpgsql security definer set search_path=public,pg_temp as $$
declare f public.refunds; paid_total numeric; p public.payments;
begin
 if not private.is_admin() then raise exception 'Administrator access required'; end if;
 select * into f from public.refunds where id=p_refund_id for update;
 if not found or f.status<>'approved' then raise exception 'Only an approved refund can be marked paid'; end if;
 update public.refunds set status='paid' where id=f.id returning * into f;
 select coalesce(sum(amount),0) into paid_total from public.refunds where payment_id=f.payment_id and status='paid';
 select * into p from public.payments where id=f.payment_id;
 if paid_total>=p.amount then
  update public.payments set status='refunded' where id=p.id;
  if p.reservation_id is not null then update public.reservations set status='refunded' where id=p.reservation_id; end if;
  if p.order_id is not null then update public.orders set status='refunded' where id=p.order_id; end if;
 end if;
 insert into public.admin_audit_log(actor_id,action,entity,entity_id,details) values(auth.uid(),'refund.paid','refund',f.id::text,jsonb_build_object('note',nullif(trim(p_note),'')));
 return f;
end $$;
revoke all on function public.mark_refund_paid(uuid,text) from public;
grant execute on function public.mark_refund_paid(uuid,text) to authenticated;

create or replace function public.update_order_fulfillment(p_order_id uuid,p_status text,p_note text default null)
returns public.orders language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.orders; valid boolean;
begin
 if not private.is_admin() then raise exception 'Administrator access required'; end if;
 if p_status not in ('preparing','shipped','delivered','cancelled') then raise exception 'Invalid fulfillment status'; end if;
 select * into o from public.orders where id=p_order_id for update;
 if not found or o.status not in ('confirmed','preparing','shipped') then raise exception 'Order is not ready for this update'; end if;
 valid:= (o.status='confirmed' and p_status in ('preparing','cancelled')) or (o.status='preparing' and p_status in ('shipped','cancelled')) or (o.status='shipped' and p_status='delivered');
 if not valid then raise exception 'Order status cannot move to that step'; end if;
 update public.orders set status=p_status::public.order_status where id=o.id returning * into o;
 insert into public.admin_audit_log(actor_id,action,entity,entity_id,details) values(auth.uid(),'order.status_changed','order',o.id::text,jsonb_build_object('status',p_status,'note',nullif(trim(p_note),'')));
 insert into public.notifications(profile_id,template,payload,dedupe_key)
 select customer_id,'order_status',jsonb_build_object('message','Your order status is now '||p_status||'.'),'order-status:'||o.id::text||':'||p_status
 from public.orders where id=o.id on conflict(dedupe_key) do nothing;
 return o;
end $$;
revoke all on function public.update_order_fulfillment(uuid,text,text) from public;
grant execute on function public.update_order_fulfillment(uuid,text,text) to authenticated;

create or replace function public.review_defective_claim(p_claim_id uuid,p_status text,p_note text default null)
returns public.defective_claims language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.defective_claims;
begin
 if not private.is_admin() then raise exception 'Administrator access required'; end if;
 if p_status not in ('under_review','approved','rejected','resolved') then raise exception 'Invalid claim status'; end if;
 update public.defective_claims set status=p_status,decision_note=nullif(trim(p_note),''),decided_by=auth.uid()
 where id=p_claim_id and status in ('submitted','under_review','approved') returning * into c;
 if not found then raise exception 'Claim cannot be updated'; end if;
 insert into public.admin_audit_log(actor_id,action,entity,entity_id,details) values(auth.uid(),'claim.status_changed','defective_claim',c.id::text,jsonb_build_object('status',p_status));
 insert into public.notifications(profile_id,template,payload,dedupe_key)
 values(c.customer_id,'claim_status',jsonb_build_object('message','Your product claim is now '||p_status||'.'),'claim-status:'||c.id::text||':'||p_status) on conflict(dedupe_key) do nothing;
 return c;
end $$;
revoke all on function public.review_defective_claim(uuid,text,text) from public;
grant execute on function public.review_defective_claim(uuid,text,text) to authenticated;

create or replace function public.queue_scheduled_notifications()
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare total integer;
begin
 perform public.expire_reservation_holds();
 insert into public.notifications(profile_id,template,payload,dedupe_key)
 select r.customer_id,'balance_reminder',jsonb_build_object('message','Your remaining trip balance deadline is approaching. Open your Egyptian Discovery account to review payment details.'), 'balance-reminder:'||r.id::text||':'||r.balance_due_at::date::text
 from public.reservations r where r.status='confirmed' and r.amount_paid<r.amount_due and r.balance_due_at between now() and now()+interval '24 hours'
 on conflict(dedupe_key) do nothing;
 insert into public.notifications(profile_id,template,payload,dedupe_key)
 select r.customer_id,'departure_reminder',jsonb_build_object('message','Your confirmed trip departs soon. Open your Egyptian Discovery account for trip details.'), 'departure-reminder:'||r.id::text||':'||t.departure_date::text
 from public.reservations r join public.trips t on t.id=r.trip_id
 where r.status in ('confirmed','fully_paid') and t.status='confirmed' and t.departure_date between current_date and current_date+1
 on conflict(dedupe_key) do nothing;
 get diagnostics total=row_count;
 return total;
end $$;
revoke all on function public.queue_scheduled_notifications() from public;
grant execute on function public.queue_scheduled_notifications() to service_role;

-- RLS: every customer-owned record is isolated; admin policy still requires a database role.
alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.trips enable row level security;
alter table public.trip_date_options enable row level security;
alter table public.reservations enable row level security;
alter table public.travelers enable row level security;
alter table public.traveler_identity_documents enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.payments enable row level security;
alter table public.receipts enable row level security;
alter table public.refunds enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.governorates enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.defective_claims enable row level security;
alter table public.referrals enable row level security;
alter table public.reward_ledger enable row level security;
alter table public.reviews enable row level security;
alter table public.gallery_items enable row level security;
alter table public.promo_codes enable row level security;
alter table public.business_settings enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.date_decisions enable row level security;
alter table public.notifications enable row level security;
alter table public.trip_expenses enable row level security;
alter table public.saved_destinations enable row level security;

create policy profile_read_self_or_admin on public.profiles for select to authenticated using(id=auth.uid() or private.is_admin());
create policy profile_update_self on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid() and role='customer');
create policy profile_admin_all on public.profiles for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy destinations_public_read on public.destinations for select to anon,authenticated using(status='published');
create policy destinations_admin_all on public.destinations for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy trips_public_read on public.trips for select to anon,authenticated using(status in ('gathering','under_review','confirmed','fully_booked','completed'));
create policy trips_admin_all on public.trips for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy date_options_public_read on public.trip_date_options for select to anon,authenticated using(exists(select 1 from public.trips t where t.id=trip_id and t.status in ('gathering','under_review','confirmed','fully_booked')));
create policy date_options_admin_all on public.trip_date_options for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy reservations_customer_read on public.reservations for select to authenticated using(customer_id=auth.uid() or private.is_admin());
create policy reservations_admin_update on public.reservations for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy travelers_customer_read on public.travelers for select to authenticated using(exists(select 1 from public.reservations r where r.id=reservation_id and (r.customer_id=auth.uid() or private.is_admin())));
create policy travelers_customer_write on public.travelers for all to authenticated using(private.is_admin() or exists(select 1 from public.reservations r where r.id=reservation_id and r.customer_id=auth.uid() and r.status='confirmed' and r.amount_paid>0)) with check(private.is_admin() or exists(select 1 from public.reservations r where r.id=reservation_id and r.customer_id=auth.uid() and r.status='confirmed' and r.amount_paid>0));
create policy identity_document_admin_read on public.traveler_identity_documents for select to authenticated using(private.is_admin());
create policy waitlist_self_read on public.waitlist_entries for select to authenticated using(customer_id=auth.uid() or private.is_admin());
create policy waitlist_self_join on public.waitlist_entries for insert to authenticated with check(customer_id=auth.uid() and status='waiting');
create policy waitlist_self_remove on public.waitlist_entries for update to authenticated using(customer_id=auth.uid() and status='waiting') with check(customer_id=auth.uid() and status='removed');
create policy waitlist_admin_all on public.waitlist_entries for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy payments_self_or_admin_read on public.payments for select to authenticated using(customer_id=auth.uid() or private.is_admin());
create policy payments_admin_update on public.payments for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy receipts_self_or_admin on public.receipts for select to authenticated using(exists(select 1 from public.payments p where p.id=payment_id and (p.customer_id=auth.uid() or private.is_admin())));
create policy refunds_self_or_admin on public.refunds for select to authenticated using(private.is_admin() or exists(select 1 from public.payments p where p.id=payment_id and p.customer_id=auth.uid()));
create policy refunds_admin_write on public.refunds for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy categories_public_read on public.product_categories for select to anon,authenticated using(true);
create policy categories_admin_all on public.product_categories for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy products_public_read on public.products for select to anon,authenticated using(status='published' and availability);
create policy products_admin_all on public.products for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy governorates_read on public.governorates for select to anon,authenticated using(enabled);
create policy governorates_admin_all on public.governorates for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy orders_self_or_admin_read on public.orders for select to authenticated using(customer_id=auth.uid() or private.is_admin());
create policy orders_admin_update on public.orders for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy order_items_self_or_admin on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=auth.uid() or private.is_admin())));
create policy order_items_admin_write on public.order_items for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy claims_self_read on public.defective_claims for select to authenticated using(customer_id=auth.uid() or private.is_admin());
create policy claims_self_insert on public.defective_claims for insert to authenticated with check(customer_id=auth.uid() and status='submitted' and cardinality(proof_paths)>0 and exists(select 1 from public.orders o join public.order_items i on i.order_id=o.id where o.id=order_id and i.id=order_item_id and o.customer_id=auth.uid() and o.status='delivered') and not exists(select 1 from unnest(proof_paths) path where path not like auth.uid()::text||'/'||order_id::text||'/%'));
create policy claims_admin_update on public.defective_claims for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy referrals_participant_read on public.referrals for select to authenticated using(referrer_id=auth.uid() or referred_id=auth.uid() or private.is_admin());
create policy referrals_admin_all on public.referrals for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy rewards_self_read on public.reward_ledger for select to authenticated using(profile_id=auth.uid() or private.is_admin());
create policy rewards_admin_all on public.reward_ledger for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy reviews_public_read on public.reviews for select to anon,authenticated using(status='published');
create policy reviews_customer_write on public.reviews for insert to authenticated with check(customer_id=auth.uid() and exists(select 1 from public.reservations r where r.customer_id=auth.uid() and r.trip_id=reviews.trip_id and r.status='confirmed'));
create policy reviews_admin_all on public.reviews for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy gallery_public_read on public.gallery_items for select to anon,authenticated using(status='published');
create policy gallery_admin_all on public.gallery_items for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy promo_public_read on public.promo_codes for select to anon,authenticated using(active and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now()));
create policy promo_admin_all on public.promo_codes for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy settings_admin_all on public.business_settings for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy audit_admin_read on public.admin_audit_log for select to authenticated using(private.is_admin());
create policy date_decision_owner_read on public.date_decisions for select to authenticated using(exists(select 1 from public.reservations r where r.id=reservation_id and (r.customer_id=auth.uid() or private.is_admin())));
create policy date_decision_admin_all on public.date_decisions for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy notification_owner_read on public.notifications for select to authenticated using(profile_id=auth.uid() or private.is_admin());
create policy notification_admin_all on public.notifications for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy trip_expenses_admin_all on public.trip_expenses for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy saved_destinations_owner on public.saved_destinations for all to authenticated using(profile_id=auth.uid() or private.is_admin()) with check(profile_id=auth.uid() or private.is_admin());

create or replace view public.public_reviews with (security_invoker=false) as
 select r.id,p.display_name,r.rating,r.review_en,r.review_ar,t.name_en as trip_name_en,t.name_ar as trip_name_ar,r.created_at
 from public.reviews r join public.profiles p on p.id=r.customer_id join public.trips t on t.id=r.trip_id where r.status='published';
create or replace view public.monthly_leaderboard with (security_invoker=false) as
 select p.id as profile_id,coalesce(p.display_name,'Explorer') as display_name,sum(l.points)::integer as points,
 dense_rank() over(order by sum(l.points) desc) as rank
 from public.reward_ledger l join public.profiles p on p.id=l.profile_id
 where l.created_at>=date_trunc('month',now()) and l.created_at<date_trunc('month',now())+interval '1 month'
 group by p.id,p.display_name;
create or replace view public.trip_demand with (security_invoker=false) as
 select t.id as trip_id,t.min_travelers,t.max_capacity,
  coalesce(sum(r.seats) filter(where r.status in ('deposit_paid','confirmed','fully_paid')),0)::integer as paid_travelers,
  case when coalesce(sum(r.seats) filter(where r.status in ('deposit_paid','confirmed','fully_paid')),0)>=t.max_capacity then 'fully_booked'
       when coalesce(sum(r.seats) filter(where r.status in ('deposit_paid','confirmed','fully_paid')),0)>=t.min_travelers then 'under_review'
       when coalesce(sum(r.seats) filter(where r.status in ('deposit_paid','confirmed','fully_paid')),0)>=greatest(1,ceil(t.min_travelers*0.75)) then 'almost_confirmed'
       else 'gathering' end as demand_status
 from public.trips t left join public.reservations r on r.trip_id=t.id group by t.id,t.min_travelers,t.max_capacity;

grant usage on schema public to anon,authenticated;
grant select on public.destinations,public.trips,public.trip_date_options,public.product_categories,public.products,public.governorates,public.public_reviews,public.monthly_leaderboard,public.trip_demand to anon,authenticated;
grant select on public.profiles to authenticated;
grant update(display_name,email,governorate) on public.profiles to authenticated;
grant select,insert,update on public.reservations,public.waitlist_entries,public.orders,public.defective_claims,public.reviews to authenticated;
grant select on public.travelers to authenticated;
grant select on public.receipts,public.refunds,public.order_items,public.referrals,public.reward_ledger to authenticated;
grant select on public.traveler_identity_documents to authenticated;
grant select,insert,delete on public.saved_destinations to authenticated;
grant select,insert,update,delete on public.trip_expenses,public.date_decisions,public.notifications to authenticated;
grant select,insert,update,delete on public.destinations,public.trips,public.trip_date_options,public.product_categories,public.products,public.governorates,public.refunds,public.promo_codes,public.business_settings to authenticated;
grant select,insert,update,delete on public.reservations,public.orders,public.order_items,public.waitlist_entries,public.defective_claims,public.referrals,public.reward_ledger,public.reviews,public.gallery_items,public.admin_audit_log to authenticated;

-- Private evidence and identity documents; public assets must use a separate bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('payment-proofs','payment-proofs',false,5242880,array['image/jpeg','image/png','application/pdf'])
on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('identity-documents','identity-documents',false,5242880,array['image/jpeg','image/png','application/pdf'])
on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('defect-claims','defect-claims',false,5242880,array['image/jpeg','image/png','application/pdf'])
on conflict(id) do nothing;
create policy payment_proofs_read_owner_or_admin on storage.objects for select to authenticated using(bucket_id='payment-proofs' and (storage.foldername(name))[1]=auth.uid()::text or bucket_id='payment-proofs' and private.is_admin());
create policy payment_proofs_insert_owner on storage.objects for insert to authenticated with check(bucket_id='payment-proofs' and (storage.foldername(name))[1]=auth.uid()::text);
create policy payment_proofs_update_owner on storage.objects for update to authenticated using(bucket_id='payment-proofs' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='payment-proofs' and (storage.foldername(name))[1]=auth.uid()::text);
create policy identity_documents_read_admin on storage.objects for select to authenticated using(bucket_id='identity-documents' and private.is_admin());
create policy identity_documents_insert_owner on storage.objects for insert to authenticated with check(bucket_id='identity-documents' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.reservations r where r.id=nullif((storage.foldername(name))[2],'')::uuid and r.customer_id=auth.uid() and r.status='confirmed' and r.amount_paid>0));
create policy defect_claim_proof_insert_owner on storage.objects for insert to authenticated with check(bucket_id='defect-claims' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.orders o where o.id=nullif((storage.foldername(name))[2],'')::uuid and o.customer_id=auth.uid() and o.status='delivered'));
create policy defect_claim_proof_read_owner_admin on storage.objects for select to authenticated using(bucket_id='defect-claims' and ((storage.foldername(name))[1]=auth.uid()::text or private.is_admin()));
