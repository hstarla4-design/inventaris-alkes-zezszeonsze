alter table public.user_petugas add column if not exists nama_pt text;
alter table public.user_petugas add column if not exists vendor_layanan text;

alter table public.register_user add column if not exists no_hp text;
alter table public.register_user add column if not exists email text;
alter table public.register_user add column if not exists telegram_id text;
alter table public.register_user add column if not exists nama_pt text;
alter table public.register_user add column if not exists vendor_layanan text;
alter table public.register_user add column if not exists ruangan_id uuid references public.ruangan(id);

alter table public.pengajuan add column if not exists dibuat_oleh_hp text;
alter table public.pengajuan add column if not exists vendor_pt text;
alter table public.pengajuan add column if not exists tujuan_role text default 'Kepala Ruangan';
alter table public.pengajuan add column if not exists status text default 'Menunggu Kepala Ruangan';

alter table public.maintenance add column if not exists vendor_pt text;
alter table public.maintenance add column if not exists service_type text default 'Maintenance';
alter table public.maintenance add column if not exists status_progres text default 'Baru';

alter table public.kalibrasi add column if not exists vendor_pt text;
alter table public.kalibrasi add column if not exists service_type text default 'Kalibrasi';
alter table public.kalibrasi add column if not exists status_progres text default 'Baru';

create table if not exists public.surat_vendor (
  id uuid primary key default gen_random_uuid(),
  pengajuan_id uuid references public.pengajuan(id) on delete set null,
  record_ref text,
  nomor_surat text unique,
  vendor_pt text,
  jenis_layanan text check (jenis_layanan in ('Maintenance', 'Kalibrasi')),
  subject text,
  to_email text,
  html_surat text,
  email_status text default 'Queued',
  dibuat_oleh text,
  created_at timestamp default now()
);

create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  surat_id uuid references public.surat_vendor(id) on delete set null,
  to_email text not null,
  subject text not null,
  html_body text not null,
  status text default 'Queued',
  error_message text,
  sent_at timestamp,
  created_at timestamp default now()
);

create table if not exists public.feedback_vendor (
  id uuid primary key default gen_random_uuid(),
  layanan text check (layanan in ('Maintenance', 'Kalibrasi')),
  record_id uuid,
  alat_id uuid references public.alat_kesehatan(id) on delete cascade,
  vendor_pt text,
  status text default 'Proses',
  catatan text,
  dibuat_oleh text,
  created_at timestamp default now()
);

alter table public.surat_vendor enable row level security;
alter table public.email_queue enable row level security;
alter table public.feedback_vendor enable row level security;

drop policy if exists "surat_vendor_select_demo" on public.surat_vendor;
create policy "surat_vendor_select_demo" on public.surat_vendor for select to anon using (true);
drop policy if exists "surat_vendor_insert_demo" on public.surat_vendor;
create policy "surat_vendor_insert_demo" on public.surat_vendor for insert to anon with check (true);
drop policy if exists "surat_vendor_update_demo" on public.surat_vendor;
create policy "surat_vendor_update_demo" on public.surat_vendor for update to anon using (true) with check (true);

drop policy if exists "email_queue_select_demo" on public.email_queue;
create policy "email_queue_select_demo" on public.email_queue for select to anon using (true);
drop policy if exists "email_queue_insert_demo" on public.email_queue;
create policy "email_queue_insert_demo" on public.email_queue for insert to anon with check (true);
drop policy if exists "email_queue_update_demo" on public.email_queue;
create policy "email_queue_update_demo" on public.email_queue for update to anon using (true) with check (true);

drop policy if exists "feedback_vendor_select_demo" on public.feedback_vendor;
create policy "feedback_vendor_select_demo" on public.feedback_vendor for select to anon using (true);
drop policy if exists "feedback_vendor_insert_demo" on public.feedback_vendor;
create policy "feedback_vendor_insert_demo" on public.feedback_vendor for insert to anon with check (true);
drop policy if exists "feedback_vendor_update_demo" on public.feedback_vendor;
create policy "feedback_vendor_update_demo" on public.feedback_vendor for update to anon using (true) with check (true);
