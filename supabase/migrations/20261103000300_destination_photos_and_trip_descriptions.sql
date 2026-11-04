alter table public.destinations
  add column if not exists images text[] not null default '{}';

alter table public.trips
  add column if not exists description_en text,
  add column if not exists description_ar text;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('destination-media', 'destination-media', true, 12582912, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy destination_media_public_read
  on storage.objects for select to public
  using (bucket_id = 'destination-media');

create policy destination_media_admin_upload
  on storage.objects for insert to authenticated
  with check (bucket_id = 'destination-media' and private.is_admin());
