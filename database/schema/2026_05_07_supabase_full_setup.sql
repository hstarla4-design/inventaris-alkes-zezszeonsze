-- Full bootstrap schema for Inventaris Alat Kesehatan.
-- Jalankan file ini di Supabase SQL Editor untuk project baru/kosong.
-- Policy anon di bawah ini hanya untuk demo website statis.

create extension if not exists pgcrypto;

create table if not exists public.ruangan (
  id uuid primary key default gen_random_uuid(),
  kode_ruangan text unique not null,
  nama_ruangan text not null,
  lantai text,
  penanggung_jawab text,
  created_at timestamp default now()
);

create table if not exists public.user_petugas (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  username text unique not null,
  password text not null,
  telegram_id text,
  role text default 'Teknisi',
  no_hp text,
  email text,
  status text default 'Aktif',
  ruangan_id uuid references public.ruangan(id),
  nama_pt text,
  vendor_layanan text,
  created_at timestamp default now()
);

create table if not exists public.register_user (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  username text unique not null,
  password text not null,
  telegram_id text,
  role text default 'Teknisi',
  no_hp text,
  email text,
  status text default 'Pending',
  ruangan_id uuid references public.ruangan(id),
  nama_pt text,
  vendor_layanan text,
  created_at timestamp default now()
);

alter table public.user_petugas drop constraint if exists user_petugas_role_check;
alter table public.user_petugas add constraint user_petugas_role_check
check (role in ('Admin', 'Teknisi', 'Kepala Ruangan', 'Kepala Supervisor', 'Vendor'));

alter table public.register_user drop constraint if exists register_user_role_check;
alter table public.register_user add constraint register_user_role_check
check (role in ('Admin', 'Teknisi', 'Kepala Ruangan', 'Kepala Supervisor', 'Vendor'));

create table if not exists public.alat_kesehatan (
  id uuid primary key default gen_random_uuid(),
  nama_alat text not null,
  foto_alat text,
  merk text,
  tipe text,
  serial_number text,
  kode_barcode text,
  harga_pembelian numeric,
  kalibrasi_awal date,
  ruangan_id uuid references public.ruangan(id),
  vendor text,
  tanggal_instalasi date,
  tanggal_sewa date,
  kondisi text default 'Baik',
  status text default 'Aktif',
  maintenance_terakhir date,
  kalibrasi_terakhir date,
  kalibrasi_berikutnya date,
  status_kepemilikan text default 'Milik RS',
  kso_nama_partner text,
  kso_tipe_kerja_sama text,
  kso_persen_rs text,
  kso_persen_vendor text,
  kso_persentase_bagi_hasil text,
  kso_fee_tetap numeric,
  kso_tanggal_mulai date,
  kso_tanggal_akhir date,
  kso_file_kontrak text,
  sewa_vendor_leasing text,
  sewa_biaya_per_bulan numeric,
  sewa_durasi_kontrak text,
  sewa_tanggal_mulai date,
  sewa_tanggal_akhir date,
  sewa_buyback text,
  sewa_file_kontrak text,
  created_at timestamp default now()
);

create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  alat_id uuid references public.alat_kesehatan(id) on delete cascade,
  jenis text,
  tanggal date,
  teknisi text,
  vendor_pt text,
  status_progres text default 'Baru',
  foto_sebelum text,
  foto_sesudah text,
  foto_sparepart text,
  invoice text,
  biaya_perbaikan numeric,
  hasil text,
  keterangan text,
  service_type text default 'Maintenance',
  created_at timestamp default now()
);

alter table public.maintenance drop constraint if exists maintenance_jenis_check;
alter table public.maintenance add constraint maintenance_jenis_check
check (jenis in ('Preventive', 'Corrective Ringan', 'Corrective Berat', 'Emergency (Breakdown)'));

create table if not exists public.kalibrasi (
  id uuid primary key default gen_random_uuid(),
  alat_id uuid references public.alat_kesehatan(id) on delete cascade,
  tanggal_kalibrasi date,
  berlaku_sampai date,
  vendor text,
  vendor_pt text,
  status_progres text default 'Baru',
  foto_nilai_ukur text,
  foto_sertifikat text,
  hasil text,
  nomor_sertifikat text,
  catatan text,
  service_type text default 'Kalibrasi',
  created_at timestamp default now()
);

