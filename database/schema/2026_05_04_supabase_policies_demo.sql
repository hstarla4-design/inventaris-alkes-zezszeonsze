-- Demo policies for this static website.
-- Use these only for testing. For production, replace plaintext password login
-- with Supabase Auth or server-side password verification.

alter table register_user add column if not exists ruangan_id uuid references ruangan(id);
alter table register_user add column if not exists nama_pt text;
alter table register_user add column if not exists vendor_layanan text;
alter table register_user drop constraint if exists register_user_role_check;
update register_user set role = 'Kepala Supervisor' where role in ('Supervisor', 'Kepala Unit');
alter table register_user add constraint register_user_role_check
check (role in ('Admin', 'Teknisi', 'Kepala Ruangan', 'Kepala Supervisor', 'Vendor'));

alter table user_petugas add column if not exists ruangan_id uuid references ruangan(id);
alter table user_petugas add column if not exists nama_pt text;
alter table user_petugas add column if not exists vendor_layanan text;
alter table user_petugas drop constraint if exists user_petugas_role_check;
update user_petugas set role = 'Kepala Supervisor' where role in ('Supervisor', 'Kepala Unit');
alter table user_petugas add constraint user_petugas_role_check
check (role in ('Admin', 'Teknisi', 'Kepala Ruangan', 'Kepala Supervisor', 'Vendor'));

alter table alat_kesehatan add column if not exists foto_alat text;
alter table alat_kesehatan add column if not exists harga_pembelian numeric;
alter table alat_kesehatan add column if not exists kalibrasi_awal date;
alter table alat_kesehatan add column if not exists tanggal_instalasi date;
alter table alat_kesehatan add column if not exists tanggal_sewa date;
alter table alat_kesehatan add column if not exists status_kepemilikan text default 'Milik RS';
alter table alat_kesehatan add column if not exists kso_nama_partner text;
alter table alat_kesehatan add column if not exists kso_tipe_kerja_sama text;
alter table alat_kesehatan add column if not exists kso_persen_rs text;
alter table alat_kesehatan add column if not exists kso_persen_vendor text;
alter table alat_kesehatan add column if not exists kso_persentase_bagi_hasil text;
alter table alat_kesehatan add column if not exists kso_fee_tetap numeric;
alter table alat_kesehatan add column if not exists kso_tanggal_mulai date;
alter table alat_kesehatan add column if not exists kso_tanggal_akhir date;
alter table alat_kesehatan add column if not exists kso_file_kontrak text;
alter table alat_kesehatan add column if not exists sewa_vendor_leasing text;
alter table alat_kesehatan add column if not exists sewa_biaya_per_bulan numeric;
alter table alat_kesehatan add column if not exists sewa_durasi_kontrak text;
alter table alat_kesehatan add column if not exists sewa_tanggal_mulai date;
alter table alat_kesehatan add column if not exists sewa_tanggal_akhir date;
alter table alat_kesehatan add column if not exists sewa_buyback text;
alter table alat_kesehatan add column if not exists sewa_file_kontrak text;

alter table maintenance add column if not exists vendor_pt text;
alter table maintenance add column if not exists status_progres text default 'Baru';
alter table maintenance add column if not exists foto_sebelum text;
alter table maintenance add column if not exists foto_sesudah text;
alter table maintenance add column if not exists foto_sparepart text;
alter table maintenance add column if not exists invoice text;
alter table maintenance add column if not exists service_type text default 'Maintenance';
alter table maintenance add column if not exists biaya_perbaikan numeric;
alter table maintenance drop constraint if exists maintenance_jenis_check;
update maintenance set jenis = 'Emergency (Breakdown)' where jenis = 'Inspection';
update maintenance set jenis = 'Corrective Ringan' where jenis = 'Corrective';
alter table maintenance add constraint maintenance_jenis_check
check (jenis in ('Preventive', 'Corrective Ringan', 'Corrective Berat', 'Emergency (Breakdown)'));

alter table kalibrasi add column if not exists vendor_pt text;
alter table kalibrasi add column if not exists status_progres text default 'Baru';
alter table kalibrasi add column if not exists foto_nilai_ukur text;
alter table kalibrasi add column if not exists foto_sertifikat text;
alter table kalibrasi add column if not exists service_type text default 'Kalibrasi';

alter table mutasi_alat add column if not exists status text default 'Pending';
alter table mutasi_alat add column if not exists approve_dari_status text default 'Pending';
alter table mutasi_alat add column if not exists approve_ke_status text default 'Pending';

create table if not exists pengajuan (
  id uuid primary key default gen_random_uuid(),
  jenis_pengajuan text,
  kategori text,
  alat_id uuid references alat_kesehatan(id) on delete cascade,
  ruangan_id uuid references ruangan(id),
  vendor_pt text,
  catatan text,
  dibuat_oleh text,
  dibuat_oleh_role text,
  tujuan_role text,
  status text default 'Draft',
  created_at timestamp default now()
);

create table if not exists notifikasi_teknisi (
  id uuid primary key default gen_random_uuid(),
  jenis_laporan text,
  kategori text,
  alat_id uuid references alat_kesehatan(id) on delete cascade,
  ruangan_id uuid references ruangan(id),
  catatan text,
  dibuat_oleh text,
  status text default 'Baru',
  created_at timestamp default now()
);

create table if not exists histori_alat (
  id uuid primary key default gen_random_uuid(),
  alat_id uuid references alat_kesehatan(id) on delete cascade,
  aksi text,
  petugas text,
  detail text,
  created_at timestamp default now()
);

