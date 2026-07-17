-- Bucket privado para os currículos.
-- Convenção de path: <user_id>/<uuid>.pdf — a primeira pasta é o dono, e é
-- isso que as policies checam.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs',
  'cvs',
  false,                      -- privado: acesso só por signed URL
  10485760,                   -- 10 MB, igual ao limite anunciado na tela de onboarding
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy "cv_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "cv_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "cv_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "cv_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