create table if not exists public.mutasi_alat (
  id uuid primary key default gen_random_uuid(),
  alat_id uuid references public.alat_kesehatan(id) on delete cascade,
  dari_ruangan_id uuid references public.ruangan(id),
  ke_ruangan_id uuid references public.ruangan(id),
  tanggal_mutasi date,
  petugas text,
  alasan text,
  approve_dari_status text default 'Pending',
  approve_ke_status text default 'Pending',
  status text default 'Pending',
  created_at timestamp default now()
);

create table if not exists public.pengajuan (
  id uuid primary key default gen_random_uuid(),
  jenis_pengajuan text,
  kategori text,
  alat_id uuid references public.alat_kesehatan(id) on delete cascade,
  ruangan_id uuid references public.ruangan(id),
  vendor_pt text,
  catatan text,
  dibuat_oleh text,
  dibuat_oleh_role text,
  tujuan_role text,
  status text default 'Draft',
  created_at timestamp default now()
);

create table if not exists public.notifikasi_teknisi (
  id uuid primary key default gen_random_uuid(),
  jenis_laporan text,
  kategori text,
  alat_id uuid references public.alat_kesehatan(id) on delete cascade,
  ruangan_id uuid references public.ruangan(id),
  catatan text,
  dibuat_oleh text,
  dibuat_oleh_role text,
  tujuan_role text,
  status text default 'Baru',
  status_pengerjaan text default 'Belum dikerjakan',
  catatan_update text,
  foto_update text,
  parent_id uuid,
  created_at timestamp default now()
);

create table if not exists public.histori_alat (
  id uuid primary key default gen_random_uuid(),
  alat_id uuid references public.alat_kesehatan(id) on delete cascade,
  aksi text,
  petugas text,
  detail text,
  created_at timestamp default now()
);

insert into public.ruangan (kode_ruangan, nama_ruangan)
values
  ('IGD', 'Instalasi Gawat Darurat'),
  ('ICU', 'Intensive Care Unit'),
  ('OK', 'Kamar Operasi'),
  ('RAD', 'Radiologi'),
  ('LAB', 'Laboratorium')
on conflict (kode_ruangan) do nothing;

insert into public.user_petugas (
  nama,
  username,
  password,
  telegram_id,
  role,
  no_hp,
  email,
  status
)
values (
  'Zain Admin',
  'ZainAdmin',
  '123',
  null,
  'Admin',
  '082153542163',
  null,
  'Aktif'
)
on conflict (username) do update set
  nama = excluded.nama,
  password = excluded.password,
  telegram_id = excluded.telegram_id,
  role = excluded.role,
  no_hp = excluded.no_hp,
  email = excluded.email,
  status = excluded.status;

alter table public.ruangan enable row level security;
alter table public.user_petugas enable row level security;
alter table public.register_user enable row level security;
alter table public.alat_kesehatan enable row level security;
alter table public.maintenance enable row level security;
alter table public.kalibrasi enable row level security;
alter table public.mutasi_alat enable row level security;
alter table public.pengajuan enable row level security;
alter table public.notifikasi_teknisi enable row level security;
alter table public.histori_alat enable row level security;

