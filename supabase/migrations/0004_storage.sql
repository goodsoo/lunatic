-- Storage buckets + RLS policies
-- Storage RLS is separate from table RLS. Bucket policies enforced on storage.objects.
--
-- Bucket conventions:
--   avatars/<user_id>/<filename>
--   event_photos/<event_id>/<filename>
--   store_images/<filename>

-- ============================================================
-- Buckets
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('event_photos', 'event_photos', false, 10 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('store_images', 'store_images', true, 10 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ============================================================
-- avatars: 본인만 업로드, 멤버만 읽기
-- ============================================================

create policy "avatars: members can read"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and is_approved_member()
);

create policy "avatars: self upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars: self update"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars: self delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- event_photos: admin 업로드, 공개 행사면 anon 읽기 / 비공개면 멤버만
-- ============================================================

create policy "event_photos: public events readable by anyone"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'event_photos'
  and exists (
    select 1 from events e
    where e.id::text = (storage.foldername(name))[1]
      and e.is_public = true
  )
);

create policy "event_photos: members read all"
on storage.objects for select to authenticated
using (
  bucket_id = 'event_photos'
  and is_approved_member()
);

create policy "event_photos: admin write"
on storage.objects for all to authenticated
using (
  bucket_id = 'event_photos'
  and is_admin_or_owner()
)
with check (
  bucket_id = 'event_photos'
  and is_admin_or_owner()
);

-- ============================================================
-- store_images: public bucket — read는 자동 (public=true).
-- write는 admin만.
-- ============================================================

create policy "store_images: admin write"
on storage.objects for all to authenticated
using (
  bucket_id = 'store_images'
  and is_admin_or_owner()
)
with check (
  bucket_id = 'store_images'
  and is_admin_or_owner()
);