alter table ruangan enable row level security;
alter table user_petugas enable row level security;
alter table alat_kesehatan enable row level security;
alter table maintenance enable row level security;
alter table kalibrasi enable row level security;
alter table mutasi_alat enable row level security;
alter table register_user enable row level security;
alter table pengajuan enable row level security;
alter table notifikasi_teknisi enable row level security;
alter table histori_alat enable row level security;

drop policy if exists "anon can read ruangan" on ruangan;
drop policy if exists "anon can read petugas for demo login" on user_petugas;
drop policy if exists "anon can insert petugas for demo approval" on user_petugas;
drop policy if exists "anon can read alat" on alat_kesehatan;
drop policy if exists "anon can insert alat" on alat_kesehatan;
drop policy if exists "anon can update alat" on alat_kesehatan;
drop policy if exists "anon can delete alat" on alat_kesehatan;
drop policy if exists "anon can read maintenance" on maintenance;
drop policy if exists "anon can insert maintenance" on maintenance;
drop policy if exists "anon can update maintenance" on maintenance;
drop policy if exists "anon can delete maintenance" on maintenance;
drop policy if exists "anon can read kalibrasi" on kalibrasi;
drop policy if exists "anon can insert kalibrasi" on kalibrasi;
drop policy if exists "anon can update kalibrasi" on kalibrasi;
drop policy if exists "anon can delete kalibrasi" on kalibrasi;
drop policy if exists "anon can read mutasi alat" on mutasi_alat;
drop policy if exists "anon can insert mutasi alat" on mutasi_alat;
drop policy if exists "anon can update mutasi alat" on mutasi_alat;
drop policy if exists "anon can read register user" on register_user;
drop policy if exists "anon can insert register user" on register_user;
drop policy if exists "anon can update register user" on register_user;
drop policy if exists "anon can delete register user" on register_user;
drop policy if exists "anon can read pengajuan" on pengajuan;
drop policy if exists "anon can insert pengajuan" on pengajuan;
drop policy if exists "anon can update pengajuan" on pengajuan;
drop policy if exists "anon can delete pengajuan" on pengajuan;
drop policy if exists "anon can read notifikasi teknisi" on notifikasi_teknisi;
drop policy if exists "anon can insert notifikasi teknisi" on notifikasi_teknisi;
drop policy if exists "anon can update notifikasi teknisi" on notifikasi_teknisi;
drop policy if exists "anon can delete notifikasi teknisi" on notifikasi_teknisi;
drop policy if exists "anon can read histori alat" on histori_alat;
drop policy if exists "anon can insert histori alat" on histori_alat;

create policy "anon can read ruangan"
on ruangan for select
to anon
using (true);

create policy "anon can read petugas for demo login"
on user_petugas for select
to anon
using (true);

create policy "anon can insert petugas for demo approval"
on user_petugas for insert
to anon
with check (true);

create policy "anon can read alat"
on alat_kesehatan for select
to anon
using (true);

create policy "anon can insert alat"
on alat_kesehatan for insert
to anon
with check (true);

create policy "anon can update alat"
on alat_kesehatan for update
to anon
using (true)
with check (true);

create policy "anon can delete alat"
on alat_kesehatan for delete
to anon
using (true);

create policy "anon can read maintenance"
on maintenance for select
to anon
using (true);

create policy "anon can insert maintenance"
on maintenance for insert
to anon
with check (true);

create policy "anon can update maintenance"
on maintenance for update
to anon
using (true)
with check (true);

create policy "anon can delete maintenance"
on maintenance for delete
to anon
using (true);

create policy "anon can read kalibrasi"
on kalibrasi for select
to anon
using (true);

create policy "anon can insert kalibrasi"
on kalibrasi for insert
to anon
with check (true);

create policy "anon can update kalibrasi"
on kalibrasi for update
to anon
using (true)
with check (true);

create policy "anon can delete kalibrasi"
on kalibrasi for delete
to anon
using (true);

create policy "anon can read mutasi alat"
on mutasi_alat for select
to anon
using (true);

create policy "anon can insert mutasi alat"
on mutasi_alat for insert
to anon
with check (true);

create policy "anon can update mutasi alat"
on mutasi_alat for update
to anon
using (true)
with check (true);

create policy "anon can read register user"
on register_user for select
to anon
using (true);

create policy "anon can insert register user"
on register_user for insert
to anon
with check (true);

create policy "anon can update register user"
on register_user for update
to anon
using (true)
with check (true);

create policy "anon can delete register user"
on register_user for delete
to anon
using (true);

create policy "anon can read pengajuan"
on pengajuan for select
to anon
using (true);

create policy "anon can insert pengajuan"
on pengajuan for insert
to anon
with check (true);

create policy "anon can update pengajuan"
on pengajuan for update
to anon
using (true)
with check (true);

create policy "anon can delete pengajuan"
on pengajuan for delete
to anon
using (true);

create policy "anon can read notifikasi teknisi"
on notifikasi_teknisi for select
to anon
using (true);

create policy "anon can insert notifikasi teknisi"
on notifikasi_teknisi for insert
to anon
with check (true);

create policy "anon can update notifikasi teknisi"
on notifikasi_teknisi for update
to anon
using (true)
with check (true);

create policy "anon can delete notifikasi teknisi"
on notifikasi_teknisi for delete
to anon
using (true);

create policy "anon can read histori alat"
on histori_alat for select
to anon
using (true);

create policy "anon can insert histori alat"
on histori_alat for insert
to anon
with check (true);

NOTIFY pgrst, 'reload schema';
