# Inventaris Alat Kesehatan

Website statis untuk data Supabase dari tabel:

- `ruangan`
- `user_petugas`
- `alat_kesehatan`
- `maintenance`
- `kalibrasi`
- `mutasi_alat`
- `register_user`

Fitur awal:

- Login petugas memakai `user_petugas.username` dan `user_petugas.password`
- Dashboard ringkasan
- Daftar ruangan
- Tambah dan lihat alat kesehatan
- Tambah dan lihat maintenance
- Tambah dan lihat kalibrasi
- Tambah dan lihat mutasi alat
- Pendaftaran user baru ke tabel `register_user`
- Approval Admin untuk membuat akun aktif di `user_petugas`
- Role register: `Admin`, `Teknisi`, `Kepala Ruangan`, `Vendor`
- Role tambahan `Kepala Supervisor`
- Status kepemilikan alat: Milik RS, KSO, Sewa
- Dashboard Pengajuan untuk alur teknisi/kepala ruangan/supervisor/vendor

## Akun contoh

- Username: `ZainAdmin`
- Password: `123`

## Buka lokal

Buka `index.html` di browser.

## Catatan Supabase

Jika data tidak muncul, cek RLS/policy tabel di Supabase. Untuk uji cepat, table perlu bisa diakses oleh anon key, atau buat policy `select`, `insert`, dan kebutuhan lain untuk role `anon`.

Untuk project Supabase baru/kosong, jalankan dulu `supabase_full_setup.sql` di Supabase SQL Editor. File ini membuat tabel dasar, tabel alur pengajuan/notifikasi/histori, policy demo, beberapa ruangan awal, dan akun admin `ZainAdmin` / `123`.

Saya sertakan `supabase_policies_demo.sql` untuk policy demo. Jalankan di Supabase SQL Editor jika dashboard belum bisa membaca/menambah data.

Setelah update ini, jalankan lagi `supabase_policies_demo.sql` supaya kolom baru untuk role tambahan, status kepemilikan alat, pengajuan, histori alat, foto progres, edit/delete, dan approval mutasi ikut dibuat.

Password saat ini mengikuti SQL kamu, yaitu plaintext di tabel `user_petugas`. Untuk produksi, sebaiknya pindah ke Supabase Auth atau hashing password.
