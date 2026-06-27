-- Workflow vendor + surat otomatis setelah approve supervisor.
-- Jalankan di Supabase SQL Editor sebelum memakai dashboard vendor/email.

alter table user_petugas add column if not exists nama_pt text;
alter table user_petugas add column if not exists vendor_layanan text;

alter table register_user add column if not exists no_hp text;
alter table register_user add column if not exists email text;
alter table register_user add column if not exists telegram_id text;
alter table register_user add column if not exists nama_pt text;
alter table register_user add column if not exists vendor_layanan text;
alter table register_user add column if not exists ruangan_id uuid references ruangan(id);

alter table pengajuan add column if not exists dibuat_oleh_hp text;
alter table pengajuan add column if not exists vendor_pt text;
alter table pengajuan add column if not exists tujuan_role text default 'Kepala Ruangan';
alter table pengajuan add column if not exists status text default 'Menunggu Kepala Ruangan';

alter table maintenance add column if not exists vendor_pt text;
alter table maintenance add column if not exists service_type text default 'Maintenance';
alter table maintenance add column if not exists status_progres text default 'Baru';

alter table kalibrasi add column if not exists vendor_pt text;
alter table kalibrasi add column if not exists service_type text default 'Kalibrasi';
alter table kalibrasi add column if not exists status_progres text default 'Baru';

create table if not exists surat_vendor (
  id uuid primary key default gen_random_uuid(),
  pengajuan_id uuid references pengajuan(id) on delete set null,
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

create table if not exists email_queue (
  id uuid primary key default gen_random_uuid(),
  surat_id uuid references surat_vendor(id) on delete set null,
  to_email text not null,
  subject text not null,
  html_body text not null,
  status text default 'Queued',
  error_message text,
  sent_at timestamp,
  created_at timestamp default now()
);

create table if not exists feedback_vendor (
  id uuid primary key default gen_random_uuid(),
  layanan text check (layanan in ('Maintenance', 'Kalibrasi')),
  record_id uuid,
  alat_id uuid references alat_kesehatan(id) on delete cascade,
  vendor_pt text,
  status text default 'Proses',
  catatan text,
  dibuat_oleh text,
  created_at timestamp default now()
);

alter table surat_vendor enable row level security;
alter table email_queue enable row level security;
alter table feedback_vendor enable row level security;

drop policy if exists "surat_vendor_select_demo" on surat_vendor;
create policy "surat_vendor_select_demo" on surat_vendor for select using (true);
drop policy if exists "surat_vendor_insert_demo" on surat_vendor;
create policy "surat_vendor_insert_demo" on surat_vendor for insert with check (true);
drop policy if exists "surat_vendor_update_demo" on surat_vendor;
create policy "surat_vendor_update_demo" on surat_vendor for update using (true) with check (true);

drop policy if exists "email_queue_select_demo" on email_queue;
create policy "email_queue_select_demo" on email_queue for select using (true);
drop policy if exists "email_queue_insert_demo" on email_queue;
create policy "email_queue_insert_demo" on email_queue for insert with check (true);
drop policy if exists "email_queue_update_demo" on email_queue;
create policy "email_queue_update_demo" on email_queue for update using (true) with check (true);

drop policy if exists "feedback_vendor_select_demo" on feedback_vendor;
create policy "feedback_vendor_select_demo" on feedback_vendor for select using (true);
drop policy if exists "feedback_vendor_insert_demo" on feedback_vendor;
create policy "feedback_vendor_insert_demo" on feedback_vendor for insert with check (true);
drop policy if exists "feedback_vendor_update_demo" on feedback_vendor;
create policy "feedback_vendor_update_demo" on feedback_vendor for update using (true) with check (true);

-- Hapus permanen user maintenance typo sesuai permintaan.
delete from register_user
where lower(username) = lower('ZainMaintaince')
   or lower(nama) = lower('ZainMaintaince');

delete from user_petugas
where lower(username) = lower('ZainMaintaince')
   or lower(nama) = lower('ZainMaintaince');

-- Dummy alat tambahan. Jika saat ini 61 alat, empat data ini membuat total 65.
-- Tambah satu lagi bila target wajib tepat 66.
insert into alat_kesehatan (
  kode_barcode, nama_alat, merk, tipe, serial_number, ruangan_id, vendor, tahun_pembelian,
  kondisi, status, maintenance_terakhir, maintenance_berikutnya, kalibrasi_terakhir, kalibrasi_berikutnya
)
select *
from (
  values
    ('R002-INFANT-CPAP-FISHER-900', 'Infant CPAP', 'Fisher & Paykel', 'Bubble CPAP 900', 'CPAP-900-001', (select id from ruangan where nama_ruangan = 'NICU' limit 1), 'PT Neonatal Medika', 2024, 'Baik', 'Aktif', current_date - 80, current_date + 100, current_date - 120, current_date + 245),
    ('R004-DEFIB-MINDRAY-BENEHEART-D6', 'Defibrillator', 'Mindray', 'BeneHeart D6', 'D6-IGD-002', (select id from ruangan where nama_ruangan = 'IGD' limit 1), 'PT Servis Medika Nusantara', 2023, 'Maintenance', 'Aktif', current_date - 20, current_date + 40, current_date - 160, current_date + 205),
    ('R006-DR-XRAY-CANON-CXDI', 'DR X-Ray Detector', 'Canon', 'CXDI-710C', 'CXDI-710C-003', (select id from ruangan where nama_ruangan = 'Radiologi' limit 1), 'PT Kalibrasi Medika', 2025, 'Baik', 'Aktif', current_date - 60, current_date + 120, current_date - 90, current_date + 275),
    ('R007-BLOOD-GAS-RADIOMETER-ABL90', 'Blood Gas Analyzer', 'Radiometer', 'ABL90 FLEX', 'ABL90-004', (select id from ruangan where nama_ruangan = 'Laboratorium' limit 1), 'PT Lab Diagnostik Prima', 2024, 'Rusak', 'Aktif', current_date - 45, current_date + 30, current_date - 180, current_date + 185)
) as rows(kode_barcode,nama_alat,merk,tipe,serial_number,ruangan_id,vendor,tahun_pembelian,kondisi,status,maintenance_terakhir,maintenance_berikutnya,kalibrasi_terakhir,kalibrasi_berikutnya)
where not exists (
  select 1 from alat_kesehatan a where a.kode_barcode = rows.kode_barcode
);