drop policy if exists "anon can read ruangan" on public.ruangan;
drop policy if exists "anon can read petugas for demo login" on public.user_petugas;
drop policy if exists "anon can insert petugas for demo approval" on public.user_petugas;
drop policy if exists "anon can read register user" on public.register_user;
drop policy if exists "anon can insert register user" on public.register_user;
drop policy if exists "anon can update register user" on public.register_user;
drop policy if exists "anon can delete register user" on public.register_user;
drop policy if exists "anon can read alat" on public.alat_kesehatan;
drop policy if exists "anon can insert alat" on public.alat_kesehatan;
drop policy if exists "anon can update alat" on public.alat_kesehatan;
drop policy if exists "anon can delete alat" on public.alat_kesehatan;
drop policy if exists "anon can read maintenance" on public.maintenance;
drop policy if exists "anon can insert maintenance" on public.maintenance;
drop policy if exists "anon can update maintenance" on public.maintenance;
drop policy if exists "anon can delete maintenance" on public.maintenance;
drop policy if exists "anon can read kalibrasi" on public.kalibrasi;
drop policy if exists "anon can insert kalibrasi" on public.kalibrasi;
drop policy if exists "anon can update kalibrasi" on public.kalibrasi;
drop policy if exists "anon can delete kalibrasi" on public.kalibrasi;
drop policy if exists "anon can read mutasi alat" on public.mutasi_alat;
drop policy if exists "anon can insert mutasi alat" on public.mutasi_alat;
drop policy if exists "anon can update mutasi alat" on public.mutasi_alat;
drop policy if exists "anon can read pengajuan" on public.pengajuan;
drop policy if exists "anon can insert pengajuan" on public.pengajuan;
drop policy if exists "anon can update pengajuan" on public.pengajuan;
drop policy if exists "anon can delete pengajuan" on public.pengajuan;
drop policy if exists "anon can read notifikasi teknisi" on public.notifikasi_teknisi;
drop policy if exists "anon can insert notifikasi teknisi" on public.notifikasi_teknisi;
drop policy if exists "anon can update notifikasi teknisi" on public.notifikasi_teknisi;
drop policy if exists "anon can delete notifikasi teknisi" on public.notifikasi_teknisi;
drop policy if exists "anon can read histori alat" on public.histori_alat;
drop policy if exists "anon can insert histori alat" on public.histori_alat;

create policy "anon can read ruangan" on public.ruangan for select to anon using (true);
create policy "anon can read petugas for demo login" on public.user_petugas for select to anon using (true);
create policy "anon can insert petugas for demo approval" on public.user_petugas for insert to anon with check (true);
create policy "anon can read register user" on public.register_user for select to anon using (true);
create policy "anon can insert register user" on public.register_user for insert to anon with check (true);
create policy "anon can update register user" on public.register_user for update to anon using (true) with check (true);
create policy "anon can delete register user" on public.register_user for delete to anon using (true);
create policy "anon can read alat" on public.alat_kesehatan for select to anon using (true);
create policy "anon can insert alat" on public.alat_kesehatan for insert to anon with check (true);
create policy "anon can update alat" on public.alat_kesehatan for update to anon using (true) with check (true);
create policy "anon can delete alat" on public.alat_kesehatan for delete to anon using (true);
create policy "anon can read maintenance" on public.maintenance for select to anon using (true);
create policy "anon can insert maintenance" on public.maintenance for insert to anon with check (true);
create policy "anon can update maintenance" on public.maintenance for update to anon using (true) with check (true);
create policy "anon can delete maintenance" on public.maintenance for delete to anon using (true);
create policy "anon can read kalibrasi" on public.kalibrasi for select to anon using (true);
create policy "anon can insert kalibrasi" on public.kalibrasi for insert to anon with check (true);
create policy "anon can update kalibrasi" on public.kalibrasi for update to anon using (true) with check (true);
create policy "anon can delete kalibrasi" on public.kalibrasi for delete to anon using (true);
create policy "anon can read mutasi alat" on public.mutasi_alat for select to anon using (true);
create policy "anon can insert mutasi alat" on public.mutasi_alat for insert to anon with check (true);
create policy "anon can update mutasi alat" on public.mutasi_alat for update to anon using (true) with check (true);
create policy "anon can read pengajuan" on public.pengajuan for select to anon using (true);
create policy "anon can insert pengajuan" on public.pengajuan for insert to anon with check (true);
create policy "anon can update pengajuan" on public.pengajuan for update to anon using (true) with check (true);
create policy "anon can delete pengajuan" on public.pengajuan for delete to anon using (true);
create policy "anon can read notifikasi teknisi" on public.notifikasi_teknisi for select to anon using (true);
create policy "anon can insert notifikasi teknisi" on public.notifikasi_teknisi for insert to anon with check (true);
create policy "anon can update notifikasi teknisi" on public.notifikasi_teknisi for update to anon using (true) with check (true);
create policy "anon can delete notifikasi teknisi" on public.notifikasi_teknisi for delete to anon using (true);
create policy "anon can read histori alat" on public.histori_alat for select to anon using (true);
create policy "anon can insert histori alat" on public.histori_alat for insert to anon with check (true);

notify pgrst, 'reload schema';
