-- Seed akun admin utama
-- Jalankan di Supabase SQL Editor jika akun admin belum ada atau mau disamakan.

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
