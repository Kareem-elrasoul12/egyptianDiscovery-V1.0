alter table public.trips
  add column if not exists images text[] not null default '{}';

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('trip-media', 'trip-media', true, 12582912, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy trip_media_public_read
  on storage.objects for select to public
  using (bucket_id = 'trip-media');

create policy trip_media_admin_upload
  on storage.objects for insert to authenticated
  with check (bucket_id = 'trip-media' and private.is_admin());
