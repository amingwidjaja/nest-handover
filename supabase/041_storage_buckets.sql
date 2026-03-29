-- =========================================================
-- FILE: 041_storage_buckets.sql
-- PURPOSE:
--   Setup storage buckets untuk nest76-platform.
--   Dirun sekali di project baru.
--
--   BUCKETS:
--   1. nest-evidence  → NEST Paket
--      - foto handover (package photo, proof photo)
--      - receipt PDF
--      - layout: paket/{user_id}/{handover_id}/...
--
--   2. designs        → NEST Factory
--      - design files (AI, PSD, PNG, PDF)
--      - marker files (PLT, DXF)
--      - document uploads (CO/PO PDF)
--      - layout: designs/{article_code}/v{n}/...
--                markers/{article_code}/...
--                documents/{org_id}/{upload_id}/...
-- =========================================================

-- ---------------------------------------------------------
-- 1) nest-evidence bucket (NEST Paket)
-- ---------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'nest-evidence',
    'nest-evidence',
    true,   -- public: URL bisa diakses tanpa auth (untuk foto bukti)
    10485760,  -- 10MB max per file
    array[
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
    ]
)
on conflict (id) do nothing;

-- RLS policies untuk nest-evidence
-- User bisa upload ke folder miliknya sendiri
create policy "nest_evidence_insert_own"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'nest-evidence'
    and (storage.foldername(name))[1] = 'paket'
    and (storage.foldername(name))[2] = auth.uid()::text
);

-- User bisa update/delete file miliknya sendiri
create policy "nest_evidence_update_own"
on storage.objects for update to authenticated
using (
    bucket_id = 'nest-evidence'
    and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "nest_evidence_delete_own"
on storage.objects for delete to authenticated
using (
    bucket_id = 'nest-evidence'
    and (storage.foldername(name))[2] = auth.uid()::text
);

-- Public read (foto bukti bisa dilihat siapapun via URL)
create policy "nest_evidence_public_read"
on storage.objects for select
using (bucket_id = 'nest-evidence');

-- ---------------------------------------------------------
-- 2) designs bucket (NEST Factory)
-- ---------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'designs',
    'designs',
    false,  -- private: hanya authenticated user yang bisa akses
    52428800,  -- 50MB max per file (design files bisa besar)
    array[
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/postscript',   -- .ai files
        'application/octet-stream', -- .psd, .plt, .dxf, dll
        'image/vnd.dxf',
        'application/dxf'
    ]
)
on conflict (id) do nothing;

-- Authenticated user bisa upload design files
create policy "designs_insert_authenticated"
on storage.objects for insert to authenticated
with check (bucket_id = 'designs');

-- Authenticated user bisa read design files
create policy "designs_select_authenticated"
on storage.objects for select to authenticated
using (bucket_id = 'designs');

-- Authenticated user bisa update/delete
create policy "designs_update_authenticated"
on storage.objects for update to authenticated
using (bucket_id = 'designs');

create policy "designs_delete_authenticated"
on storage.objects for delete to authenticated
using (bucket_id = 'designs');
