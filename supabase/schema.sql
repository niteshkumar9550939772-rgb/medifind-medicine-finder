-- MediFind V4 database
-- Prototype schema. RLS is enabled, but policies below are intentionally
-- permissive for local/demo testing. Before production, replace them with
-- authenticated user/pharmacy policies.

create table if not exists public.pharmacies (
  id uuid primary key,
  name text not null,
  city text not null default 'Hyderabad',
  address text,
  is_open boolean not null default true
);

create table if not exists public.medicines (
  id bigint generated always as identity primary key,
  name text not null unique,
  generic_name text,
  rx_required boolean not null default false
);

create table if not exists public.pharmacy_inventory (
  id bigint generated always as identity primary key,
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  medicine_id bigint not null references public.medicines(id) on delete cascade,
  price numeric(10,2) not null default 0,
  quantity integer not null default 0,
  unique(pharmacy_id, medicine_id)
);

create table if not exists public.reservations (
  id bigint generated always as identity primary key,
  customer_phone text,
  pharmacy_id uuid references public.pharmacies(id),
  fulfilment text not null default 'pickup',
  status text not null default 'Requested',
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.reservation_items (
  id bigint generated always as identity primary key,
  reservation_id bigint not null references public.reservations(id) on delete cascade,
  medicine_id bigint not null references public.medicines(id),
  quantity integer not null,
  unit_price numeric(10,2) not null
);

alter table public.pharmacies enable row level security;
alter table public.medicines enable row level security;
alter table public.pharmacy_inventory enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_items enable row level security;

-- Demo policies: open access for local prototype only.
drop policy if exists "demo pharmacies read" on public.pharmacies;
create policy "demo pharmacies read" on public.pharmacies for select to anon, authenticated using (true);

drop policy if exists "demo medicines read" on public.medicines;
create policy "demo medicines read" on public.medicines for select to anon, authenticated using (true);

drop policy if exists "demo inventory read" on public.pharmacy_inventory;
create policy "demo inventory read" on public.pharmacy_inventory for select to anon, authenticated using (true);

drop policy if exists "demo inventory write" on public.pharmacy_inventory;
create policy "demo inventory write" on public.pharmacy_inventory for all to anon, authenticated using (true) with check (true);

drop policy if exists "demo reservations all" on public.reservations;
create policy "demo reservations all" on public.reservations for all to anon, authenticated using (true) with check (true);

drop policy if exists "demo reservation items all" on public.reservation_items;
create policy "demo reservation items all" on public.reservation_items for all to anon, authenticated using (true) with check (true);

insert into public.pharmacies (id,name,city,address)
values ('11111111-1111-1111-1111-111111111111','MedPlus','Hyderabad','Kukatpally')
on conflict (id) do nothing;

insert into public.medicines (name,generic_name,rx_required) values
('Dolo 650','Paracetamol 650 mg',false),
('Cetirizine 10 mg','Cetirizine',false),
('Azithral 500','Azithromycin 500 mg',true),
('Pantop 40','Pantoprazole 40 mg',true)
on conflict (name) do nothing;

insert into public.pharmacy_inventory (pharmacy_id,medicine_id,price,quantity)
select '11111111-1111-1111-1111-111111111111', id,
case name when 'Dolo 650' then 32 when 'Cetirizine 10 mg' then 22 when 'Azithral 500' then 118 when 'Pantop 40' then 92 end,
case name when 'Dolo 650' then 48 when 'Cetirizine 10 mg' then 31 when 'Azithral 500' then 12 when 'Pantop 40' then 0 end
from public.medicines
where name in ('Dolo 650','Cetirizine 10 mg','Azithral 500','Pantop 40')
on conflict (pharmacy_id,medicine_id) do nothing;
